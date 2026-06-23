import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

/**
 * User portal — personalized horoscope (placeholder).
 * Public free horoscope hub lives at /horoscope in (marketing).
 */
export default function DashboardHoroscopePage() {
  return (
    <section className="min-h-screen py-20 bg-cream">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-heading text-3xl font-bold text-dark mb-4">
          Your Personal Horoscope
        </h1>
        <p className="text-paragraph text-sm mb-8 leading-relaxed">
          Saved readings, birth-chart sync, and daily alerts for your sign —
          coming soon to your dashboard.
        </p>
        <Link
          href={ROUTES.HOROSCOPE}
          className="inline-flex items-center justify-center bg-navy text-white px-6 py-3 rounded-button text-sm font-semibold hover:bg-navy-hover transition-colors font-poppins"
        >
          Browse Free Horoscope Hub
        </Link>
      </div>
    </section>
  );
}
