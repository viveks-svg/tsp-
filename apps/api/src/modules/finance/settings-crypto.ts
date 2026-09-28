import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Encrypts secrets stored in the database (e.g. the Razorpay key secret) with
 * AES-256-GCM. The key comes from SETTINGS_ENCRYPTION_KEY (any long random
 * string); without it, secrets can't be saved from the admin panel.
 */

const key = () => {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  return raw && raw.length >= 32 ? createHash("sha256").update(raw).digest() : null;
};

export const canEncryptSettings = () => key() !== null;

export function encryptSecret(plain: string): string {
  const k = key();
  if (!k) throw new Error("SETTINGS_ENCRYPTION_KEY is not configured on the server.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(stored: string): string {
  const k = key();
  if (!k) throw new Error("SETTINGS_ENCRYPTION_KEY is not configured on the server.");
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1") throw new Error("Unknown secret format.");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

/** "rzp_live_****WXYZ" — enough to recognise a key without revealing it. */
export const maskKey = (value: string | null | undefined) =>
  !value ? null : value.length <= 8 ? "****" : `${value.slice(0, value.indexOf("_", 4) + 1 || 4)}****${value.slice(-4)}`;
