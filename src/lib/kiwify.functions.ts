import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";

ed.hashes.sha512 = sha512;

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

class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  readUint32(): number {
    if (this.offset + 4 > this.bytes.length) throw new Error("chave OpenSSH incompleta");
    const value =
      ((this.bytes[this.offset]! << 24) |
        (this.bytes[this.offset + 1]! << 16) |
        (this.bytes[this.offset + 2]! << 8) |
        this.bytes[this.offset + 3]!) >>>
      0;
    this.offset += 4;
    return value;
  }

  readBytes(): Uint8Array {
    const length = this.readUint32();
    if (this.offset + length > this.bytes.length) throw new Error("chave OpenSSH incompleta");
    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readString(): string {
    return new TextDecoder().decode(this.readBytes());
  }
}

function extractOpenSshSeed(raw: Uint8Array): Uint8Array | undefined {
  const magic = new TextEncoder().encode("openssh-key-v1\0");
  if (raw.length < magic.length || !magic.every((byte, i) => raw[i] === byte)) {
    return undefined;
  }

  const reader = new ByteReader(raw.slice(magic.length));
  const cipherName = reader.readString();
  reader.readString(); // kdf name
  reader.readBytes(); // kdf options
  const keyCount = reader.readUint32();
  if (cipherName !== "none") {
    throw new Error("a chave OpenSSH está protegida por senha; gere uma chave sem senha para a API");
  }
  if (keyCount !== 1) throw new Error("chave OpenSSH com quantidade inválida de chaves");

  reader.readBytes(); // public key
  const privateBlock = new ByteReader(reader.readBytes());
  const check1 = privateBlock.readUint32();
  const check2 = privateBlock.readUint32();
  if (check1 !== check2) throw new Error("chave OpenSSH inválida");
  if (privateBlock.readString() !== "ssh-ed25519") throw new Error("a chave precisa ser Ed25519");

  privateBlock.readBytes(); // public key bytes
  const privateKey = privateBlock.readBytes(); // 64 bytes: seed + public key
  if (privateKey.length < 32) throw new Error("chave OpenSSH Ed25519 inválida");
  return privateKey.slice(0, 32);
}

// Extract the 32-byte Ed25519 seed from any common format the user might paste:
// - PEM ("-----BEGIN ... PRIVATE KEY-----")
// - base64 / base64url of PKCS#8 (48 bytes) or raw seed (32 bytes) or seed+pub (64 bytes)
// - hex of any of the above
function extractSeed(input: string): Uint8Array {
  const trimmed = input.trim();

  let raw: Uint8Array;

  if (trimmed.includes("-----BEGIN")) {
    const body = trimmed
      .replace(/-----BEGIN [^-]+-----/g, "")
      .replace(/-----END [^-]+-----/g, "")
      .replace(/\s+/g, "");
    raw = base64ToUint8Array(body);
  } else {
    const hexCandidate = trimmed.replace(/\s+/g, "");
    const isHex =
      /^(0x)?[0-9a-fA-F]+$/.test(hexCandidate) &&
      hexCandidate.replace(/^0x/i, "").length % 2 === 0 &&
      (hexCandidate.replace(/^0x/i, "").length === 64 ||
        hexCandidate.replace(/^0x/i, "").length === 96 ||
        hexCandidate.replace(/^0x/i, "").length === 128);
    raw = isHex ? hexToUint8Array(hexCandidate) : base64ToUint8Array(trimmed);
  }

  const openSshSeed = extractOpenSshSeed(raw);
  if (openSshSeed) return openSshSeed;

  // PKCS#8 Ed25519 is 48 bytes; the last 32 bytes are the seed
  if (raw.length === 48 && raw[0] === 0x30) return raw.slice(16, 48);
  if (raw.length >= 46 && raw[0] === 0x30) return raw.slice(raw.length - 32);
  if (raw.length === 32) return raw;
  if (raw.length === 64) return raw.slice(0, 32);

  throw new Error(
    `formato da chave não reconhecido (${raw.length} bytes). Use PEM, base64 PKCS#8, ou seed Ed25519 de 32 bytes.`,
  );
}

async function signRequest(
  privateKeyStr: string,
  uri: string,
  method: string,
  body: string,
  timestamp: string,
): Promise<string> {
  const seed = extractSeed(privateKeyStr);
  const payload = `${uri}:${method}:${body}:${timestamp}`;
  const data = new TextEncoder().encode(payload);
  const sig = await ed.signAsync(data, seed);
  return uint8ToBase64(sig);
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
    const documentNumber = data.document_number.replace(/\D+/g, "");

    const body = JSON.stringify({
      amount_in_cents: data.amount_in_cents,
      type: "INSTANT",
      accept_change_value: false,
      expiration: 3600,
      external_reference_id:
        data.external_reference_id ?? `kit-junino-${Date.now()}`,
      payer_data: {
        name: data.name,
        document_number: documentNumber,
        document_type: documentNumber.length === 14 ? "cnpj" : "cpf",
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
