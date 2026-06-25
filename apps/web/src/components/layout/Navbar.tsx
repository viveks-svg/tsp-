
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Menu, X, User, ChevronDown, LogOut, Wallet, UserCircle, ReceiptText, CalendarClock, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { navLinks, type NavLink } from "@/lib/constants/nav";
import { ROUTES } from "@/lib/constants/routes";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthModal } from "@/hooks/useAuthModal";
import { calculators } from "@/lib/data/calculators";
import { freeServices } from "@/lib/data/free-services";
import { zodiacSigns, zodiacEmojis } from "@/lib/data/zodiac";
import { CALCULATOR_CATEGORY_LABELS } from "@/types/calculator";
import type { CalculatorCategory } from "@/types/calculator";

function isActiveLink(pathname: string, href: string) {
  if (href === ROUTES.HOME) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Extract initials from a name string, e.g. "John Doe" → "JD" */
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mega dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Auth state
  const { user, isAuthenticated, walletBalance, logout } = useAuth();
  const authModal = useAuthModal();

  // Escape key listener for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await logout();
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-1 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-7xl rounded-full transition-all duration-500 ease-out",
          mounted && (scrolled || pathname !== "/")
            ? "bg-[#0F0E0C]/85 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
            : "bg-transparent border-transparent shadow-none"
        )}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo/Group 2.svg" alt="Astro Space" width={60} height={60}
                className="w-12.5 h-12.5 md:w-15 md:h-15" priority
              />
            </Link>            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-7">
              {navLinks.map((link: NavLink) => {
                if (link.type === "dropdown") {
                  let active = false;
                  if (link.dropdownType === "consultations") {
                    active = pathname.startsWith("/consultation");
                  } else if (link.dropdownType === "horoscope") {
                    active = pathname.startsWith("/horoscope");
                  } else if (link.dropdownType === "free-services") {
                    active = pathname.startsWith("/free-services");
                  } else if (link.dropdownType === "calculators") {
                    active = pathname.startsWith("/calculators");
                  }

                  const isOpen = activeDropdown === link.label;

                  return (
                    <div
                      key={link.label}
                      className="relative py-2 group"
                      onMouseEnter={() => handleMouseEnter(link.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        className={cn(
                          "flex items-center gap-1 text-[13px] font-medium transition-colors duration-300 font-poppins focus:outline-none",
                          active || isOpen ? "text-[#C8A04A] font-semibold" : "text-white/70 hover:text-white"
                        )}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                      >
                        {link.label}
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
                      </button>

                      {/* Dropdown Menu Container */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                              "absolute pt-2 z-50 invisible opacity-0 pointer-events-none transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
                              link.dropdownType === "calculators" ? "-left-[320px]" : link.dropdownType === "free-services" ? "-left-40" : "-left-4"
                            )}
                          >
                            {link.dropdownType === "consultations" && (
                              <div className="grid grid-cols-1 gap-1 p-2 bg-[#1C1A17]/95 backdrop-blur-xl rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/[0.06] w-56">
                                {[
                                  { label: "Chat with Astrologer", href: ROUTES.CHAT, desc: "Instant text guidance" },
                                  { label: "Call with Astrologer", href: ROUTES.CALL, desc: "Direct voice consultation" },
                                ].map((child) => (
                                  <Link
                                    key={child.label}
                                    href={child.href}
                                    onClick={() => setActiveDropdown(null)}
                                    className={cn(
                                      "block px-4 py-2.5 rounded-lg transition-colors font-poppins",
                                      isActiveLink(pathname, child.href)
                                        ? "bg-[#C8A04A]/10 text-[#C8A04A] font-semibold"
                                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                                    )}
                                  >
                                    <span className="block text-sm font-semibold">{child.label}</span>
                                    <span className="block text-[10px] text-muted font-normal mt-0.5">{child.desc}</span>
                                  </Link>
                                ))}
                              </div>
                            )}

                            {link.dropdownType === "horoscope" && (
                              <div className="grid grid-cols-12 gap-6 p-6 bg-[#1C1A17]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/[0.06] w-[220px]">
                                {/* Zodiac Signs */}
                                {/* <div className="col-span-8 border-r border-border/60 pr-6">
                                  <span className="block text-xs font-bold text-[#C8A04A] uppercase tracking-wider mb-3 font-poppins">
                                    Zodiac Signs
                                  </span>
                                  <div className="grid grid-cols-3 gap-2">
                                    {zodiacSigns.map((sign) => (
                                      <Link
                                        key={sign}
                                        href={`/horoscope/${sign.toLowerCase()}`}
                                        onClick={() => setActiveDropdown(null)}
                                        className={cn(
                                          "flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-cream/70 hover:text-navy transition-colors font-poppins text-xs font-medium text-white/60",
                                          isActiveLink(pathname, `/horoscope/${sign.toLowerCase()}`) && "bg-[#C8A04A]/10 text-[#C8A04A] font-semibold border border-gold/30"
                                        )}
                                      >
                                        <span className="text-base">{zodiacEmojis[sign]}</span>
                                        <span>{sign}</span>
                                      </Link>
                                    ))}
                                  </div>
                                </div> */}
                                {/* Timeframes */}
                                <div className="col-span-4 flex flex-col justify-between">
                                  <div>
                                    <span className="block text-xs font-bold text-[#C8A04A] uppercase tracking-wider mb-3 font-poppins">
                                      Timeframes
                                    </span>
                                    <div className="space-y-1.5">
                                      {[
                                        { label: "Daily Horoscope", slug: "daily" },
                                        { label: "Weekly Horoscope", slug: "weekly" },
                                        { label: "Monthly Horoscope", slug: "monthly" },
                                        { label: "Yearly Horoscope", slug: "yearly" },
                                      ].map((item) => (
                                        <Link
                                          key={item.slug}
                                          href={`/horoscope/${item.slug}`}
                                          onClick={() => setActiveDropdown(null)}
                                          className={cn(
                                            "block px-3 py-1.5 rounded-lg text-xs font-poppins text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors font-medium",
                                            isActiveLink(pathname, `/horoscope/${item.slug}`) && "bg-[#C8A04A]/10 text-[#C8A04A] font-semibold"
                                          )}
                                        >
                                          {item.label}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            )}

                            {link.dropdownType === "free-services" && (
                              <div className="grid grid-cols-2 gap-2 p-4 bg-[#1C1A17]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/[0.06] w-[540px]">
                                {freeServices.map((service) => (
                                  <Link
                                    key={service.id}
                                    href={service.href}
                                    onClick={() => setActiveDropdown(null)}
                                    className={cn(
                                      "flex items-start gap-3 p-3 rounded-xl hover:bg-cream/75 transition-colors group",
                                      isActiveLink(pathname, service.href)
                                        ? "bg-[#C8A04A]/10 text-[#C8A04A] border-l-2 border-[#C8A04A]"
                                        : "text-white/60"
                                    )}
                                  >
                                    <span className="text-2xl mt-0.5 p-1.5 bg-cream/40 border border-border rounded-lg group-hover:bg-white transition-colors">{service.icon}</span>
                                    <div>
                                      <span className="block text-sm font-semibold text-white/90 group-hover:text-white transition-colors font-poppins">
                                        {service.title}
                                      </span>
                                      <span className="block text-[10px] text-white/30 leading-relaxed mt-1 font-body">
                                        {service.description}
                                      </span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}

                            {link.dropdownType === "calculators" && (
                              <div className="grid grid-cols-4 gap-6 p-6 bg-[#1C1A17]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/[0.06] w-[780px]">
                                {(Object.keys(CALCULATOR_CATEGORY_LABELS) as CalculatorCategory[]).map((cat) => {
                                  const calcs = calculators.filter((c) => c.category === cat);
                                  return (
                                    <div key={cat} className="space-y-3">
                                      <span className="block text-xs font-bold text-[#C8A04A] uppercase tracking-wider border-b border-white/[0.06] pb-1.5 font-poppins">
                                        {CALCULATOR_CATEGORY_LABELS[cat]}
                                      </span>
                                      <div className="space-y-1">
                                        {calcs.map((calc) => (
                                          <Link
                                            key={calc.id}
                                            href={calc.href}
                                            onClick={() => setActiveDropdown(null)}
                                            className={cn(
                                              "flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-cream/70 hover:text-navy transition-colors font-poppins text-xs font-medium text-white/60",
                                              isActiveLink(pathname, calc.href) && "bg-[#C8A04A]/10 text-[#C8A04A] font-semibold border border-gold/20"
                                            )}
                                          >
                                            <span>{calc.icon}</span>
                                            <span className="truncate">{calc.title}</span>
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const active = isActiveLink(pathname, link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "text-[13px] font-medium transition-colors duration-300 relative group font-poppins",
                      active ? "text-[#C8A04A] font-semibold" : "text-white/70 hover:text-white"
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-[#C8A04A] transition-all duration-400 ease-out",
                        active ? "w-full" : "w-0 group-hover:w-full"
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Bell / Notification */}
              <button
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors duration-200"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5 text-white/60" />
              </button>

              {/* User / Auth */}
              {isAuthenticated && user ? (
                /* --- Logged In: Initials Avatar + Dropdown --- */
                <div className="relative hidden sm:block group" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#C8A04A]/20 text-[#C8A04A] text-xs font-bold hover:bg-[#C8A04A]/30 transition-colors duration-200 border border-[#C8A04A]/20"
                    aria-label="User menu"
                  >
                    {getInitials(user.name)}
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-[#1C1A17]/95 backdrop-blur-xl rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/[0.06] py-2 z-50 invisible opacity-0 pointer-events-none transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-white/40 truncate">
                            {user.email || user.phone || ""}
                          </p>
                        </div>

                        {/* Wallet Balance */}
                        <div className="px-4 py-2.5 border-b border-white/[0.06]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted font-medium">Wallet Balance</span>
                            <span className="text-sm font-bold text-navy">
                              ₹{Number(walletBalance).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {(user.role === "ASTROLOGER" || user.role === "ADMIN") && (
                            <Link
                              href="/astrologer/dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gold bg-navy/5 hover:bg-cream hover:text-navy transition-colors font-poppins"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gold" />
                              Astrologer Panel
                            </Link>
                          )}
                          <Link
                            href={ROUTES.PROFILE}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors font-poppins"
                          >
                            <UserCircle className="w-4 h-4" />
                            Profile
                          </Link>
                          <Link
                            href={ROUTES.WALLET}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors font-poppins"
                          >
                            <Wallet className="w-4 h-4" />
                            Wallet
                          </Link>
                          <Link
                            href={ROUTES.CONSULTATIONS}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors font-poppins"
                          >
                            <CalendarClock className="w-4 h-4" />
                            Consultations
                          </Link>
                          <Link
                            href={ROUTES.ORDERS}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors font-poppins"
                          >
                            <ReceiptText className="w-4 h-4" />
                            Orders
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="pt-1 border-t border-border">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-poppins"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* --- Logged Out: User Icon → opens modal --- */
                <button
                  onClick={() => authModal.open("login")}
                  className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors duration-200"
                  aria-label="Login"
                >
                  <User className="w-5 h-5 text-white/60" />
                </button>
              )}

              {/* CTA */}
              <Link
                href={ROUTES.CHAT}
                className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_2px_16px_rgba(200,160,74,0.25)] hover:shadow-[0_4px_24px_rgba(200,160,74,0.35)] transition-all duration-300 btn-shine"
              >
                Our Astro Expert
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-[8px] hover:bg-white/[0.08] transition-colors duration-200"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav >

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {
          mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl"
              >
                <div className="p-6 pt-20">
                  {/* Mobile user info */}
                  {isAuthenticated && user ? (
                    <div className="mb-6 pb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-white/40 truncate">
                            ₹{Number(walletBalance).toFixed(2)} wallet
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {(user.role === "ASTROLOGER" || user.role === "ADMIN") && (
                          <Link
                            href="/astrologer/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="col-span-2 text-center text-xs font-semibold py-2.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
                          >
                            Astrologer Dashboard
                          </Link>
                        )}
                        <Link
                          href={ROUTES.PROFILE}
                          onClick={() => setMobileOpen(false)}
                          className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-cream text-navy hover:bg-cream-dark transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          href={ROUTES.WALLET}
                          onClick={() => setMobileOpen(false)}
                          className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-cream text-navy hover:bg-cream-dark transition-colors"
                        >
                          Wallet
                        </Link>
                        <Link
                          href={ROUTES.CONSULTATIONS}
                          onClick={() => setMobileOpen(false)}
                          className="text-center text-xs font-medium py-2 rounded-lg bg-cream text-navy hover:bg-cream-dark transition-colors"
                        >
                          Consultations
                        </Link>
                        <Link
                          href={ROUTES.ORDERS}
                          onClick={() => setMobileOpen(false)}
                          className="text-center text-xs font-medium py-2 rounded-lg bg-cream text-navy hover:bg-cream-dark transition-colors"
                        >
                          Orders
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 pb-4 border-b border-white/[0.06]">
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          authModal.open("login");
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy-hover transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Sign In / Sign Up
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    {navLinks.map((link: NavLink) => {
                      if (link.type === "dropdown") {
                        const isExpanded = !!expandedLinks[link.label];
                        let active = false;
                        if (link.dropdownType === "consultations") {
                          active = pathname.startsWith("/consultation");
                        } else if (link.dropdownType === "horoscope") {
                          active = pathname.startsWith("/horoscope");
                        } else if (link.dropdownType === "free-services") {
                          active = pathname.startsWith("/free-services");
                        } else if (link.dropdownType === "calculators") {
                          active = pathname.startsWith("/calculators");
                        }

                        return (
                          <div key={link.label} className="flex flex-col">
                            <button
                              onClick={() =>
                                setExpandedLinks((prev) => ({ ...prev, [link.label]: !prev[link.label] }))
                              }
                              className={cn(
                                "flex items-center justify-between text-base font-medium py-3 px-4 rounded-[12px] transition-colors font-poppins w-full text-left",
                                active
                                  ? "bg-cream/50 text-navy font-semibold"
                                  : "text-dark hover:bg-cream hover:text-navy"
                              )}
                            >
                              <span>{link.label}</span>
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-paragraph transition-transform duration-200",
                                  isExpanded ? "rotate-180" : ""
                                )}
                              />
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden pl-4 flex flex-col gap-1 mt-1 border-l border-border/60 ml-4"
                                >
                                  {link.dropdownType === "consultations" && (
                                    <>
                                      <Link
                                        href={ROUTES.CHAT}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                          "text-sm font-medium py-2 px-3 rounded-[8px] transition-colors font-poppins",
                                          isActiveLink(pathname, ROUTES.CHAT) ? "bg-[#C8A04A]/10 text-[#C8A04A] border-l-2 border-[#C8A04A]" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                                        )}
                                      >
                                        Chat with Astrologer
                                      </Link>
                                      <Link
                                        href={ROUTES.CALL}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                          "text-sm font-medium py-2 px-3 rounded-[8px] transition-colors font-poppins",
                                          isActiveLink(pathname, ROUTES.CALL) ? "bg-[#C8A04A]/10 text-[#C8A04A] border-l-2 border-[#C8A04A]" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                                        )}
                                      >
                                        Call with Astrologer
                                      </Link>
                                    </>
                                  )}

                                  {link.dropdownType === "horoscope" && (
                                    <div className="py-1 space-y-3">
                                      <div className="flex flex-wrap gap-1.5">
                                        {[
                                          { label: "Daily", slug: "daily" },
                                          { label: "Weekly", slug: "weekly" },
                                          { label: "Monthly", slug: "monthly" },
                                          { label: "Yearly", slug: "yearly" },
                                        ].map((item) => (
                                          <Link
                                            key={item.slug}
                                            href={`/horoscope/${item.slug}`}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                              "text-xs px-2.5 py-1.5 rounded-full border transition-colors",
                                              isActiveLink(pathname, `/horoscope/${item.slug}`)
                                                ? "bg-navy text-white border-navy"
                                                : "bg-card text-paragraph border-border"
                                            )}
                                          >
                                            {item.label}
                                          </Link>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-border/40">
                                        {zodiacSigns.map((sign) => (
                                          <Link
                                            key={sign}
                                            href={`/horoscope/${sign.toLowerCase()}`}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                              "flex items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-poppins text-paragraph hover:bg-cream border border-transparent",
                                              isActiveLink(pathname, `/horoscope/${sign.toLowerCase()}`) && "bg-[#C8A04A]/10 text-[#C8A04A] font-semibold border-gold/30"
                                            )}
                                          >
                                            <span>{zodiacEmojis[sign]}</span>
                                            <span className="truncate">{sign}</span>
                                          </Link>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {link.dropdownType === "free-services" && (
                                    <div className="flex flex-col gap-0.5">
                                      {freeServices.map((service) => (
                                        <Link
                                          key={service.id}
                                          href={service.href}
                                          onClick={() => setMobileOpen(false)}
                                          className={cn(
                                            "text-sm font-medium py-2 px-3 rounded-[8px] transition-colors font-poppins flex items-center gap-2",
                                            isActiveLink(pathname, service.href)
                                              ? "bg-[#C8A04A]/10 text-[#C8A04A] border-l-2 border-[#C8A04A]"
                                              : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                                          )}
                                        >
                                          <span>{service.icon}</span>
                                          <span>{service.title}</span>
                                        </Link>
                                      ))}
                                    </div>
                                  )}

                                  {link.dropdownType === "calculators" && (
                                    <div className="space-y-3">
                                      {(Object.keys(CALCULATOR_CATEGORY_LABELS) as CalculatorCategory[]).map((cat) => {
                                        const calcs = calculators.filter((c) => c.category === cat);
                                        return (
                                          <div key={cat} className="space-y-1">
                                            <span className="block text-[10px] font-bold text-muted uppercase tracking-wider font-poppins px-2">
                                              {CALCULATOR_CATEGORY_LABELS[cat]}
                                            </span>
                                            <div className="grid grid-cols-2 gap-1">
                                              {calcs.map((calc) => (
                                                <Link
                                                  key={calc.id}
                                                  href={calc.href}
                                                  onClick={() => setMobileOpen(false)}
                                                  className={cn(
                                                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-paragraph hover:bg-cream border border-transparent",
                                                    isActiveLink(pathname, calc.href) && "bg-[#C8A04A]/10 text-[#C8A04A] font-semibold border-gold/20"
                                                  )}
                                                >
                                                  <span>{calc.icon}</span>
                                                  <span className="truncate">{calc.title}</span>
                                                </Link>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      const active = isActiveLink(pathname, link.href);
                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "text-base font-medium py-3 px-4 rounded-[12px] transition-colors font-poppins",
                            active
                              ? "bg-[#C8A04A]/10 text-[#C8A04A] border-l-2 border-[#C8A04A]"
                              : "text-dark hover:bg-cream hover:text-navy"
                          )}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>


                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <Link
                      href={ROUTES.CHAT}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white px-5 py-3 rounded-button text-sm font-semibold hover:bg-navy-hover transition-colors"
                    >
                      Our Astro Expert
                    </Link>

                    {isAuthenticated && (
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full text-center text-rose-600 px-5 py-2.5 rounded-button text-sm font-semibold hover:bg-rose-50 transition-colors border border-rose-200"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </>
  );
}
