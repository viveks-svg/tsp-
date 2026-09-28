import type { PrismaService } from "../../database/prisma.service";
import type { ScheduleService } from "../schedule/schedule.service";
import type { FinanceSettingsService } from "../finance/finance-settings.service";

/**
 * What each admin / astrologer panel request means, for the activity log:
 * a readable sentence, which area of the business it touches, and — for
 * edits — how to load the record first so the log can show old → new values.
 *
 * Keys are "METHOD /route/pattern" as Nest maps them (without /api/v1).
 * Any other change under /admin is still logged, with a generic sentence.
 */

export type AuditArea = "money" | "people" | "growth" | "schedule" | "orders" | "queue" | "settings" | "security" | "other";

export interface AuditDeps {
  prisma: PrismaService;
  schedule: ScheduleService;
  finance: FinanceSettingsService;
}

export interface AuditContext {
  body: any;
  params: Record<string, string>;
  before: any;
  result: any;
}

export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditRoute {
  action: string;
  area: AuditArea;
  /** Used when the request fails, and as the sentence when there's no `summary`. */
  title: string;
  summary?: (c: AuditContext) => string;
  targetType?: string;
  targetId?: (c: AuditContext) => string | undefined | null;
  /** The record as it was before the change. */
  load?: (deps: AuditDeps, params: Record<string, string>, body: any) => Promise<any>;
  /** Fields to compare before → after, with the names people see. */
  track?: Record<string, string>;
  /** Custom comparison (for nested data like weekly hours). */
  diff?: (c: AuditContext) => AuditChange[];
  /** For requests that succeed but report a failure in their result (e.g. a refund Razorpay declined). */
  failed?: (c: AuditContext) => boolean;
}

const moneyFailed = (c: AuditContext) => c.result?.status === "FAILED";

