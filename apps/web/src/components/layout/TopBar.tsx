import { Star, StarHalfIcon } from "lucide-react";

export default function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] w-full bg-gradient-to-r from-[#7A1624] via-[#A61B2B] to-[#7A1624] py-2 px-4 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Star fill="#F4D03F" className="w-3.5 h-3.5 text-[#F4D03F]" />
        <p className="text-white text-[11px] md:text-xs font-medium tracking-[0.05em]">
          Get Your 5 Min Consultation Free
        </p>
        <Star fill="#F4D03F" className="w-3.5 h-3.5 text-[#F4D03F]" />
      </div>
    </div>
  );
}
