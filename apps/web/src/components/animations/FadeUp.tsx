import { cn } from "@/lib/cn";

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  onMount?: boolean;
}

export default function FadeUp({
  children,
  className,
}: FadeUpProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
