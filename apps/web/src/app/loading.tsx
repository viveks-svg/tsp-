export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold/20 border-t-gold animate-spin mx-auto mb-6" />
        <p className="text-paragraph text-sm font-medium tracking-wide">
          Aligning the stars...
        </p>
      </div>
    </div>
  );
}
