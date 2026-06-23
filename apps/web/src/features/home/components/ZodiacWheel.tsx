"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zodiacSigns } from "@/lib/data/zodiac";
import { cn } from "@/lib/cn";

// Crisp SVG paths for the 12 zodiac symbols, designed on a 24x24 grid
const zodiacPaths: Record<string, string> = {
  Aries: "M12 21v-9c0-3 2.5-5.5 5.5-5.5S23 9 23 12M12 12c0-3-2.5-5.5-5.5-5.5S1 9 1 12",
  Taurus: "M12 9a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-8-5c2 4 6 5 8 5s6-1 8-5",
  Gemini: "M5 4h14M5 20h14M9 4v16M15 4v16",
  Cancer: "M9 14a3 3 0 1 0 3-3H6m9 0a3 3 0 1 0-3 3h6",
  Leo: "M7 16a3 3 0 1 1-3-3c2 0 4-2 5-5a5 5 0 0 1 9 1c0 4-3 7-5 9",
  Virgo: "M4 8v10c0 2 1.5 3 3 3s3-1 3-3V8c0-2 1.5-3 3-3s3 1 3 3v8c0 3 1.5 4 3 2s2-5 0-6c-2-1-3 1-3 3v6",
  Libra: "M4 20h16M4 14h5a3 3 0 0 1 6 0h5",
  Scorpio: "M4 8v10c0 2 1.5 3 3 3s3-1 3-3V8c0-2 1.5-3 3-3s3 1 3 3v8c0 2 1 3 3 3h3m-3-3l3 3-3 3",
  Sagittarius: "M4 20L20 4M14 4h6v6M9 11l4 4",
  Capricorn: "M4 6l4 10 4-10c0 3 2 5 4 5s3-2 3-4c0-3-3-4-5-2l4 10",
  Aquarius: "M4 9l3-3 3 3 3-3 3 3 3-3M4 17l3-3 3 3 3-3 3 3 3-3",
  Pisces: "M5 4c3 3 3 13 0 16M19 4c-3 3-3 13 0 16M4 12h16",
};

// Helper to calculate SVG path for a circular ring slice (annular sector)
const getAnnularWedgePath = (
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  startAngle: number,
  endAngle: number
) => {
  const rad = Math.PI / 180;
  const x1_out = cx + r2 * Math.cos(startAngle * rad);
  const y1_out = cy + r2 * Math.sin(startAngle * rad);
  const x2_out = cx + r2 * Math.cos(endAngle * rad);
  const y2_out = cy + r2 * Math.sin(endAngle * rad);
  const x1_in = cx + r1 * Math.cos(startAngle * rad);
  const y1_in = cy + r1 * Math.sin(startAngle * rad);
  const x2_in = cx + r1 * Math.cos(endAngle * rad);
  const y2_in = cy + r1 * Math.sin(endAngle * rad);

  const f = (n: number) => n.toFixed(3);
  return `M ${f(x1_out)} ${f(y1_out)} A ${r2} ${r2} 0 0 1 ${f(x2_out)} ${f(y2_out)} L ${f(x2_in)} ${f(y2_in)} A ${r1} ${r1} 0 0 0 ${f(x1_in)} ${f(y1_in)} Z`;
};

// Standard sparkle path
const sparklePath = "M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5 Z";

