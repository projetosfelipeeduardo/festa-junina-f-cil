import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  amount_in_cents: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  document_number: z.string().trim().min(11).max(20),
  email: z.string().trim().email().max(180).optional(),
  external_reference_id: z.string().trim().min(1).max(120).optional(),
});

function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function toAB(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

// Try to import Ed25519 private key from PKCS#8 or raw 32-byte seed (base64).
async function importEd25519PrivateKey(b64: string): Promise<CryptoKey> {
  const raw = base64ToUint8Array(b64);
  // PKCS#8 starts with 0x30 (SEQUENCE)
  if (raw[0] === 0x30) {
    return crypto.subtle.importKey("pkcs8", raw, { name: "Ed25519" }, false, ["sign"]);
  }
  if (raw.length === 32) {
    // Wrap raw seed into a minimal PKCS#8 structure for Ed25519.
    // Header: 302e020100300506032b657004220420 (16 bytes) + 32-byte seed
    const header = new Uint8Array([
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
      0x04, 0x22, 0x04, 0x20,
    ]);
    const pkcs8 = new Uint8Array(header.length + raw.length);
    pkcs8.set(header, 0);
    pkcs8.set(raw, header.length);
    return crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
  }
  throw new Error(
    "KIWIFY_PRIVATE_KEY format not recognized. Provide a base64-encoded Ed25519 PKCS#8 key or a 32-byte raw seed.",
  );
}

async function signRequest(
  privateKeyB64: string,
  uri: string,
  method: string,
  body: string,
  timestamp: string,
): Promise<string> {
  const key = await importEd25519PrivateKey(privateKeyB64);
  const payload = `${uri}:${method}:${body}:${timestamp}`;
  const data = new TextEncoder().encode(payload);
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, key, data);
  return uint8ToBase64(new Uint8Array(sig));
}

export const createKiwifyPixCharge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const accessId = process.env.KIWIFY_ACCESS_ID;
    const privateKey = process.env.KIWIFY_PRIVATE_KEY;

    if (!accessId || !privateKey) {
      return {
        ok: false as const,
        error: "Pagamento indisponível no momento. Tente novamente em instantes.",
      };
    }

    const uri = "/v1/dynamic-qrcode";
    const method = "POST";
    const timestamp = Date.now().toString();

    const body = JSON.stringify({
      amount_in_cents: data.amount_in_cents,
      type: "INSTANT",
      accept_change_value: false,
      expiration: 3600,
      external_reference_id:
        data.external_reference_id ?? `kit-junino-${Date.now()}`,
      payer_data: {
        name: data.name,
        document_number: data.document_number,
      },
    });

    let signature: string;
    try {
      signature = await signRequest(privateKey, uri, method, body, timestamp);
    } catch (err) {
      console.error("Kiwify signature error:", err);
      return {
        ok: false as const,
        error: "Erro ao assinar a requisição de pagamento.",
      };
    }

    try {
      const res = await fetch(`https://conta-public-api.kiwify.com${uri}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-access-id": accessId,
          "X-PoP-Format": "service-account",
          "X-PoP-Challenge": timestamp,
          "X-PoP-Signature": signature,
        },
        body,
      });

      const text = await res.text();
      if (!res.ok) {
        console.error("Kiwify API error:", res.status, text);
        return {
          ok: false as const,
          error: `Não foi possível gerar o PIX (${res.status}). Tente novamente.`,
        };
      }

      const json = JSON.parse(text) as {
        id: string;
        copy_paste: string;
        picture_code_base64: string;
        external_reference_id?: string | null;
      };

      return {
        ok: true as const,
        id: json.id,
        copyPaste: json.copy_paste,
        qrCodeBase64: json.picture_code_base64,
      };
    } catch (err) {
      console.error("Kiwify request failed:", err);
      return {
        ok: false as const,
        error: "Falha de conexão com o gateway de pagamento.",
      };
    }
  });
