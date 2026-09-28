/**
 * Which admin page needs which permission — mirrors the backend's
 * @RequirePermission on each endpoint (the server is the real gate).
 */
export const PAGE_PERMISSIONS: [prefix: string, permission: string][] = [
  ["/admin/clients", "clients.view"],
  ["/admin/bookings", "bookings.view"],
  ["/admin/consultations", "consultations.view"],
  ["/admin/leads", "leads.manage"],
  ["/admin/payments", "payments.view"],
  ["/admin/money", "payments.view"],
  ["/admin/payouts", "payouts.manage"],
  ["/admin/settings", "settings.manage"],
  ["/admin/orders", "orders.manage"],
  ["/admin/availability", "schedule.manage"],
  ["/admin/queue", "queue.manage"],
  ["/admin/campaigns", "campaigns.manage"],
  ["/admin/promos", "content.manage"],
  ["/admin/blog", "content.manage"],
  ["/admin/announcements", "notifications.send"],
  ["/admin/astrologers", "astrologers.manage"],
  ["/admin/team", "team.manage"],
  ["/admin/reports", "reports.view"],
  ["/admin/activity", "audit.view"],
  // Everyone on the team manages their own sign-in.
  ["/admin/account", ""],
  ["/admin", "overview.view"],
];

export const permissionForPath = (pathname: string) =>
  PAGE_PERMISSIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? null;

export const STAFF_ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  SUPPORT: "Support",
  CONTENT: "Content",
};
