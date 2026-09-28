"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Gem, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The TSP panel frame — midnight sidebar with the champagne logo, grouped
 * navigation and the signed-in person — shared by the admin office and the
 * astrologer's consulting room so both carry the same house style.
 */

export interface PanelNavGroup {
  label: string;
  items: { href: string; label: string; icon: ComponentType<{ className?: string }> }[];
}

export function PanelShell({
  homeHref,
  motto,
  groups,
  person,
  roleLabel,
  onSignOut,
  children,
}: {
  homeHref: string;
  motto: string;
  groups: PanelNavGroup[];
  person: { name: string | null; email: string | null };
  roleLabel: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === homeHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const initials =
    (person.name || person.email || "T")
      .replace(/^Dr\.?\s+/i, "")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "T";

  return (
    <div className="flex min-h-screen bg-parchment">
      {/* Phone top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between bg-midnight px-4 md:hidden">
        <Link href={homeHref} aria-label="Home">
          <Image src="/logo/tsp-logo-champagne.svg" alt="Time Space & Planets" width={67} height={44} priority />
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg border border-white/10 p-2 text-champagne-light"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-midnight/50 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen w-[272px] flex-col overflow-hidden bg-midnight text-[#AEB3CC] transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(227,200,142,0.14),transparent_70%)]"
        />
        <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-champagne/0 via-champagne/35 to-champagne/0" />

        <div className="relative px-7 pt-8 pb-7">
          <Link href={homeHref} className="block" onClick={() => setOpen(false)}>
            <Image src="/logo/tsp-logo-champagne.svg" alt="Time Space & Planets" width={134} height={88} className="h-auto w-[118px]" priority />
          </Link>
          <p className="mt-4 font-cinzel text-[10px] font-semibold tracking-[0.34em] text-champagne/80 uppercase">{motto}</p>
        </div>
        <div aria-hidden className="mx-7 h-px bg-gradient-to-r from-champagne/40 via-champagne/15 to-transparent" />

        <nav className="relative flex-1 space-y-7 overflow-y-auto px-4 py-7">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="px-3 pb-1 font-cinzel text-[10px] font-semibold tracking-[0.24em] text-[#8E94B3] uppercase">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                      active ? "bg-white/[0.06] text-champagne-light" : "hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    {active && <span className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full bg-champagne" />}
                    <Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-champagne-light" : "text-[#8E94B3] group-hover:text-white")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/[0.07] px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-champagne/50 bg-midnight-2 font-cinzel text-[13px] font-semibold text-champagne-light">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{person.name || person.email}</p>
              <p className="flex items-center gap-1 truncate text-[11px] text-[#8E94B3]">
                <Gem className="h-3 w-3 text-champagne" /> {roleLabel}
              </p>
            </div>
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-[#8E94B3] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 flex-1 pt-16 md:pt-0 md:pl-[272px]">{children}</main>
    </div>
  );
}
