import { cn } from "@/lib/cn";

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  delay?: number;
}

export default function FloatingElement({
  children,
  className,
}: FloatingElementProps) {
  return (
    <div className={cn("animate-float", className)}>
      {children}
    </div>
  );
}
