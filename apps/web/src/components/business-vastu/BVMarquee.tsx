"use client";

import { MARQUEE_ITEMS } from "@/lib/data/business-vastu";

export default function BVMarquee() {
  const content = MARQUEE_ITEMS.map((item) => `${item} ✦`).join(" ");
  const doubled = `${content} ${content}`;

  return (
    <section className="bg-[#F6A000] py-3.5 overflow-hidden">
      <div className="marquee-track whitespace-nowrap">
        <span className="text-[#071B8D] font-poppins font-bold text-sm tracking-wider">
          {doubled}
        </span>
      </div>
    </section>
  );
}
