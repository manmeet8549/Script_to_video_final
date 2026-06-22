import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { encryptionKey } from "@/lib/env";

// AES-256-GCM encryption for provider API keys stored at rest in workspace_apis.
// Layout of the stored value (base64): [12-byte IV][16-byte auth tag][ciphertext].

const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = encryptionKey().trim();
  // Accept either a 64-char hex string or a base64-encoded 32-byte key.
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64). Generate one with: " +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
