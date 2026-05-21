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
  const clean = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "").replace(/^0x/i, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
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

// Decode the KIWIFY_PRIVATE_KEY env var. Accepts:
// - PEM ("-----BEGIN PRIVATE KEY-----..." or "-----BEGIN ED25519 PRIVATE KEY-----...")
// - Base64 (or base64url) of a PKCS#8 blob
// - Base64 (or base64url) of a 32-byte raw seed
// - Hex (with or without 0x prefix) of a PKCS#8 blob or 32-byte raw seed
function decodePrivateKey(input: string): Uint8Array {
  const trimmed = input.trim();

  // PEM
  if (trimmed.includes("-----BEGIN")) {
    const body = trimmed
      .replace(/-----BEGIN [^-]+-----/g, "")
      .replace(/-----END [^-]+-----/g, "")
      .replace(/\s+/g, "");
    return base64ToUint8Array(body);
  }

  // Hex (only 0-9a-f, even length, no other chars)
  const hexOnly = trimmed.replace(/\s+/g, "");
  if (/^(0x)?[0-9a-fA-F]+$/.test(hexOnly) && hexOnly.replace(/^0x/i, "").length % 2 === 0) {
    const expectedLen = hexOnly.replace(/^0x/i, "").length / 2;
    // Heuristic: hex of a 32-byte seed is 64 chars; PKCS#8 is typically 46-48 bytes (92-96 chars).
    if (expectedLen === 32 || expectedLen >= 40) {
      return hexToUint8Array(hexOnly);
    }
  }

  // Base64 / base64url
  return base64ToUint8Array(trimmed);
}

async function importEd25519PrivateKey(input: string): Promise<CryptoKey> {
  const raw = decodePrivateKey(input);

  // PKCS#8 starts with 0x30 (SEQUENCE) and is at least ~46 bytes for Ed25519
  if (raw.length >= 46 && raw[0] === 0x30) {
    return crypto.subtle.importKey("pkcs8", toAB(raw), { name: "Ed25519" }, false, ["sign"]);
  }
  if (raw.length === 32) {
    const header = new Uint8Array([
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
      0x04, 0x22, 0x04, 0x20,
    ]);
    const pkcs8 = new Uint8Array(header.length + raw.length);
    pkcs8.set(header, 0);
    pkcs8.set(raw, header.length);
    return crypto.subtle.importKey("pkcs8", toAB(pkcs8), { name: "Ed25519" }, false, ["sign"]);
  }
  // 64 bytes: some libraries export seed+public concatenated; first 32 is the seed
  if (raw.length === 64) {
    const seed = raw.slice(0, 32);
    const header = new Uint8Array([
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
      0x04, 0x22, 0x04, 0x20,
    ]);
    const pkcs8 = new Uint8Array(header.length + seed.length);
    pkcs8.set(header, 0);
    pkcs8.set(seed, header.length);
    return crypto.subtle.importKey("pkcs8", toAB(pkcs8), { name: "Ed25519" }, false, ["sign"]);
  }
  throw new Error(
    `KIWIFY_PRIVATE_KEY format not recognized (decoded length: ${raw.length} bytes). ` +
      `Expected PEM, base64/hex of PKCS#8, or 32-byte raw Ed25519 seed.`,
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
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, key, toAB(data));
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
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Kiwify signature error:", err);
      return {
        ok: false as const,
        error: `Erro ao assinar a requisição: ${msg}`,
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
