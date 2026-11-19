import "server-only";

import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Encryption at rest for the identity-verification lab. Every capture and every session record is
// encrypted with AES-256-GCM before it's stored, with a fresh random nonce per file, so the storage
// bucket (and its backups) only ever hold ciphertext. The key is VERIFICATION_ENCRYPTION_KEY
// (32 bytes, base64), kept on the server only. Losing it makes the captures unreadable.
//
// Format: "PLR1" | 12-byte nonce | 16-byte tag | ciphertext.

const MAGIC = Buffer.from("PLR1");

function key(): Buffer | null {
  const raw = process.env.VERIFICATION_ENCRYPTION_KEY;
  if (!raw) return null;
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("VERIFICATION_ENCRYPTION_KEY must be 32 bytes, base64");
  return k;
}

export function encryptionOn() {
  return key() !== null;
}

export function encrypt(data: Buffer): Buffer {
  const k = key();
  if (!k) return data; // local development without a key: stored as is
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, nonce);
  const body = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, cipher.getAuthTag(), body]);
}

export function decrypt(data: Buffer): Buffer {
  if (data.length < 32 || !data.subarray(0, 4).equals(MAGIC)) return data; // stored before encryption was on
  const k = key();
  if (!k) throw new Error("This capture is encrypted and VERIFICATION_ENCRYPTION_KEY is not set");
  const decipher = createDecipheriv("aes-256-gcm", k, data.subarray(4, 16));
  decipher.setAuthTag(data.subarray(16, 32));
  return Buffer.concat([decipher.update(data.subarray(32)), decipher.final()]);
}

/**
 * A key for signing the lab's cookies, derived from the encryption key. Without one (development on
 * this machine only), a fixed local key, so every part of the app agrees on it.
 */
function signingKey() {
  const k = key() ?? createHmac("sha256", "plar-lab-dev-only").update(process.cwd()).digest();
  return createHmac("sha256", k).update("plar-lab-cookie-v1").digest();
}

export function sign(value: string) {
  return `${value}.${createHmac("sha256", signingKey()).update(value).digest("base64url")}`;
}

/** Returns the value if the signature is good, otherwise null. In production, nothing verifies without the real key. */
export function verify(signed: string | undefined): string | null {
  if (!signed || (process.env.NODE_ENV === "production" && !key())) return null;
  const i = signed.lastIndexOf(".");
  if (i < 1) return null;
  const value = signed.slice(0, i);
  const expected = Buffer.from(sign(value).slice(i + 1));
  const given = Buffer.from(signed.slice(i + 1));
  return expected.length === given.length && timingSafeEqual(expected, given) ? value : null;
}

/** Constant-time string comparison (for the unlock password). */
export function sameText(a: string, b: string) {
  const x = createHmac("sha256", "cmp").update(a).digest();
  const y = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(x, y);
}
