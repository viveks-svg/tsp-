"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles } from "lucide-react";
import io, { Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface PromoEvent {
  id: string;
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  imageUrl?: string;
}

export function PromoPopup() {
  const [promo, setPromo] = useState<PromoEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedPromos, setDismissedPromos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket: Socket = io(`${NEXT_PUBLIC_API_URL}/promo`, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("Connected to Promo Gateway");
    });

    socket.on("promo:update", (promos: PromoEvent[]) => {
      if (promos && promos.length > 0) {
        const latest = promos[0];
        if (!dismissedPromos.has(latest.id)) {
          setPromo(latest);
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    });

    // Also fetch initial promos from REST API
    fetch(`${NEXT_PUBLIC_API_URL}/api/v1/promo/active`)
      .then(res => res.json())
      .then((promos: PromoEvent[]) => {
        if (promos && promos.length > 0) {
          const latest = promos[0];
          if (!dismissedPromos.has(latest.id)) {
            setPromo(latest);
            setIsVisible(true);
          }
        }
      })
      .catch(() => { });

    return () => {
      socket.disconnect();
    };
  }, [dismissedPromos]);

  if (!promo) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissedPromos(prev => new Set(prev).add(promo.id));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-[100] w-full max-w-sm"
        >
          <div className="bg-[#1C1A17]/95 backdrop-blur-xl border border-[#C8A04A]/30 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden font-poppins">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-32 w-full relative bg-[#0F0E0C]">
              <img
                src={promo.imageUrl || "/promo_popup_bg.png"}
                alt={promo.title}
                className="w-full h-full object-cover opacity-80"
                onError={(e) => { e.currentTarget.src = "/promo_popup_bg.png"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17] to-transparent" />
            </div>

            <div className="p-6 pt-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C8A04A]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8A04A]">
                  Special Announcement
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                {promo.title}
              </h3>
              <p className="text-sm text-white/70 mb-5 leading-relaxed">
                {promo.description}
              </p>

              {promo.actionUrl && (
                <Link
                  href={promo.actionUrl}
                  onClick={handleDismiss}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white py-2.5 rounded-xl text-sm font-semibold hover:from-[#D4AC5A] hover:to-[#B8933E] transition-all shadow-[0_4px_12px_rgba(200,160,74,0.3)]"
                >
                  {promo.actionText || "Learn More"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
