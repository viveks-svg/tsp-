import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, UserCheck, Lock, Star } from "lucide-react";
import { footerLinks } from "@/lib/constants/footer";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#03115D] to-[#020A38] text-white border-t border-white/10 relative overflow-hidden">
      {/* Stars pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-16 relative z-10">

        {/* Unified Columns Grid (5 Columns on Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 md:gap-8">

          {/* Column 1: Brand Info, Socials & Support */}
          <div className="space-y-6 lg:pr-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/Group 2.svg"
                alt="Time Space & Planets"
                width={48}
                height={48}
                className="w-[42px] h-[42px] brightness-0 invert"
              />
              <span className="font-heading text-lg md:text-xl font-bold text-white tracking-tight">
                Time Space & Planets
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              A premium astrology consultation platform integrating Vedic philosophy, business strategy, and astronomical intelligence for modern leaders and individuals.
            </p>

            <div className="space-y-1.5">
              <span className="block text-white/70 text-xs font-semibold uppercase tracking-wider">
                Support Email
              </span>
              <a
                href="mailto:contact@timespaceplanets.com"
                className="text-gold hover:text-gold-hover text-[13px] hover:underline break-all transition-colors duration-200"
              >
                contact@timespaceplanets.com
              </a>
            </div>

            <div className="space-y-2">
              <span className="block text-white/70 text-xs font-semibold uppercase tracking-wider">
                Follow Us
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/20 hover:border-gold/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-4 1.44-4 4v2z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/20 hover:border-gold/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/20 hover:border-gold/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/20 hover:border-gold/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.028 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.863.51 9.388.51 9.388.51s7.524 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108C24 15.972 24 12 24 12s0-3.972-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Horoscopes & Shop */}
          <div className="space-y-8">
            {/* Horoscopes */}
            <div>
              <h4 className="font-heading text-md font-bold text-white mb-4 flex items-center gap-2">
                <span>Horoscopes</span>
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.horoscopes.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-gold transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop & Services */}
            <div>
              <h4 className="font-heading text-md font-bold text-white mb-4 flex items-center gap-2">
                {/* <Star fill="#F4D03F" className="w-3.5 h-3.5 text-[#F4D03F]" /> */}
                <span>Shop & Services</span>
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.shop.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-gold transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Free Services */}
          <div>
            <h4 className="font-heading text-md font-bold text-white mb-4 flex items-center gap-2">
              {/* <Star fill="#F4D03F" className="w-3.5 h-3.5 text-[#F4D03F]" />*/}
              <span>Free Services</span>
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.freeServices.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Calculators */}
          <div>
            <h4 className="font-heading text-md font-bold text-white mb-4 flex items-center gap-2">
              <span>Calculators</span>
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.calculators.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Corporate Info & Legal */}
          <div>
            <h4 className="font-heading text-md font-bold text-white mb-4 flex items-center gap-2">
              <span>Corporate Info</span>
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.corporate.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Divider and Horizontal Trust & Download Section */}
        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Secure & Trusted - Horizontal Badges */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
              Secure & Trusted
            </span>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="flex items-center gap-2.5 text-white/70 text-sm">
                <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
                <span>Private & Confidential</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/70 text-sm">
                <UserCheck className="w-5 h-5 text-gold shrink-0" />
                <span>Verified Astrologers</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/70 text-sm">
                <Lock className="w-5 h-5 text-gold shrink-0" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Download App - Horizontal buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider hidden lg:inline-block">
              Download App
            </span>
            <div className="flex flex-row items-center gap-3">
              {/* App Store Badge */}
              <a
                href="#"
                className="flex items-center gap-2.5 bg-black/35 hover:bg-black/55 border border-white/10 px-4 py-2 rounded-lg transition-all duration-300 hover:border-gold/40 group shrink-0"
              >
                <svg className="w-5 h-5 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.09 2.48-1.36.03-1.8-.8-3.36-.8-1.56 0-2.04.77-3.34.82-1.33.05-2.32-1.32-3.16-2.53C4.04 16.89 2.7 11.23 4.45 8.18c.87-1.51 2.43-2.47 4.12-2.5 1.29-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.68-1.12 1.82-.98 2.92.1.08.2.1.3.1.86 0 1.94-.53 2.51-1.41z" />
                </svg>
                <div className="text-left">
                  <span className="block text-[8px] text-white/50 uppercase leading-none mb-0.5">
                    Download on the
                  </span>
                  <span className="block text-xs font-semibold text-white group-hover:text-gold transition-colors leading-none">
                    App Store
                  </span>
                </div>
              </a>

              {/* Google Play Badge */}
              <a
                href="#"
                className="flex items-center gap-2.5 bg-black/35 hover:bg-black/55 border border-white/10 px-4 py-2 rounded-lg transition-all duration-300 hover:border-gold/40 group shrink-0"
              >
                <svg className="w-5 h-5 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M5 3.141c-.2.03-.4.12-.5.29L12 12l7.5-8.57c-.1-.17-.3-.26-.5-.29H5zm-.8 1.45V19.41l7.56-7.41L4.2 4.591zm15.6 0l-7.56 7.41 7.56 7.41V4.591zm-7.8 8.16L4.5 20.57c.1.17.3.26.5.29H19c.2-.03.4-.12.5-.29l-7.5-7.818z" />
                </svg>
                <div className="text-left">
                  <span className="block text-[8px] text-white/50 uppercase leading-none mb-0.5">
                    GET IT ON
                  </span>
                  <span className="block text-xs font-semibold text-white group-hover:text-gold transition-colors leading-none">
                    Google Play
                  </span>
                </div>
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-white/5 bg-black/15">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Time Space & Planets. All rights reserved.
          </p>
          <p className="text-white/30 text-[11px] text-center sm:text-right font-medium tracking-[0.05em] uppercase">
            Crafted with cosmic precision for modern leaders
          </p>
        </div>
      </div>
    </footer>
  );
}
