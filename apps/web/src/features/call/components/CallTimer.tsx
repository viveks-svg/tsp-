"use client";

import { cn } from "@/lib/cn";

interface CallTimerProps {
  formattedDuration: string;
  formattedRemaining: string;
  isLowTime: boolean;
  perMinRate: number;
}

export default function CallTimer({
  formattedDuration,
  formattedRemaining,
  isLowTime,
  perMinRate,
}: CallTimerProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Elapsed */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2 text-center min-w-24">
        <p className="text-[9px] text-white/60 uppercase font-bold tracking-wider font-poppins">
          Duration
        </p>
        <p className="text-lg font-bold font-poppins text-white">
          {formattedDuration}
        </p>
      </div>

      {/* Remaining */}
      <div
        className={cn(
          "backdrop-blur-sm border rounded-xl px-4 py-2 text-center min-w-28",
          isLowTime
            ? "bg-rose-500/20 border-rose-400/30"
            : "bg-white/10 border-white/15",
        )}
      >
        <p className="text-[9px] text-white/60 uppercase font-bold tracking-wider font-poppins">
          Remaining
        </p>
        <p
          className={cn(
            "text-lg font-bold font-poppins",
            isLowTime ? "text-rose-400 animate-pulse" : "text-white",
          )}
        >
          {formattedRemaining}
        </p>
      </div>

      {/* Rate indicator */}
      <div className="text-[10px] text-white/50 font-poppins">
        ₹{perMinRate}/min
      </div>
    </div>
  );
}
