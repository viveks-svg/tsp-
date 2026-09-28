import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { istDateTime, toCsv } from "../../common/csv";
import type { AuditArea, AuditChange } from "./audit-actions";

export interface AuditActor {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  staffRole?: string | null;
}

export interface AuditEntry {
  actor: AuditActor;
  action: string;
  area: AuditArea;
  summary: string;
  targetType?: string | null;
  targetId?: string | null;
  changes?: AuditChange[];
  details?: Record<string, unknown> | null;
  outcome?: "SUCCESS" | "DENIED" | "FAILED";
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditFilters {
  actorId?: string;
  area?: string;
  outcome?: string;
  from?: string; // YYYY-MM-DD, IST
  to?: string; // YYYY-MM-DD, IST, inclusive
  q?: string;
  targetId?: string;
  page?: number;
}

const PAGE_SIZE = 50;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SECRET_KEY = /pass|secret|token|otp|signature/i;
const MAX_TEXT = 300;

/** Masks secrets and trims long text so the log never holds a password or a whole article. */
export const redact = (value: unknown, depth = 0): unknown => {
  if (value == null || depth > 4) return value;
  if (typeof value === "string") return value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}… (${value.length} characters)` : value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if (Prisma.Decimal.isDecimal(value)) return Number(value);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(k)) out[k] = v ? "•••• (hidden)" : v;
      else if (k === "keyId" && typeof v === "string") out[k] = v.length > 12 ? `${v.slice(0, 9)}…${v.slice(-4)}` : v;
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
};

/** Plain values for comparing and showing: numbers from Decimals, ISO from Dates, "" treated as empty. */
const plain = (v: unknown): unknown => {
  if (v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString();
  if (Prisma.Decimal.isDecimal(v)) return Number(v);
  return v;
};

/** Compare the fields that were sent with the record as it was. */
export const diffFields = (before: Record<string, unknown> | null, body: Record<string, unknown>, labels: Record<string, string>): AuditChange[] => {
  if (!before || !body) return [];
  const out: AuditChange[] = [];
  for (const [key, label] of Object.entries(labels)) {
    if (!(key in body)) continue;
    let from = plain(before[key]);
    let to = plain(body[key]);
    if (typeof from === "number" && typeof to === "string" && to.trim() !== "" && !Number.isNaN(Number(to))) to = Number(to);
    if (typeof from === "string" && typeof to === "string" && Date.parse(from) && Date.parse(to) && /T/.test(from)) {
      if (Date.parse(from) === Date.parse(to)) continue;
    }
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    // Long text: say it changed, show only the start.
    if ((typeof from === "string" && from.length > 160) || (typeof to === "string" && to.length > 160)) {
      from = typeof from === "string" ? `${from.slice(0, 80)}…` : from;
      to = typeof to === "string" ? `${to.slice(0, 80)}…` : to;
    }
    out.push({ field: label, from, to });
  }
  return out;
};

const istDayStart = (ymd: string) => new Date(`${ymd}T00:00:00+05:30`);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Never throws: a logging hiccup must not break the action being logged. */
  async record(e: AuditEntry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: e.actor.id,
          actorName: e.actor.name || e.actor.email || "Unknown",
          actorEmail: e.actor.email ?? null,
          actorRole: e.actor.staffRole || e.actor.role || "UNKNOWN",
          action: e.action,
          area: e.area,
          summary: e.summary.slice(0, 500),
          targetType: e.targetType ?? null,
          targetId: e.targetId ?? null,
          changes: e.changes?.length ? (e.changes as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
          details: e.details && Object.keys(e.details).length ? (redact(e.details) as Prisma.InputJsonValue) : Prisma.DbNull,
          outcome: e.outcome ?? "SUCCESS",
          ipAddress: e.ipAddress?.slice(0, 64) ?? null,
          userAgent: e.userAgent?.slice(0, 300) ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Could not write activity log entry "${e.action}": ${(err as Error).message}`);
    }
  }

  private where(f: AuditFilters): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (f.actorId) where.actorId = f.actorId;
    if (f.area) where.area = f.area;
    if (f.outcome) where.outcome = f.outcome;
    if (f.targetId) where.targetId = f.targetId;
    const createdAt: Prisma.DateTimeFilter = {};
    if (f.from && DATE_RE.test(f.from)) createdAt.gte = istDayStart(f.from);
    if (f.to && DATE_RE.test(f.to)) createdAt.lt = new Date(istDayStart(f.to).getTime() + 86_400_000);
    if (createdAt.gte || createdAt.lt) where.createdAt = createdAt;
    const q = f.q?.trim();
    if (q) {
      where.OR = [
        { summary: { contains: q, mode: "insensitive" } },
        { actorName: { contains: q, mode: "insensitive" } },
        { actorEmail: { contains: q, mode: "insensitive" } },
      ];
    }
    return where;
  }

  async list(f: AuditFilters) {
    const page = Math.max(1, Math.floor(Number(f.page) || 1));
    const where = this.where(f);
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          actorId: true,
          actorName: true,
          actorEmail: true,
          actorRole: true,
          action: true,
          area: true,
          summary: true,
          targetType: true,
          targetId: true,
          changes: true,
          details: true,
          outcome: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE_SIZE };
  }

  /** Everyone who appears in the log, for the "who" filter. */
  async actors() {
    const rows = await this.prisma.auditLog.groupBy({
      by: ["actorId", "actorName", "actorRole"],
      where: { actorId: { not: null } },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: 200,
    });
    const seen = new Set<string>();
    return rows
      .filter((r) => r.actorId && !seen.has(r.actorId) && seen.add(r.actorId))
      .map((r) => ({ id: r.actorId as string, name: r.actorName, role: r.actorRole }));
  }

  async exportCsv(f: AuditFilters) {
    const rows = await this.prisma.auditLog.findMany({ where: this.where(f), orderBy: { createdAt: "desc" }, take: 20_000 });
    const changeText = (c: unknown) =>
      Array.isArray(c) ? (c as AuditChange[]).map((x) => `${x.field}: ${fmt(x.from)} → ${fmt(x.to)}`).join("; ") : "";
    return toCsv(
      ["Date (IST)", "Who", "Email", "Role", "Area", "What happened", "Changes", "Outcome", "IP address"],
      rows.map((r) => [istDateTime(r.createdAt), r.actorName, r.actorEmail, r.actorRole, r.area, r.summary, changeText(r.changes), r.outcome, r.ipAddress]),
    );
  }
}

const fmt = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "boolean" ? (v ? "yes" : "no") : String(v));
