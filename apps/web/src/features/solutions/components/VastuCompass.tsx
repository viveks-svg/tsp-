/**
 * Inline SVG Vastu Compass illustration — an 8-directional compass
 * with a Vastu Purusha Mandala grid overlay. 
 * Server component (pure SVG, no interactivity).
 */
export default function VastuCompass() {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 140;

  // 8 cardinal & ordinal directions
  const directions = [
    { label: "N", angle: -90, primary: true },
    { label: "NE", angle: -45, primary: false },
    { label: "E", angle: 0, primary: true },
    { label: "SE", angle: 45, primary: false },
    { label: "S", angle: 90, primary: true },
    { label: "SW", angle: 135, primary: false },
    { label: "W", angle: 180, primary: true },
    { label: "NW", angle: -135, primary: false },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      aria-label="Vastu compass illustration"
    >
      {/* Background circles */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#071B8D" strokeWidth="1" opacity="0.15" />
      <circle cx={cx} cy={cy} r={r * 0.75} fill="none" stroke="#071B8D" strokeWidth="0.5" opacity="0.1" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="#F6A000" strokeWidth="0.5" opacity="0.2" />

      {/* 9×9 Mandala grid */}
      {Array.from({ length: 10 }).map((_, i) => {
        const offset = (r * 1.4) / 9;
        const startX = cx - (r * 0.7);
        const startY = cy - (r * 0.7);
        return (
          <g key={`grid-${i}`}>
            <line
              x1={startX + offset * i} y1={startY}
              x2={startX + offset * i} y2={startY + r * 1.4}
              stroke="#071B8D" strokeWidth="0.3" opacity="0.08"
            />
            <line
              x1={startX} y1={startY + offset * i}
              x2={startX + r * 1.4} y2={startY + offset * i}
              stroke="#071B8D" strokeWidth="0.3" opacity="0.08"
            />
          </g>
        );
      })}

      {/* Direction lines and labels */}
      {directions.map((d) => {
        const endX = cx + r * Math.cos(toRad(d.angle));
        const endY = cy + r * Math.sin(toRad(d.angle));
        const labelX = cx + (r + 16) * Math.cos(toRad(d.angle));
        const labelY = cy + (r + 16) * Math.sin(toRad(d.angle));

        return (
          <g key={d.label}>
            <line
              x1={cx} y1={cy}
              x2={endX} y2={endY}
              stroke={d.primary ? "#F6A000" : "#071B8D"}
              strokeWidth={d.primary ? 1.5 : 0.8}
              opacity={d.primary ? 0.7 : 0.3}
            />
            <text
              x={labelX} y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={d.primary ? "#F6A000" : "#071B8D"}
              fontSize={d.primary ? 12 : 10}
              fontWeight={d.primary ? 700 : 500}
              fontFamily="Poppins, sans-serif"
              opacity={d.primary ? 0.9 : 0.5}
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Center — Brahma Sthana */}
      <circle cx={cx} cy={cy} r={12} fill="#F6A000" opacity="0.15" />
      <circle cx={cx} cy={cy} r={5} fill="#F6A000" opacity="0.6" />
      <circle cx={cx} cy={cy} r={2} fill="#071B8D" opacity="0.8" />
    </svg>
  );
}
