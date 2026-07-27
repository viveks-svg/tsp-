/**
 * Single source of truth for role → panel mapping.
 * Navbar, route guards, and any role-aware navigation should reference this.
 */
export type Role = "USER" | "ASTROLOGER" | "ADMIN";

export const ROLE_PANEL_CONFIG: Record<Role, { label: string; href: string } | null> = {
  ADMIN:      { label: "Admin Panel",      href: "/admin/queue" },
  ASTROLOGER: { label: "Astrologer Panel", href: "/astrologer/dashboard" },
  USER:       null,
};
