import * as crypto from "crypto";

/**
 * Time-based one-time codes (RFC 6238) — the 6-digit codes an authenticator
 * app (Google Authenticator, Microsoft Authenticator, 1Password…) shows,
 * changing every 30 seconds.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(buf: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string) {
  const clean = text.replace(/=+$/, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(crypto.randomBytes(20));

function codeAt(secret: Buffer, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

/**
 * The time step the code belongs to (allowing one step of clock drift either
 * way), or null. Callers reject steps at or before the last one used, so each
 * code works only once.
 */
export function matchTotp(secretBase32: string, code: string, now = Date.now()): number | null {
  const digits = String(code).replace(/\s+/g, "");
  if (!/^\d{6}$/.test(digits)) return null;
  const secret = base32Decode(secretBase32);
  const step = currentStep(now);
  for (const s of [step, step - 1, step + 1]) {
    const expected = codeAt(secret, s);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(digits))) return s;
  }
  return null;
}

export const otpauthUrl = (secretBase32: string, account: string, issuer = "Time Space & Planets") =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;

/** Ten one-time recovery codes like "7K4P-9QXM", for when the phone is lost. */
export function newRecoveryCodes(count = 10) {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: count }, () => {
    const bytes = crypto.randomBytes(8);
    const s = Array.from(bytes, (b) => chars[b % chars.length]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

export const hashRecoveryCode = (code: string) =>
  crypto.createHash("sha256").update(code.replace(/[\s-]/g, "").toUpperCase()).digest("hex");
