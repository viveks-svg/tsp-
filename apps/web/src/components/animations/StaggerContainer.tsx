import { cn } from "@/lib/cn";

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

export default function StaggerContainer({
  children,
  className,
}: StaggerContainerProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
