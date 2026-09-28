"use client";

import { useEffect, useRef, useState } from "react";
import { calendarParts, formatINR, formatINRCompact } from "../lib/format";

export interface TrendPoint {
  day: string; // YYYY-MM-DD (IST)
  booking: number;
  wallet: number;
  shop: number;
}

const PAD = { top: 12, right: 8, bottom: 28, left: 52 };
const BAR_MAX = 18;
const RADIUS = 4;

/** Rounds the axis maximum up to a clean 1 / 2 / 2.5 / 5 × 10ⁿ step. */
function niceTicks(max: number, count = 3) {
  if (max <= 0) return [0, 1000, 2000, 3000];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

/** Column with a rounded data-end and a square base. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const total = (p: TrendPoint) => p.booking + p.wallet + p.shop;

const dayLabel = (day: string) => {
  const c = calendarParts(day);
  return { short: `${c.day} ${c.month}`, full: c.full };
};

/**
 * Money received per period, one column each. Daily by default (the last
 * column reads "Today"); pass `formatLabel` and `lastIsToday={false}` for months.
 */
export function RevenueChart({
  data,
  height: HEIGHT = 200,
  formatLabel = dayLabel,
  lastIsToday = true,
  unit = "day",
}: {
  data: TrendPoint[];
  height?: number;
  formatLabel?: (day: string) => { short: string; full: string };
  lastIsToday?: boolean;
  unit?: "day" | "month";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ticks = niceTicks(Math.max(0, ...data.map(total)));
  const yMax = ticks[ticks.length - 1];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(2, Math.min(BAR_MAX, band - 2)); // ≥2px surface gap between neighbours
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / (width < 520 ? 4 : 6)));

  const hovered = hover !== null ? data[hover] : null;
  const summary = `Money received per ${unit} over ${data.length} ${unit}s, ${formatINR(
    data.reduce((s, p) => s + total(p), 0),
  )} in total.`;

  return (
    <div ref={wrapRef} className="relative w-full" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={summary} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#EDE6D6" strokeWidth={1} />
              <text
                x={PAD.left - 10}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-3 font-inter text-[11px] tabular-nums"
              >
                {t === 0 ? "₹0" : formatINRCompact(t)}
              </text>
            </g>
          ))}

          {data.map((p, i) => {
            const v = total(p);
            const cx = PAD.left + band * i + band / 2;
            const h = v > 0 ? Math.max(2, (v / yMax) * plotH) : 0;
            const isLast = i === data.length - 1;
            return (
              <g key={p.day}>
                {h > 0 && (
                  <path
                    d={columnPath(cx - barW / 2, PAD.top + plotH - h, barW, h)}
                    className={hover === i ? "fill-champagne" : "fill-regal"}
                  />
                )}
                {(i % labelEvery === 0 || isLast) && (
                  <text
                    x={cx}
                    y={HEIGHT - 8}
                    textAnchor={isLast && lastIsToday ? "end" : "middle"}
                    className="fill-ink-3 font-inter text-[11px]"
                  >
                    {isLast && lastIsToday ? "Today" : formatLabel(p.day).short}
                  </text>
                )}
                {/* Hit target: the full band, taller than the mark. */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={v > 0 ? 0 : -1}
                  aria-label={`${formatLabel(p.day).full}: ${formatINR(v)}`}
                />
              </g>
            );
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="#D9CFBA" strokeWidth={1} />
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-60 rounded-xl border border-hairline bg-ivory px-4 py-3 shadow-[0_18px_40px_-16px_rgba(11,18,51,0.35)]"
          style={{
            left: Math.min(Math.max(PAD.left + band * hover + band / 2 - 120, 0), Math.max(0, width - 240)),
          }}
        >
          <p className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze">
            {formatLabel(hovered.day).full}
          </p>
          <p className="mt-1 font-inter text-lg font-semibold text-ink">{formatINR(total(hovered))}</p>
          <dl className="mt-2 space-y-1 text-[12px]">
            {(
              [
                ["Sessions & bookings", hovered.booking],
                ["Wallet top-ups", hovered.wallet],
                ["Shop", hovered.shop],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="whitespace-nowrap text-ink-3">{label}</dt>
                <dd className="font-medium tabular-nums text-ink-2">{formatINR(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th>{unit === "month" ? "Month" : "Date"}</th>
            <th>Sessions and bookings</th>
            <th>Wallet top-ups</th>
            <th>Shop</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.day}>
              <td>{formatLabel(p.day).full}</td>
              <td>{formatINR(p.booking)}</td>
              <td>{formatINR(p.wallet)}</td>
              <td>{formatINR(p.shop)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
