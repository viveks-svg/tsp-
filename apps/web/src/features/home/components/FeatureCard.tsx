"use client";

import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { MessageCircle, FileText, Clock } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  FileText,
  Clock,
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  highlighted?: boolean;
}

export default function FeatureCard({
  title,
  description,
  icon,
  highlighted = false,
}: FeatureCardProps) {
  const IconComponent = iconMap[icon] || MessageCircle;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-2xl p-6 lg:p-8 text-center",
        "transition-all duration-300",
        highlighted
          ? "bg-gradient-to-br from-gold to-gold-soft text-navy shadow-[0_8px_40px_rgba(244,180,0,0.25)]"
          : "bg-white border border-gold/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)]"
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5",
          highlighted ? "bg-white/25" : "bg-gold/10"
        )}
      >
        <IconComponent
          className={cn("w-6 h-6", highlighted ? "text-navy" : "text-gold")}
        />
      </div>
      <h3
        className={cn(
          "font-heading text-xl font-bold mb-3",
          highlighted ? "text-navy" : "text-dark"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed",
          highlighted ? "text-navy/70" : "text-dark/60"
        )}
      >
        {description}
      </p>
    </motion.div>
  );
}
