import { Star, StarHalfIcon } from "lucide-react";

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] w-full bg-[#0A0A0A] py-2 px-4 border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Star fill="#C8A04A" className="w-3.5 h-3.5 text-[#C8A04A]" />
        <p className="text-white/80 text-[11px] md:text-xs font-medium tracking-[0.05em]">
          Get Your 5 Min Consultation Free
        </p>
        <Star fill="#C8A04A" className="w-3.5 h-3.5 text-[#C8A04A]" />
      </div>
    </div>
  );
}
