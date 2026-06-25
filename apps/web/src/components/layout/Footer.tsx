import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { footerLinks } from "@/lib/constants/footer";
import { ROUTES } from "@/lib/constants/routes";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#071B8D] to-[#041B8C] text-white border-t border-white/[0.06] relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-16 relative z-10">

        {/* Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-10 md:gap-8">

          {/* Column 1: Brand Info & Socials */}
          <div className="space-y-6 lg:pr-4 lg:col-span-2">
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
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Premium consulting by Dr. Pradeep Sharma — integrating Vedic philosophy,
              Vastu science, and strategic astrology for modern leaders and individuals.
            </p>

            <div className="space-y-1.5">
              <span className="block text-white/60 text-xs font-semibold uppercase tracking-wider">
                Support Email
              </span>
              <a
                href="mailto:contact@timespaceplanets.com"
                className="text-[#C8A04A] hover:text-[#D4AC5A] text-[13px] hover:underline break-all transition-colors duration-200"
              >
                contact@timespaceplanets.com
              </a>
            </div>

            <div className="space-y-2">
              <span className="block text-white/60 text-xs font-semibold uppercase tracking-wider">
                Follow Us
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#C8A04A]/20 hover:border-[#C8A04A]/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.88.39-1 1-1h2V2h-3c-2.9 0-4 1.44-4 4v2z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#C8A04A]/20 hover:border-[#C8A04A]/40 text-white/60 hover:text-white transition-all duration-300"
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
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#C8A04A]/20 hover:border-[#C8A04A]/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#C8A04A]/20 hover:border-[#C8A04A]/40 text-white/60 hover:text-white transition-all duration-300"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.028 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.863.51 9.388.51 9.388.51s7.524 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108C24 15.972 24 12 24 12s0-3.972-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h4 className="font-heading text-md font-bold text-white mb-4">
              Solutions
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.solutions.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Horoscopes & Shop */}
          <div className="space-y-8">
            <div>
              <h4 className="font-heading text-md font-bold text-white mb-4">
                Horoscopes
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.horoscopes.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-md font-bold text-white mb-4">
                Shop
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.shop.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Free Services */}
          <div>
            <h4 className="font-heading text-md font-bold text-white mb-4">
              Free Services
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.freeServices.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Calculators */}
          <div>
            <h4 className="font-heading text-md font-bold text-white mb-4">
              Calculators
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.calculators.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Corporate Info & Legal */}
          <div className="space-y-8">
            <div>
              <h4 className="font-heading text-md font-bold text-white mb-4">
                Corporate Info
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.corporate.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-md font-bold text-white mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/45 text-[13px] hover:text-[#C8A04A] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider and Trust Badges */}
        <div className="border-t border-white/[0.06] mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <span className="text-white/30 text-xs font-bold uppercase tracking-wider">
              Trusted & Secure
            </span>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="flex items-center gap-2.5 text-white/50 text-sm">
                <ShieldCheck className="w-5 h-5 text-[#C8A04A] shrink-0" />
                <span>Confidential Consultations</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/50 text-sm">
                <Lock className="w-5 h-5 text-[#C8A04A] shrink-0" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Book Now CTA */}
          <Link
            href={ROUTES.BOOK}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_2px_16px_rgba(200,160,74,0.20)] hover:shadow-[0_4px_24px_rgba(200,160,74,0.30)] transition-all duration-300"
          >
            Book a Session
          </Link>
        </div>

      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-white/5 bg-black/15">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Time Space & Planets. All rights reserved.
          </p>
          <p className="text-white/25 text-[11px] text-center sm:text-right font-medium tracking-[0.05em] uppercase">
            Premium consulting for modern leaders
          </p>
        </div>
      </div>
    </footer>
  );
}
