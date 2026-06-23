import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Poppins,
  Cinzel,
  Poltawski_Nowy,
  Tiro_Devanagari_Sanskrit,
} from "next/font/google";
import "./globals.css";
import { rootMetadata } from "@/lib/seo/metadata";
import AuthProvider from "@/providers/AuthProvider";
import { getServerAuth } from "@/lib/auth/getServerAuth";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const poltawskiNowy = Poltawski_Nowy({
  subsets: ["latin"],
  variable: "--font-poltawski",
  display: "swap",
});

const tiroSanskrit = Tiro_Devanagari_Sanskrit({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-tiro-sanskrit",
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialAuth = await getServerAuth();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${poppins.variable} ${cinzel.variable} ${poltawskiNowy.variable} ${tiroSanskrit.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (window.__TSP_ROUTER_GUARD__) return;
                window.__TSP_ROUTER_GUARD__ = true;

                history.scrollRestoration = 'manual';

                var routeGroup = function (pathname) {
                  if (pathname.indexOf('/astrologer') === 0) return 'astrologer';
                  if (pathname.indexOf('/login') === 0 || pathname.indexOf('/signup') === 0) return 'auth';
                  return 'site';
                };

                var tspReload = function () {
                  window.location.href = window.location.href;
                };

                /* ── BFCache ──────────────────────────────────────────
                 * When the browser restores a page from BFCache, the
                 * JavaScript heap is frozen as-is. React may have stale
                 * state and event handlers may break. Force a hard reload
                 * to get a fresh render tree from the server.
                 *
                 * IMPORTANT: we deliberately do NOT guard with a
                 * 'reloading' flag here because BFCache preserves that
                 * flag from the pre-navigation session, which would
                 * permanently suppress the reload. */
                window.addEventListener('pageshow', function (event) {
                  if (event.persisted) tspReload();
                }, true);

                /* ── Cross-group link clicks ──────────────────────────
                 * Links that jump between layout groups (site ⇄ astrologer
                 * ⇄ auth) must bypass Next.js client-side routing because
                 * the layout context changes completely. */
                document.addEventListener('click', function (event) {
                  var el = event.target;
                  while (el && el.tagName !== 'A') el = el.parentElement;
                  if (!el || !el.href) return;
                  if (el.target && el.target !== '_self') return;
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

                  var next = new URL(el.href, window.location.href);
                  if (next.origin !== window.location.origin) return;
                  if (next.pathname === window.location.pathname && next.search === window.location.search) return;

                  var currentGroup = routeGroup(window.location.pathname);
                  var nextGroup = routeGroup(next.pathname);
                  if (currentGroup === nextGroup) return;

                  event.preventDefault();
                  event.stopImmediatePropagation();
                  window.location.assign(next.href);
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body">
        <AuthProvider
          initialUser={initialAuth?.user ?? null}
          initialWalletBalance={initialAuth?.walletBalance ?? 0}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}