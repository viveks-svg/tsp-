"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  IndianRupee,
  User,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useCallStore } from "@/features/call/store/call.store";
import { useCallSocket } from "@/features/call/hooks/useCallSocket";
import IncomingCallModal from "@/features/call/components/IncomingCallModal";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants/routes";

const NAV_ITEMS = [
  { href: "/astrologer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/astrologer/consultations", label: "Consultations", icon: MessageSquare },
  { href: "/astrologer/availability", label: "Availability", icon: Calendar },
  { href: "/astrologer/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/astrologer/profile", label: "Profile", icon: User },
];

/**
 * Astrologer layout with sidebar navigation and role-based access control.
 * Only users with role ASTROLOGER can access these pages.
 */
export default function AstrologerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Call signaling — always active for astrologers ──
  const incomingCall = useCallStore((s) => s.incomingCall);
  const { acceptCall, rejectCall } = useCallSocket();

  const handleAcceptCall = (consultationId: string) => {
    acceptCall(consultationId);
    router.push(`${ROUTES.CONSULTATIONS}/${consultationId}/call`);
  };

  const handleRejectCall = (consultationId: string) => {
    rejectCall(consultationId);
  };

  // Role guard — redirect non-astrologers
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "ASTROLOGER" && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "ASTROLOGER" && user?.role !== "ADMIN")) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-border rounded-lg p-2 shadow-card"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b border-border">
          <Link href="/astrologer/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">T</span>
            </div>
            <div>
              <p className="font-heading font-bold text-dark text-sm">TSP Astrologer</p>
              <p className="text-[10px] text-muted font-poppins">Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-navy text-white shadow-sm"
                    : "text-paragraph hover:bg-cream hover:text-dark"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="px-4">
            <p className="text-xs font-bold text-dark font-poppins truncate">
              {user?.name || "Astrologer"}
            </p>
            <p className="text-[10px] text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {children}
      </main>

      {/* Global incoming call modal for astrologers */}
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          consultationId={incomingCall.consultationId}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </div>
  );
}
