import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="text-center max-w-md">
        <p className="text-gold text-6xl font-heading font-bold mb-4">404</p>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-dark mb-4">
          Page Not Found
        </h1>
        <p className="text-paragraph text-sm leading-relaxed mb-8">
          The cosmic alignment you&apos;re seeking doesn&apos;t exist at this path.
          Let&apos;s guide you back to familiar stars.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-navy-hover transition-colors duration-300"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
