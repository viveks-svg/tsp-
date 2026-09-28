import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { canEncryptSettings, decryptSecret, encryptSecret, maskKey } from "./settings-crypto";

/**
 * Money settings, editable by super admins:
 *   - "finance":  commission, the manager approval limit, whether bookings count
 *                 towards the astrologer's earnings;
 *   - "razorpay": which Razorpay account takes payments (secrets encrypted).
 * Razorpay falls back to the server's .env keys until keys are saved here.
 */

export interface FinanceSettings {
  commissionPercent: number;
  managerApprovalLimit: number;
  bookingEarnings: boolean;
}

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  mode: "TEST" | "LIVE";
  source: "ADMIN" | "ENV";
}

interface StoredRazorpay {
  keyId: string;
  keySecret: string; // encrypted
  webhookSecret?: string | null; // encrypted
}

export const DEFAULT_FINANCE: FinanceSettings = {
  commissionPercent: 10,
  managerApprovalLimit: 5000,
  bookingEarnings: true,
};

const FINANCE_KEY = "finance";
const RAZORPAY_KEY = "razorpay";
const CACHE_MS = 30_000;

const modeOf = (keyId: string): "TEST" | "LIVE" => (keyId.startsWith("rzp_live_") ? "LIVE" : "TEST");

@Injectable()
export class FinanceSettingsService {
  private readonly logger = new Logger(FinanceSettingsService.name);
  private razorpayCache: { at: number; value: RazorpayCredentials } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  // ── Finance ──────────────────────────────────────────────────────────────

  async getFinance(): Promise<FinanceSettings> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: FINANCE_KEY } });
    return { ...DEFAULT_FINANCE, ...((row?.value as Partial<FinanceSettings> | null) ?? {}) };
  }

  async saveFinance(actorId: string, input: FinanceSettings) {
    const value: FinanceSettings = {
      commissionPercent: Math.round(Number(input.commissionPercent) * 100) / 100,
      managerApprovalLimit: Math.round(Number(input.managerApprovalLimit)),
      bookingEarnings: Boolean(input.bookingEarnings),
    };
    if (!(value.commissionPercent >= 0 && value.commissionPercent <= 100)) {
      throw new BadRequestException("Commission must be between 0% and 100%.");
    }
    if (!(value.managerApprovalLimit >= 0 && value.managerApprovalLimit <= 10_000_000)) {
      throw new BadRequestException("The approval limit must be between ₹0 and ₹1,00,00,000.");
    }
    await this.prisma.platformSetting.upsert({
      where: { key: FINANCE_KEY },
      create: { key: FINANCE_KEY, value: value as unknown as Prisma.InputJsonValue, updatedById: actorId },
      update: { value: value as unknown as Prisma.InputJsonValue, updatedById: actorId },
    });
    return this.getFinance();
  }

  // ── Razorpay ─────────────────────────────────────────────────────────────

  /** The credentials payments use right now (admin-saved, else the server's .env). */
  async getRazorpay(): Promise<RazorpayCredentials | null> {
    if (this.razorpayCache && Date.now() - this.razorpayCache.at < CACHE_MS) return this.razorpayCache.value;

    let value: RazorpayCredentials | null = null;
    const row = await this.prisma.platformSetting.findUnique({ where: { key: RAZORPAY_KEY } });
    const stored = row?.value as StoredRazorpay | null;
    if (stored?.keyId && stored.keySecret) {
      try {
        value = {
          keyId: stored.keyId,
          keySecret: decryptSecret(stored.keySecret),
          webhookSecret: stored.webhookSecret ? decryptSecret(stored.webhookSecret) : "",
          mode: modeOf(stored.keyId),
          source: "ADMIN",
        };
      } catch (e) {
        // Fail closed: silently switching to the server's (test) keys would take
        // "payments" that never charge anyone. Payments stop until an admin
        // re-saves or removes the keys in Settings.
        this.logger.error(`Saved Razorpay keys could not be decrypted (was SETTINGS_ENCRYPTION_KEY changed?): ${(e as Error).message}`);
        return null;
      }
    }
    if (!value) {
      const keyId = (process.env.RAZORPAY_KEY_ID ?? "").trim();
      const keySecret = (process.env.RAZORPAY_KEY_SECRET ?? "").trim();
      if (keyId && keySecret) {
        value = {
          keyId,
          keySecret,
          webhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET ?? "").trim(),
          mode: modeOf(keyId),
          source: "ENV",
        };
      }
    }
    if (value) this.razorpayCache = { at: Date.now(), value };
    return value;
  }

  /** What the admin panel shows — never the secrets themselves. */
  async describeRazorpay() {
    const creds = await this.getRazorpay();
    return {
      configured: !!creds,
      source: creds?.source ?? null,
      mode: creds?.mode ?? null,
      keyId: creds?.keyId ?? null,
      keySecret: creds ? maskKey(creds.keySecret) : null,
      webhookSecretSet: !!creds?.webhookSecret,
      canSave: canEncryptSettings(),
    };
  }

  /**
   * Saves new Razorpay keys after checking them against Razorpay. A blank
   * secret keeps the current one (so the key id can be corrected alone).
   */
  async saveRazorpay(actorId: string, input: { keyId: string; keySecret?: string; webhookSecret?: string }) {
    if (!canEncryptSettings()) {
      throw new BadRequestException("The server can't store secrets yet (SETTINGS_ENCRYPTION_KEY is missing).");
    }
    const keyId = input.keyId.trim();
    if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) throw new BadRequestException("That doesn't look like a Razorpay key id.");

    const current = await this.getRazorpay();
    const keySecret = input.keySecret?.trim() || (current?.keyId === keyId ? current.keySecret : "");
    if (!keySecret) throw new BadRequestException("Enter the key secret for this key id.");
    const webhookSecret = input.webhookSecret?.trim() || current?.webhookSecret || "";

    const check = await this.testCredentials(keyId, keySecret);
    if (!check.ok) throw new BadRequestException(`Razorpay didn't accept these keys: ${check.message}`);

    const stored: StoredRazorpay = {
      keyId,
      keySecret: encryptSecret(keySecret),
      webhookSecret: webhookSecret ? encryptSecret(webhookSecret) : null,
    };
    await this.prisma.platformSetting.upsert({
      where: { key: RAZORPAY_KEY },
      create: { key: RAZORPAY_KEY, value: stored as unknown as Prisma.InputJsonValue, updatedById: actorId },
      update: { value: stored as unknown as Prisma.InputJsonValue, updatedById: actorId },
    });
    this.razorpayCache = null;
    return this.describeRazorpay();
  }

  /** Go back to the server's .env keys. */
  async clearRazorpay() {
    await this.prisma.platformSetting.deleteMany({ where: { key: RAZORPAY_KEY } });
    this.razorpayCache = null;
    return this.describeRazorpay();
  }

  async testCurrent() {
    const creds = await this.getRazorpay();
    if (!creds) return { ok: false, message: "No Razorpay keys are configured." };
    return this.testCredentials(creds.keyId, creds.keySecret);
  }

  /** A cheap authenticated call: list one order. */
  async testCredentials(keyId: string, keySecret: string): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return { ok: true, message: `Connected to Razorpay (${modeOf(keyId) === "LIVE" ? "live" : "test"} mode).` };
      const body = (await res.json().catch(() => null)) as { error?: { description?: string } } | null;
      return { ok: false, message: body?.error?.description || `Razorpay replied ${res.status}.` };
    } catch (e) {
      return { ok: false, message: `Couldn't reach Razorpay: ${(e as Error).message}` };
    }
  }
}
