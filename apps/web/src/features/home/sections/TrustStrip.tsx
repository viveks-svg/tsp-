import { trustItems } from "@/lib/data/home";

export default function TrustStrip() {
  const duplicated = [...trustItems, ...trustItems];

  return (
    <section className="w-full bg-gradient-to-r from-[#060F52] via-[#071B8D] to-[#060F52] py-4 overflow-hidden border-y border-gold/10">
      <div className="marquee-track">
        {duplicated.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center shrink-0">
            <span className="text-white/80 text-[11px] font-medium whitespace-nowrap px-6 tracking-[0.2em] uppercase">
              {item}
            </span>
            <span className="text-gold/60 text-[8px]">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