export default function ZodiacWheel({ className }: { className?: string }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Wheel configuration
  const cx = 250;
  const cy = 250;
  const innerRadius = 80;
  const outerRadius = 205;
  const iconRadius = 145;
  const animationDuration = 60;

  const outerDecorRadius = outerRadius + 8;   // beads
  const sparkleRadius = outerRadius + 16;     // sparkles
  const ringOuterRadius = outerRadius + 5;    // outer border ring
  const ringDashRadius = outerRadius + 13;    // dashed ring

  return (
    <div className={cn("relative w-full aspect-square max-w-[520px] select-none", className)}>
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full object-contain overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial glow background */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="1" />
            <stop offset="40%" stopColor="#FFF5DC" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#F6A000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F6A000" stopOpacity="0" />
          </radialGradient>

          {/* Radial gradient for the sun center */}
          <radialGradient id="sunInner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF9" />
            <stop offset="60%" stopColor="#FFF0C8" />
            <stop offset="90%" stopColor="#F6A000" />
            <stop offset="100%" stopColor="#D88D14" />
          </radialGradient>

          {/* Glossy 3D sphere gradient */}
          <radialGradient id="goldSphere" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF2D6" />
            <stop offset="40%" stopColor="#F6A000" />
            <stop offset="90%" stopColor="#D88D14" />
            <stop offset="100%" stopColor="#8A5B07" />
          </radialGradient>

          {/* Symmetrical radial gradient for sun rays */}
          <radialGradient id="sunRayGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFF3D6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F6A000" stopOpacity="0.3" />
          </radialGradient>

          {/* Trailing tail gradient for meteors */}
          <linearGradient id="meteorTail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F6A000" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFEAA7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFDF9" stopOpacity="1" />
          </linearGradient>

          {/* Gradients for wheel wedges */}
          <linearGradient id="goldSegment" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F6A000" stopOpacity="0.015" />
            <stop offset="100%" stopColor="#F6A000" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="goldSegmentHover" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F6A000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F6A000" stopOpacity="0.25" />
          </linearGradient>

          {/* Golden borders gradient */}
          <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F6A000" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFD37F" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#D88D14" stopOpacity="0.4" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Large background glow */}
        <circle cx={cx} cy={cy} r={230} fill="url(#sunGlow)" pointerEvents="none" />

        {/* Meteors flying across the background */}
        <g pointerEvents="none">
          {/* Meteor 1 (diagonal top-left to bottom-right, offset north) */}
          <motion.g
            initial={{ x: -150, y: 50, opacity: 0 }}
            animate={{
              x: [-150, 550],
              y: [50, 750],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              repeatDelay: 1,
              ease: "linear",
            }}
          >
            <line x1={-80} y1={-80} x2={0} y2={0} stroke="url(#meteorTail)" strokeWidth="3" strokeLinecap="round" />
            <circle cx={0} cy={0} r={4} fill="#FFFDF9" filter="url(#glow)" />          </motion.g>

          {/* Meteor 2 (diagonal top-left to bottom-right, offset south, delayed) */}
          <motion.g
            initial={{ x: -100, y: 150, opacity: 0 }}
            animate={{
              x: [-100, 500],
              y: [150, 750],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              repeatDelay: 1,
              delay: 3,
              ease: "linear",
            }}
          >
            <line x1={-80} y1={-80} x2={0} y2={0} stroke="url(#meteorTail)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx={0} cy={0} r={4} fill="#FFFDF9" filter="url(#glow)" />          </motion.g>
        </g>
        <g pointerEvents="none">
          <motion.g
            initial={{ x: -180, y: 20, opacity: 0 }}
            animate={{ x: [-180, 560], y: [20, 520], opacity: [0, 1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 1.5, ease: "linear" }}
          >
            <line x1={-90} y1={-90} x2={0} y2={0} stroke="url(#meteorTail)" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={0} cy={0} r={4.5} fill="#FFFFFF" filter="url(#glow)" />
          </motion.g>

          <motion.g
            initial={{ x: -120, y: 140, opacity: 0 }}
            animate={{ x: [-120, 520], y: [140, 680], opacity: [0, 1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.0, repeatDelay: 2, delay: 0.8, ease: "linear" }}
          >
            <line x1={-90} y1={-90} x2={0} y2={0} stroke="url(#meteorTail)" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx={0} cy={0} r={4.5} fill="#FFFFFF" filter="url(#glow)" />
          </motion.g>

          <motion.g
            initial={{ x: -540, y: 540, opacity: 0 }}
            animate={{ x: [140, -180], y: [-40, 720], opacity: [0, 1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, repeatDelay: 2.5, delay: 2, ease: "linear" }}
          >
            <line x1={0} y1={0} x2={90} y2={90} stroke="url(#meteorTail)" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx={0} cy={0} r={4.5} fill="#FFFFFF" filter="url(#glow)" />
          </motion.g>

          <motion.g
            initial={{ x: 610, y: 120, opacity: 0 }}
            animate={{ x: [610, -140], y: [120, 760], opacity: [0, 1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.9, repeatDelay: 1.2, delay: 3.2, ease: "linear" }}
          >
            <line x1={0} y1={0} x2={90} y2={90} stroke="url(#meteorTail)" strokeWidth="3" strokeLinecap="round" />
            <circle cx={0} cy={0} r={4.5} fill="#FFFFFF" filter="url(#glow)" />
          </motion.g>
        </g>

        {/* 2. Slow Counter-Clockwise Orbiting Sparkles */}
        <g
          className="animate-spin-counter-clockwise-45"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          pointerEvents="none"
        >
          {/* Sparkles situated around the outer perimeter */}
          <g transform={`translate(${(cx + 235 * Math.cos(0)).toFixed(3)}, ${(cy + 235 * Math.sin(0)).toFixed(3)})`}>
            <path d={sparklePath} fill="#F6A000" opacity="0.8" />
          </g>
          <g transform={`translate(${(cx + 235 * Math.cos((120 * Math.PI) / 180)).toFixed(3)}, ${(cy + 235 * Math.sin((120 * Math.PI) / 180)).toFixed(3)})`}>
            <path d={sparklePath} fill="#F6A000" opacity="0.5" />
          </g>
          <g transform={`translate(${(cx + 235 * Math.cos((240 * Math.PI) / 180)).toFixed(3)}, ${(cy + 235 * Math.sin((240 * Math.PI) / 180)).toFixed(3)})`}>
            <path d={sparklePath} fill="#F6A000" opacity="0.6" />
          </g>
        </g>

        {/* 3. Static decorative outer rings */}
        <circle
          cx={cx}
          cy={cy}
          r={220}
          fill="none"
          stroke="url(#goldBorder)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          pointerEvents="none"
          opacity="0.6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={212}
          fill="none"
          stroke="url(#goldBorder)"
          strokeWidth="0.75"
          pointerEvents="none"
          opacity="0.8"
        />

        {/* Rotating golden beads on the outer rings */}
        {/* Clockwise bead on r=212 */}
        <g
          className="animate-spin-clockwise-25"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          pointerEvents="none"
        >
          <circle cx={(cx + 212 * Math.cos(0)).toFixed(3)} cy={(cy + 212 * Math.sin(0)).toFixed(3)} r={5} fill="url(#goldSphere)" />
        </g>

        {/* Counter-clockwise beads on r=220 */}
        <g
          className="animate-spin-counter-clockwise-32"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          pointerEvents="none"
        >
          <circle cx={(cx + 220 * Math.cos((120 * Math.PI) / 180)).toFixed(3)} cy={(cy + 220 * Math.sin((120 * Math.PI) / 180)).toFixed(3)} r={6} fill="url(#goldSphere)" />
          <circle cx={(cx + 220 * Math.cos((300 * Math.PI) / 180)).toFixed(3)} cy={(cy + 220 * Math.sin((300 * Math.PI) / 180)).toFixed(3)} r={6} fill="url(#goldSphere)" />
        </g>

        {/* 4. MAIN ROTATING WHEEL (Rotates Clockwise) */}
        <g
          className="animate-spin-clockwise-60"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Wedges & Dividing Spokes */}
          {zodiacSigns.map((sign, i) => {
            const startAngle = i * 30 - 15;
            const endAngle = startAngle + 30;
            const path = getAnnularWedgePath(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
            const isHovered = hoveredIndex === i;

            return (
              <path
                key={`wedge-${sign}`}
                d={path}
                fill={isHovered ? "url(#goldSegmentHover)" : "url(#goldSegment)"}
                stroke="url(#goldBorder)"
                strokeWidth={isHovered ? "1.5" : "0.5"}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {/* Inner spoke dividers */}
          {zodiacSigns.map((sign, i) => {
            const angle = i * 30 - 15;
            const rad = Math.PI / 180;
            const x1 = (cx + innerRadius * Math.cos(angle * rad)).toFixed(3);
            const y1 = (cy + innerRadius * Math.sin(angle * rad)).toFixed(3);
            const x2 = (cx + outerRadius * Math.cos(angle * rad)).toFixed(3);
            const y2 = (cy + outerRadius * Math.sin(angle * rad)).toFixed(3);
            return (
              <line
                key={`spoke-${sign}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#goldBorder)"
                strokeWidth="0.5"
                opacity="0.4"
                pointerEvents="none"
              />
            );
          })}

          {/* Inner Ring border outlining the wedges */}
          <circle
            cx={cx}
            cy={cy}
            r={outerRadius}
            fill="none"
            stroke="url(#goldBorder)"
            strokeWidth="0.5"
            pointerEvents="none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius}
            fill="none"
            stroke="url(#goldBorder)"
            strokeWidth="0.5"
            pointerEvents="none"
          />

          {/* 5. Zodiac Icons (Counter-rotated dynamically so they stay upright) */}
          {zodiacSigns.map((sign, i) => {
            const angleRad = ((i * 30) * Math.PI) / 180;
            const iconX = cx + iconRadius * Math.cos(angleRad);
            const iconY = cy + iconRadius * Math.sin(angleRad);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={`icon-group-${sign}`}
                className="animate-spin-counter-clockwise-60"
                style={{ transformOrigin: `${iconX.toFixed(2)}px ${iconY.toFixed(2)}px` }}
                pointerEvents="none"
              >
                <g
                  transform={`translate(${(iconX - 12).toFixed(3)}, ${(iconY - 12).toFixed(3)})`}
                  className="transition-all duration-300"
                  style={{
                    filter: isHovered ? "url(#glow)" : "none",
                    color: isHovered ? "#071B8D" : "#E6A31C",
                    opacity: isHovered ? 1 : 0.8,
                  }}
                >
                  <path
                    d={zodiacPaths[sign]}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </g>
            );
          })}
        </g>

        {/* 6. CENTER SUN CORE (Static outer, independently rotating rays) */}
        {/* Pulsating glow background for center */}
        <circle
          cx={cx}
          cy={cy}
          r={78}
          fill="url(#sunGlow)"
          className="animate-glow-pulse-4"
          pointerEvents="none"
        />

        {/* Sun Rays (rotating slowly counter-clockwise) */}
        <g
          className="animate-spin-counter-clockwise-60"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          pointerEvents="none"
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const rad = Math.PI / 180;
            const rBase = 40;
            const rApex = 74;

            const ax = (cx + rApex * Math.cos(angle * rad)).toFixed(3);
            const ay = (cy + rApex * Math.sin(angle * rad)).toFixed(3);
            const bx1 = (cx + rBase * Math.cos((angle - 15) * rad)).toFixed(3);
            const by1 = (cy + rBase * Math.sin((angle - 15) * rad)).toFixed(3);
            const bx2 = (cx + rBase * Math.cos((angle + 15) * rad)).toFixed(3);
            const by2 = (cy + rBase * Math.sin((angle + 15) * rad)).toFixed(3);

            return (
              <polygon
                key={`sun-ray-${i}`}
                points={`${bx1},${by1} ${ax},${ay} ${bx2},${by2}`}
                fill="url(#sunRayGrad)"
                stroke="url(#goldBorder)"
                strokeWidth="0.5"
                opacity="0.95"
              />
            );
          })}
        </g>

        {/* Solid Sun Core Circle */}
        <circle
          cx={cx}
          cy={cy}
          r={48}
          fill="url(#sunInner)"
          stroke="url(#goldBorder)"
          strokeWidth="0.75"
          pointerEvents="none"
        />

        {/* Small decorative inner dots */}
        <circle
          cx={cx}
          cy={cy}
          r={32}
          fill="none"
          stroke="url(#goldBorder)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          pointerEvents="none"
          opacity="0.4"
        />

        {/* 7. CENTER TEXT / STATE DISPLAY (Cross-fading with Framer Motion) */}
        <g pointerEvents="none">
          <AnimatePresence mode="wait">
            {hoveredIndex === null ? (
              <motion.g
                key="sun-core-symbol"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* A beautiful golden star in the center when not hovered */}
                {/* <path
                  d="M250 236 L253.5 246.5 L264 250 L253.5 253.5 L250 264 L246.5 253.5 L236 250 L246.5 246.5 Z"
                  fill="url(#goldBorder)"
                  transform="scale(1.2) translate(-52, -52)"
                /> */}
              </motion.g>
            ) : (
              <motion.g
                key="sign-info-overlay"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
              >
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#D88D14"
                  fontSize="9"
                  fontWeight="600"
                  letterSpacing="0.25em"
                  className="font-sans opacity-95"
                >
                  ZODIAC
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fill="#071B8D"
                  fontSize="16"
                  fontWeight="700"
                  letterSpacing="0.05em"
                  className="font-heading"
                >
                  {zodiacSigns[hoveredIndex].toUpperCase()}
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  );
}
