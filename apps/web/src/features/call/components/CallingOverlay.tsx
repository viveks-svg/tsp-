"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

interface CallingOverlayProps {
  astrologerName: string;
  onCancel: () => void;
}

/**
 * Full-screen overlay shown to the user while the call is ringing.
 * Displays a pulsating call animation and the astrologer's name.
 */
export default function CallingOverlay({
  astrologerName,
  onCancel,
}: CallingOverlayProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-navy via-[#1a1a3e] to-[#0a0a2e] flex flex-col items-center justify-center">
      {/* Background decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute w-48 h-48 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "2.5s" }} />
        <div className="absolute w-32 h-32 rounded-full border border-white/10 animate-ping" style={{ animationDuration: "2s" }} />
      </div>

      {/* Caller avatar */}
      <div className="relative z-10 mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/40 flex items-center justify-center shadow-2xl shadow-gold/10">
          <span className="text-4xl font-heading font-bold text-white">
            {astrologerName.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Pulsing ring around avatar */}
        <div className="absolute -inset-3 rounded-full border-2 border-gold/30 animate-ping" style={{ animationDuration: "1.5s" }} />
      </div>

      {/* Name and status */}
      <h2 className="text-2xl font-heading font-bold text-white mb-2 relative z-10">
        {astrologerName}
      </h2>
      <p className="text-white/60 font-poppins text-sm relative z-10">
        Calling{dots}
      </p>

      {/* Phone icon with pulse */}
      <div className="mt-8 relative z-10">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center animate-bounce" style={{ animationDuration: "1s" }}>
          <Phone className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Cancel button */}
      <button
        id="call-cancel-ringing"
        onClick={onCancel}
        className="mt-12 relative z-10 px-8 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-poppins font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/25"
      >
        Cancel
      </button>
    </div>
  );
}
