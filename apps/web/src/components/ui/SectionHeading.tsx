import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  dark?: boolean;
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  align = "center",
  dark = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 lg:mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      <h2
        className={cn(
          "font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-tight tracking-tight",
          dark ? "text-white" : "text-dark"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base md:text-lg max-w-2xl leading-relaxed",
            align === "center" && "mx-auto",
            dark ? "text-white/70" : "text-dark/60"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