const inr = (n: unknown) => `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const q = (s: unknown) => `“${String(s ?? "").trim()}”`;
const shortId = (id?: string | null) => (id ? id.slice(0, 8).toUpperCase() : "");
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONEY_LABEL: Record<string, string> = {
  REFUND_BOOKING: "booking refund",
  REFUND_SHOP_ORDER: "shop order refund",
  REFUND_WALLET_TOPUP: "wallet top-up refund",
  WALLET_CREDIT: "wallet credit",
  WALLET_DEBIT: "wallet debit",
  ASTROLOGER_PAYOUT: "astrologer payout",
};
const STAFF_ROLE: Record<string, string> = { SUPER_ADMIN: "Super Admin", MANAGER: "Manager", SUPPORT: "Support", CONTENT: "Content" };
const AUDIENCE: Record<string, string> = { ALL_CLIENTS: "all clients", RECENT_CLIENTS: "recent clients", ME: "themself (test)" };

const moneySubject = (m: any) => {
  const who = m?.user?.name || m?.user?.email;
  return who ? ` for ${who}` : "";
};

const loadMoney = (d: AuditDeps, p: Record<string, string>) =>
  d.prisma.moneyAction.findUnique({
    where: { id: p.id },
    select: {
      type: true,
      amount: true,
      requestedBy: { select: { name: true, email: true } },
      user: { select: { name: true, email: true } },
    },
  });

const loadAstrologer = async (d: AuditDeps, p: Record<string, string>) => {
  const a = await d.prisma.astrologer.findUnique({
    where: { id: p.id },
    select: { bio: true, pricingPerMin: true, isAvailable: true, user: { select: { name: true, email: true, phone: true } } },
  });
  return a && { name: a.user.name, email: a.user.email, phone: a.user.phone, bio: a.bio, pricingPerMin: Number(a.pricingPerMin), isAvailable: a.isAvailable };
};

const loadStaff = (d: AuditDeps, p: Record<string, string>) =>
  d.prisma.user.findUnique({ where: { id: p.userId }, select: { name: true, email: true, staffRole: true } });

const loadInvite = (d: AuditDeps, p: Record<string, string>) =>
  d.prisma.staffInvite.findUnique({ where: { id: p.id }, select: { email: true, staffRole: true } });

const loadQueueEntry = (d: AuditDeps, p: Record<string, string>) =>
  d.prisma.queueEntry.findUnique({ where: { id: p.entryId }, select: { user: { select: { name: true, email: true } } } });

const personName = (x: any) => x?.name || x?.email || "someone";

const weeklyText = (w: { ranges: { start: string; end: string }[] } | undefined) =>
  w && w.ranges.length ? w.ranges.map((r) => `${r.start}–${r.end}`).join(", ") : "closed";

export const AUDIT_ROUTES: Record<string, AuditRoute> = {
  // ── Money ─────────────────────────────────────────────────────────────────
  "POST /admin/money": {
    action: "money.request",
    area: "money",
    title: "Make a refund, wallet adjustment or payout",
    targetType: "MoneyAction",
    failed: moneyFailed,
    targetId: (c) => c.result?.id,
    summary: ({ body, result }) => {
      const what = `${MONEY_LABEL[body.type] ?? "money action"} of ${inr(body.amount)}${moneySubject(result)}`;
      if (result?.outcome === "PENDING_APPROVAL") return `Asked a Super Admin to approve a ${what}`;
      if (result?.status === "FAILED") return `Tried a ${what} — it failed${result.error ? `: ${result.error}` : ""}`;
      return `Made a ${what}`;
    },
  },
  "POST /admin/money/:id/approve": {
    action: "money.approve",
    area: "money",
    title: "Approve a money request",
    targetType: "MoneyAction",
    failed: moneyFailed,
    load: loadMoney,
    summary: ({ before, result }) =>
      `Approved ${personName(before?.requestedBy)}'s ${MONEY_LABEL[before?.type] ?? "request"} of ${inr(before?.amount)}${moneySubject(before)}` +
      (result?.status === "FAILED" ? ` — but it failed${result.error ? `: ${result.error}` : ""}` : ""),
  },
  "POST /admin/money/:id/reject": {
    action: "money.reject",
    area: "money",
    title: "Decline a money request",
    targetType: "MoneyAction",
    load: loadMoney,
    summary: ({ before, body }) =>
      `Declined ${personName(before?.requestedBy)}'s ${MONEY_LABEL[before?.type] ?? "request"} of ${inr(before?.amount)}${moneySubject(before)}` +
      (body?.note ? ` (${body.note})` : ""),
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  "PUT /admin/settings/finance": {
    action: "settings.finance",
    area: "settings",
    title: "Change the money rules",
    load: (d) => d.finance.getFinance(),
    track: {
      commissionPercent: "Commission (%)",
      managerApprovalLimit: "Manager approval limit (₹)",
      bookingEarnings: "Bookings count towards astrologer earnings",
    },
    summary: () => "Changed the money rules",
  },
  "PUT /admin/settings/razorpay": {
    action: "settings.razorpay",
    area: "settings",
    title: "Save the Razorpay keys",
    summary: ({ body }) => `Saved ${String(body.keyId).startsWith("rzp_live_") ? "LIVE" : "test"} Razorpay keys`,
  },
  "DELETE /admin/settings/razorpay": {
    action: "settings.razorpay_clear",
    area: "settings",
    title: "Remove the saved Razorpay keys",
    summary: () => "Removed the saved Razorpay keys (payments use the server's keys again)",
  },
  "POST /admin/settings/razorpay/test": {
    action: "settings.razorpay_test",
    area: "settings",
    title: "Test the Razorpay connection",
    summary: ({ result }) => `Tested the Razorpay connection: ${result?.message ?? "done"}`,
  },

  "PUT /admin/settings/security": {
    action: "settings.security",
    area: "security",
    title: "Change the sign-in rules",
    load: (d) => d.prisma.platformSetting.findUnique({ where: { key: "security" } }).then((r) => ({ requireStaffTwoStep: false, ...((r?.value as object) ?? {}) })),
    track: { requireStaffTwoStep: "Two-step verification required for staff and astrologers" },
    summary: ({ body }) =>
      body.requireStaffTwoStep ? "Required two-step verification for staff and astrologers" : "Made two-step verification optional",
  },
  "POST /admin/team/:userId/reset-two-step": {
    action: "team.reset_two_step",
    area: "security",
    title: "Reset a team member's two-step verification",
    targetType: "User",
    targetId: (c) => c.params.userId,
    load: loadStaff,
    summary: ({ before }) => `Reset ${personName(before)}'s two-step verification (they set it up again at next sign-in)`,
  },
  "POST /admin/astrologers/:id/reset-two-step": {
    action: "astrologer.reset_two_step",
    area: "security",
    title: "Reset an astrologer's two-step verification",
    targetType: "Astrologer",
    load: loadAstrologer,
    summary: ({ before }) => `Reset ${personName(before)}'s two-step verification (they set it up again at next sign-in)`,
  },

  // ── Consultation hours ────────────────────────────────────────────────────
  "PUT /admin/availability": {
    action: "schedule.save",
    area: "schedule",
    title: "Change the consultation hours",
    load: async (d) => {
      const [settings, weekly, provider] = await Promise.all([d.schedule.getSettings(), d.schedule.getWeekly(), d.schedule.getProvider()]);
      return { settings, weekly, provider };
    },
    diff: ({ before, body }) => {
      if (!before) return [];
      const out: AuditChange[] = [];
      const labels: Record<string, string> = {
        sessionMinutes: "Session length (minutes)",
        bufferMinutes: "Gap between sessions (minutes)",
        horizonDays: "Bookable days ahead",
        acceptingBookings: "Taking bookings",
      };
      for (const [k, label] of Object.entries(labels)) {
        if (body.settings?.[k] !== undefined && body.settings[k] !== before.settings[k]) out.push({ field: label, from: before.settings[k], to: body.settings[k] });
      }
      for (const day of body.weekly ?? []) {
        const was = weeklyText(before.weekly.find((w: any) => w.dayOfWeek === day.dayOfWeek));
        const now = weeklyText(day);
        if (was !== now) out.push({ field: DAYS[day.dayOfWeek] ?? `Day ${day.dayOfWeek}`, from: was, to: now });
      }
      if (body.astrologerId && body.astrologerId !== before.provider?.astrologerId) {
        out.push({ field: "Consultations go to", from: before.provider?.name ?? "—", to: body.astrologerId });
      }
      return out;
    },
    summary: () => "Changed the consultation hours",
  },
  "POST /admin/availability/days-off": {
    action: "schedule.day_off_add",
    area: "schedule",
    title: "Add a day off",
    summary: ({ body }) => `Marked ${body.date} as a day off${body.note ? ` (${body.note})` : ""}`,
  },
  "DELETE /admin/availability/days-off/:date": {
    action: "schedule.day_off_remove",
    area: "schedule",
    title: "Remove a day off",
    summary: ({ params }) => `Opened ${params.date} for bookings again`,
  },

  // ── Astrologers ───────────────────────────────────────────────────────────
  "POST /admin/astrologers": {
    action: "astrologer.create",
    area: "people",
    title: "Add an astrologer",
    targetType: "Astrologer",
    targetId: (c) => c.result?.astrologerId,
    summary: ({ body }) =>
      body.convertExisting ? `Made the account ${body.email} an astrologer` : `Added astrologer ${body.name} (${body.email})`,
  },
  "PATCH /admin/astrologers/:id": {
    action: "astrologer.update",
    area: "people",
    title: "Edit an astrologer",
    targetType: "Astrologer",
    load: loadAstrologer,
    track: { name: "Name", phone: "Phone", bio: "About", pricingPerMin: "Rate per minute (₹)", isAvailable: "Available" },
    summary: ({ before }) => `Edited astrologer ${personName(before)}`,
  },
  "POST /admin/astrologers/:id/deactivate": {
    action: "astrologer.deactivate",
    area: "people",
    title: "Deactivate an astrologer",
    targetType: "Astrologer",
    load: loadAstrologer,
    summary: ({ before }) => `Deactivated astrologer ${personName(before)} — their login stops working`,
  },
  "POST /admin/astrologers/:id/reactivate": {
    action: "astrologer.reactivate",
    area: "people",
    title: "Reactivate an astrologer",
    targetType: "Astrologer",
    load: loadAstrologer,
    summary: ({ before }) => `Reactivated astrologer ${personName(before)}`,
  },
  "POST /admin/astrologers/:id/reset-password": {
    action: "astrologer.reset_password",
    area: "security",
    title: "Reset an astrologer's password",
    targetType: "Astrologer",
    load: loadAstrologer,
    summary: ({ before, body }) =>
      body.mode === "email"
        ? `Emailed ${personName(before)} a link to set a new password`
        : `Set a temporary password for ${personName(before)}`,
  },
  "POST /admin/astrologers/:id/review": {
    action: "astrologer.review",
    area: "people",
    title: "Review an astrologer application",
    targetType: "Astrologer",
    load: loadAstrologer,
    summary: ({ before, body }) => `Reviewed ${personName(before)}'s application: ${String(body.status ?? body.action ?? "").toLowerCase() || "updated"}`,
  },
  "PATCH /astrologers/:id/kyc/review": {
    action: "astrologer.kyc_review",
    area: "people",
    title: "Review astrologer documents",
    targetType: "Astrologer",
    load: loadAstrologer,
    summary: ({ before, body }) => `Reviewed ${personName(before)}'s documents: ${String(body.status ?? "").toLowerCase() || "updated"}`,
  },

  // ── Team ──────────────────────────────────────────────────────────────────
  "POST /admin/team/invites": {
    action: "team.invite",
    area: "people",
    title: "Invite a team member",
    targetType: "StaffInvite",
    targetId: (c) => c.result?.id,
    summary: ({ body }) => `Invited ${body.email} to the team as ${STAFF_ROLE[body.staffRole] ?? body.staffRole}`,
  },
  "POST /admin/team/invites/:id/resend": {
    action: "team.invite_resend",
    area: "people",
    title: "Resend a team invite",
    targetType: "StaffInvite",
    load: loadInvite,
    summary: ({ before }) => `Resent the team invite to ${before?.email ?? "someone"}`,
  },
  "DELETE /admin/team/invites/:id": {
    action: "team.invite_revoke",
    area: "people",
    title: "Cancel a team invite",
    targetType: "StaffInvite",
    load: loadInvite,
    summary: ({ before }) => `Cancelled the team invite for ${before?.email ?? "someone"}`,
  },
  "PATCH /admin/team/:userId": {
    action: "team.change_role",
    area: "people",
    title: "Change a team member's role",
    targetType: "User",
    targetId: (c) => c.params.userId,
    load: loadStaff,
    summary: ({ before, body }) =>
      `Changed ${personName(before)}'s role from ${STAFF_ROLE[before?.staffRole] ?? "—"} to ${STAFF_ROLE[body.staffRole] ?? body.staffRole}`,
  },
  "DELETE /admin/team/:userId": {
    action: "team.remove",
    area: "people",
    title: "Remove a team member",
    targetType: "User",
    targetId: (c) => c.params.userId,
    load: loadStaff,
    summary: ({ before }) => `Removed ${personName(before)} from the team`,
  },

  "POST /admin/team/sign-out-all": {
    action: "team.sign_out_all",
    area: "security",
    title: "Sign out everyone else on the team",
    summary: ({ result }) => `Signed out every other staff and astrologer login (${result?.signedOut ?? 0} account${result?.signedOut === 1 ? "" : "s"})`,
  },

  // ── Growth ────────────────────────────────────────────────────────────────
  "POST /admin/blogs": {
    action: "blog.create",
    area: "growth",
    title: "Write an article",
    targetType: "Blog",
    targetId: (c) => c.result?.id,
    summary: ({ body }) => `${body.published ? "Published" : "Drafted"} the article ${q(body.title)}`,
  },
  "PATCH /admin/blogs/:id": {
    action: "blog.update",
    area: "growth",
    title: "Edit an article",
    targetType: "Blog",
    load: (d, p) =>
      d.prisma.blog.findUnique({
        where: { id: p.id },
        select: { title: true, slug: true, excerpt: true, content: true, category: true, coverImageUrl: true, byline: true, published: true },
      }),
    track: {
      title: "Title",
      slug: "Web address",
      category: "Category",
      byline: "Written by",
      excerpt: "Summary",
      coverImageUrl: "Cover image",
      content: "Article text",
      published: "Published",
    },
    summary: ({ before, body }) => {
      if (before && body.published === true && !before.published) return `Published the article ${q(body.title)}`;
      if (before && body.published === false && before.published) return `Took the article ${q(body.title)} off the website`;
      return `Edited the article ${q(body.title ?? before?.title)}`;
    },
  },
  "DELETE /admin/blogs/:id": {
    action: "blog.delete",
    area: "growth",
    title: "Delete an article",
    targetType: "Blog",
    load: (d, p) => d.prisma.blog.findUnique({ where: { id: p.id }, select: { title: true } }),
    summary: ({ before }) => `Deleted the article ${q(before?.title)}`,
  },
  "POST /admin/promos": {
    action: "promo.create",
    area: "growth",
    title: "Create a website popup",
    targetType: "PromoEvent",
    targetId: (c) => c.result?.id,
    summary: ({ body }) => `Created the website popup ${q(body.title)}`,
  },
  "PATCH /admin/promos/:id": {
    action: "promo.update",
    area: "growth",
    title: "Edit a website popup",
    targetType: "PromoEvent",
    load: (d, p) =>
      d.prisma.promoEvent.findUnique({
        where: { id: p.id },
        select: { title: true, description: true, imageUrl: true, actionUrl: true, actionText: true, isActive: true, expiresAt: true },
      }),
    track: {
      title: "Title",
      description: "Message",
      imageUrl: "Image",
      actionUrl: "Button link",
      actionText: "Button text",
      isActive: "Showing on the website",
      expiresAt: "Ends",
    },
    summary: ({ before, body }) => {
      const name = q(body.title ?? before?.title);
      if (before && body.isActive === true && !before.isActive) return `Switched on the website popup ${name}`;
      if (before && body.isActive === false && before.isActive) return `Switched off the website popup ${name}`;
      return `Edited the website popup ${name}`;
    },
  },
  "DELETE /admin/promos/:id": {
    action: "promo.delete",
    area: "growth",
    title: "Delete a website popup",
    targetType: "PromoEvent",
    load: (d, p) => d.prisma.promoEvent.findUnique({ where: { id: p.id }, select: { title: true } }),
    summary: ({ before }) => `Deleted the website popup ${q(before?.title)}`,
  },
  "POST /admin/campaigns": {
    action: "campaign.create",
    area: "growth",
    title: "Create a live-queue campaign",
    targetType: "Campaign",
    targetId: (c) => c.result?.id,
    summary: ({ body }) => `Created the campaign ${q(body.title)} (${inr(body.ratePerMinute)}/min, ${DAYS[body.dayOfWeek] ?? ""}s)`,
  },
  "PATCH /admin/campaigns/:id": {
    action: "campaign.update",
    area: "growth",
    title: "Edit a live-queue campaign",
    targetType: "Campaign",
    load: async (d, p) => {
      const c = await d.prisma.campaign.findUnique({
        where: { id: p.id },
        select: { title: true, bannerText: true, ratePerMinute: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
      });
      return c && { ...c, ratePerMinute: Number(c.ratePerMinute) };
    },
    track: {
      title: "Title",
      bannerText: "Banner text",
      ratePerMinute: "Rate per minute (₹)",
      dayOfWeek: "Day",
      startTime: "From",
      endTime: "To",
      isActive: "On",
    },
    summary: ({ before, body }) => {
      const name = q(body.title ?? before?.title);
      if (before && body.isActive === true && !before.isActive) return `Switched on the campaign ${name}`;
      if (before && body.isActive === false && before.isActive) return `Paused the campaign ${name}`;
      return `Edited the campaign ${name}`;
    },
  },
  "POST /admin/announcements": {
    action: "announcement.send",
    area: "growth",
    title: "Send an announcement",
    targetType: "NotificationBroadcast",
    targetId: (c) => c.result?.id,
    summary: ({ body, result }) =>
      `Sent the announcement ${q(body.title)} to ${AUDIENCE[body.audience] ?? body.audience}` +
      (result?.recipients != null ? ` (${result.recipients} account${result.recipients === 1 ? "" : "s"})` : ""),
  },

  // ── Shop orders ───────────────────────────────────────────────────────────
  "PATCH /admin/orders/:id/status": {
    action: "order.status",
    area: "orders",
    title: "Update a shop order",
    targetType: "ShopOrder",
    load: (d, p) => d.prisma.shopOrder.findUnique({ where: { id: p.id }, select: { status: true, customerName: true } }),
    track: { status: "Status" },
    summary: ({ before, body, params }) =>
      `Marked shop order #${shortId(params.id)}${before?.customerName ? ` (${before.customerName})` : ""} as ${String(body.status).toLowerCase()}`,
  },

  // ── Live queue ────────────────────────────────────────────────────────────
  "POST /admin/queue/:entryId/skip": {
    action: "queue.skip",
    area: "queue",
    title: "Skip a client in the live queue",
    targetType: "QueueEntry",
    targetId: (c) => c.params.entryId,
    load: loadQueueEntry,
    summary: ({ before }) => `Skipped ${personName(before?.user)} in the live queue`,
  },
  "POST /admin/queue/:entryId/remove": {
    action: "queue.remove",
    area: "queue",
    title: "Remove a client from the live queue",
    targetType: "QueueEntry",
    targetId: (c) => c.params.entryId,
    load: loadQueueEntry,
    summary: ({ before }) => `Removed ${personName(before?.user)} from the live queue`,
  },
  "POST /admin/queue/force-close/:consultationId": {
    action: "queue.force_close",
    area: "queue",
    title: "Force-close a stuck consultation",
    targetType: "Consultation",
    targetId: (c) => c.params.consultationId,
    summary: ({ params }) => `Force-closed stuck consultation #${shortId(params.consultationId)}`,
  },
  "POST /astrologer/queue/dequeue/:campaignId": {
    action: "queue.call_next",
    area: "queue",
    title: "Call the next client from the queue",
    targetType: "Campaign",
    targetId: (c) => c.params.campaignId,
    summary: ({ result }) => {
      const who = result?.user?.name || result?.entry?.user?.name;
      return who ? `Called ${who} from the live queue` : "Called the next client from the live queue";
    },
  },
};

/** A readable fallback for admin changes not listed above. */
export const genericRoute = (method: string, path: string): AuditRoute => {
  const verb = { POST: "Did", PUT: "Saved", PATCH: "Changed", DELETE: "Deleted" }[method] ?? method;
  return { action: `${method} ${path}`, area: "other", title: `${verb} ${path}` };
};
