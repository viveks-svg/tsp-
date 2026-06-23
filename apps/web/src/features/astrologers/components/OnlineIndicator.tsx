"use client";

import { cn } from "@/lib/cn";

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function OnlineIndicator({
  isOnline,
  className,
  showLabel = true,
}: OnlineIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            isOnline ? "bg-success" : "bg-muted"
          )}
        />
      </span>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium font-poppins",
            isOnline ? "text-success" : "text-muted"
          )}
        >
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
