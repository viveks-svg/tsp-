"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="text-center max-w-md">
        <p className="text-error text-5xl font-heading font-bold mb-4">✦</p>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-dark mb-4">
          Something Went Wrong
        </h1>
        <p className="text-paragraph text-sm leading-relaxed mb-8">
          The stars have momentarily misaligned. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-navy-hover transition-colors duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
