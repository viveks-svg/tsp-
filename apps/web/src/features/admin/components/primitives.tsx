import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Admin design primitives — the royal house style.
 * Ivory cards on parchment, hairline borders, Cinzel eyebrows,
 * Playfair headings, Inter for figures and body.
 */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-cinzel text-[11px] font-semibold uppercase tracking-[0.22em] text-bronze", className)}>
      {children}
    </p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="font-playfair text-[32px] leading-tight font-semibold text-ink md:text-[38px]">{title}</h1>
        {description && <p className="max-w-2xl text-[15px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-hairline bg-ivory shadow-[0_1px_0_rgba(26,23,18,0.03),0_12px_32px_-18px_rgba(26,23,18,0.18)]",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-6 pt-6 md:px-7">
          <div className="space-y-1">
            {title && <h2 className="font-playfair text-xl font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("px-6 pb-6 pt-5 md:px-7", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-[13px] font-medium text-bronze hover:text-ink"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function StatTile({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-hairline bg-ivory p-6 shadow-[0_1px_0_rgba(26,23,18,0.03),0_12px_32px_-18px_rgba(26,23,18,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-parchment text-bronze">
            {icon}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-inter text-[30px] leading-none font-semibold tracking-tight text-ink">{value}</p>
        {detail && <p className="text-[13px] text-ink-3">{detail}</p>}
      </div>
    </div>
  );
}

/** Signed change against a named period; colour carries direction, text carries meaning. */
export function Delta({ value, period }: { value: number | null; period: string }) {
  if (value === null) return <span className="text-ink-3">No {period} figures to compare</span>;
  const up = value >= 0;
  return (
    <span className={up ? "text-emerald-deep" : "text-garnet"}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(0)}% <span className="text-ink-3">vs {period}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-parchment", className)} />;
}

export function GoldRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-px w-full bg-gradient-to-r from-transparent via-champagne/60 to-transparent", className)}
    />
  );
}
