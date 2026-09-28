"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, IndianRupee, LayoutDashboard, ListOrdered, Loader2, MessageSquare, UserRound } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCallStore } from "@/features/call/store/call.store";
import { useCallSocket } from "@/features/call/hooks/useCallSocket";
import IncomingCallModal from "@/features/call/components/IncomingCallModal";
import { homeForRole } from "@/lib/constants/route-ownership";
import { PanelShell, type PanelNavGroup } from "@/features/panel/PanelShell";

const NAV_GROUPS: PanelNavGroup[] = [
  {
    label: "Today",
    items: [
      { href: "/astrologer/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/astrologer/queue", label: "Live Queue", icon: ListOrdered },
    ],
  },
  { label: "Clients", items: [{ href: "/astrologer/consultations", label: "Consultations", icon: MessageSquare }] },
  {
    label: "Practice",
    items: [
      { href: "/astrologer/availability", label: "My Hours", icon: CalendarClock },
      { href: "/astrologer/earnings", label: "Earnings", icon: IndianRupee },
      { href: "/astrologer/profile", label: "Profile", icon: UserRound },
    ],
  },
];

/**
 * The astrologer's consulting room. Only users with role ASTROLOGER can access
 * these pages; incoming calls ring here wherever the astrologer is in the panel.
 */
export default function AstrologerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const incomingCall = useCallStore((s) => s.incomingCall);
  const { acceptCall, rejectCall } = useCallSocket();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
    else if (user?.role !== "ASTROLOGER") router.replace(homeForRole(user?.role));
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <Loader2 className="h-7 w-7 animate-spin text-champagne" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== "ASTROLOGER") return null;

  return (
    <PanelShell
      homeHref="/astrologer/dashboard"
      motto="The Consulting Room"
      groups={NAV_GROUPS}
      person={{ name: user.name, email: user.email }}
      roleLabel="Astrologer"
      onSignOut={async () => {
        await logout();
        router.push("/");
      }}
    >
      {children}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          consultationId={incomingCall.consultationId}
          onAccept={(id) => {
            acceptCall(id);
            router.push(`/astrologer/consultations/${id}/call`);
          }}
          onReject={(id) => rejectCall(id)}
        />
      )}
    </PanelShell>
  );
}
