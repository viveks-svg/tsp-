import { StaffRole } from "@prisma/client";

/**
 * What each staff role may do in the admin panel. The server enforces these on
 * every admin endpoint (@RequirePermission); the panel hides what isn't allowed.
 */
export const PERMISSIONS = [
  "overview.view",
  "clients.view",
  "bookings.view",
  "consultations.view",
  "payments.view",
  "payments.refund",
  "wallet.adjust",
  "orders.manage",
  "leads.manage",
  "campaigns.manage",
  "content.manage",
  "notifications.send",
  "schedule.manage",
  "queue.manage",
  "astrologers.manage",
  "payouts.manage",
  "money.approve",
  "settings.manage",
  "team.manage",
  "reports.view",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Managers can refund, adjust wallets and record payouts up to the approval
// limit (Settings → Finance); above it a super admin approves ("money.approve").
const MANAGER: Permission[] = [
  "overview.view",
  "clients.view",
  "bookings.view",
  "consultations.view",
  "payments.view",
  "payments.refund",
  "wallet.adjust",
  "payouts.manage",
  "orders.manage",
  "leads.manage",
  "campaigns.manage",
  "content.manage",
  "notifications.send",
  "schedule.manage",
  "queue.manage",
  "astrologers.manage",
  "reports.view",
];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  MANAGER,
  SUPPORT: ["overview.view", "clients.view", "bookings.view", "consultations.view", "orders.manage", "leads.manage", "queue.manage"],
  CONTENT: ["campaigns.manage", "content.manage", "notifications.send"],
};

export const permissionsFor = (role: string | null | undefined, staffRole: StaffRole | null | undefined): Permission[] =>
  role === "ADMIN" && staffRole ? [...ROLE_PERMISSIONS[staffRole]] : [];

export const can = (role: string | null | undefined, staffRole: StaffRole | null | undefined, permission: Permission) =>
  permissionsFor(role, staffRole).includes(permission);
