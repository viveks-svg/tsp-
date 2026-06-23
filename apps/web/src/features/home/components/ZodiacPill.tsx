"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

interface ZodiacPillProps {
  sign: string;
  active?: boolean;
  onClick?: () => void;
}

export default function ZodiacPill({ sign, active = false, onClick }: ZodiacPillProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap border",
        active
          ? "bg-[#071B8D] text-white border-[#071B8D] shadow-[0_8px_20px_rgba(7,27,141,0.18)]"
          : "bg-[#EEF2FF] text-[#071B8D] border-[#071B8D]/20 hover:bg-[#DDE5FF] hover:border-[#071B8D]/45 hover:text-[#04125E]"
      )}
    >
      {sign}
    </motion.button>
  );
}