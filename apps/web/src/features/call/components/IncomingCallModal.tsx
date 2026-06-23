"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, User } from "lucide-react";

interface IncomingCallModalProps {
  callerName: string;
  consultationId: string;
  onAccept: (consultationId: string) => void;
  onReject: (consultationId: string) => void;
}

/**
 * Global modal shown to astrologers when they receive an incoming call.
 * Features a ring animation and accept/reject buttons.
 * Auto-dismisses after 30 seconds (handled by the socket timeout).
 */
export default function IncomingCallModal({
  callerName,
  consultationId,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e] rounded-3xl border border-white/10 p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in slide-in-from-bottom-4 duration-300">
        {/* Ring animation */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-emerald-400/20 animate-ping" style={{ animationDelay: "0.3s" }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
            <User className="w-10 h-10 text-white/80" />
          </div>
        </div>

        {/* Caller info */}
        <div>
          <p className="text-white/50 text-xs font-poppins uppercase tracking-wider mb-1">
            Incoming Call
          </p>
          <h3 className="text-xl font-heading font-bold text-white">
            {callerName}
          </h3>
          <p className="text-white/40 text-xs font-poppins mt-1">
            Auto-dismiss in {secondsLeft}s
          </p>
        </div>

        {/* Accept / Reject buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            id="call-reject-incoming"
            onClick={() => onReject(consultationId)}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/30"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button
            id="call-accept-incoming"
            onClick={() => onAccept(consultationId)}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/30 animate-bounce"
            style={{ animationDuration: "1.5s" }}
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
