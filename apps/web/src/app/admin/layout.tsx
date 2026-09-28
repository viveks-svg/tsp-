"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellRing,
  BookOpenCheck,
  Feather,
  GalleryVerticalEnd,
  CalendarDays,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  Loader2,
  Lock,
  Megaphone,
  MessagesSquare,
  PhoneCall,
  Scale,
  Settings2,
  UserCog,
  ShieldAlert,
  ChartColumn,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { homeForRole } from "@/lib/constants/route-ownership";
import { permissionForPath, STAFF_ROLE_LABEL } from "@/lib/constants/admin-permissions";
import { PanelShell, type PanelNavGroup } from "@/features/panel/PanelShell";
import { Panel } from "@/features/admin/components/primitives";

const NAV_GROUPS: PanelNavGroup[] = [
  {
    label: "The House",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/reports", label: "Reports", icon: ChartColumn },
      { href: "/admin/activity", label: "Activity Log", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
      { href: "/admin/account", label: "My Account", icon: UserCog },
    ],
  },
  {
    label: "Clientele",
    items: [
      { href: "/admin/clients", label: "Clients", icon: UserRound },
      { href: "/admin/bookings", label: "Bookings", icon: BookOpenCheck },
      { href: "/admin/consultations", label: "Consultations", icon: MessagesSquare },
      { href: "/admin/leads", label: "Booking Leads", icon: PhoneCall },
    ],
  },
  {
    label: "Treasury",
    items: [
      { href: "/admin/payments", label: "Payments", icon: IndianRupee },
      { href: "/admin/money", label: "Money Requests", icon: Scale },
      { href: "/admin/payouts", label: "Payouts", icon: Landmark },
      { href: "/admin/orders", label: "Shop Orders", icon: ShoppingBag },
    ],
  },
  {
    label: "Dr. Pradeep",
    items: [
      { href: "/admin/availability", label: "Consultation Hours", icon: CalendarDays },
      { href: "/admin/queue", label: "Live Queue", icon: ListOrdered },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/admin/promos", label: "Promo Popups", icon: GalleryVerticalEnd },
      { href: "/admin/blog", label: "Blog", icon: Feather },
      { href: "/admin/announcements", label: "Announcements", icon: BellRing },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/astrologers", label: "Astrologers", icon: Sparkles },
      { href: "/admin/team", label: "Team", icon: ShieldCheck },
    ],
  },
];

/** The admin office. Only ADMIN users enter; each page also needs its staff permission. */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Older cached sessions may not carry permissions yet; the server still enforces them.
  const allowed = (permission: string | null) =>
    !permission || !user?.permissions || user.permissions.includes(permission);

  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => allowed(permissionForPath(i.href))) })).filter(
    (g) => g.items.length > 0,
  );
  const firstPage = groups[0]?.items[0]?.href;
  const pageAllowed = allowed(permissionForPath(pathname));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
    else if (user?.role !== "ADMIN") router.replace(homeForRole(user?.role));
    // e.g. the Content role has no Overview: start them on their first page.
    else if (pathname === "/admin" && !pageAllowed && firstPage && firstPage !== "/admin") router.replace(firstPage);
  }, [isLoading, isAuthenticated, user, router, pathname, pageAllowed, firstPage]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Loader2 className="h-7 w-7 animate-spin text-champagne" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <PanelShell
      homeHref={firstPage ?? "/admin"}
      motto="The Private Office"
      groups={groups}
      person={{ name: user.name, email: user.email }}
      roleLabel={STAFF_ROLE_LABEL[user.staffRole ?? ""] ?? "Administrator"}
      onSignOut={async () => {
        await logout();
        router.push("/");
      }}
    >
      {!user.twoStepEnabled && pathname !== "/admin/account" && (
        <Link
          href="/admin/account"
          className="flex items-center gap-2.5 border-b border-champagne/30 bg-champagne/10 px-5 py-2.5 text-[13px] text-ink-2 hover:bg-champagne/15 md:px-10"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-bronze" />
          <span>
            <strong className="font-semibold text-ink">Protect your account:</strong> turn on two-step verification — it takes a minute.
          </span>
        </Link>
      )}
      {pageAllowed ? (
        children
      ) : (
        <div className="mx-auto max-w-2xl px-5 py-16 md:px-10">
          <Panel>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-parchment text-bronze">
                <Lock className="h-5 w-5" />
              </span>
              <h1 className="font-playfair text-2xl font-semibold text-ink">Not part of your role</h1>
              <p className="max-w-md text-[14px] text-ink-2">
                Your role doesn’t include this page. If you need it, ask a Super Admin to change your role on the Team page.
              </p>
            </div>
          </Panel>
        </div>
      )}
    </PanelShell>
  );
}
