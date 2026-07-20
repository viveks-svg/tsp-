"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ReportCard } from "@/types/home";

interface ReportsCarouselProps {
  reports: ReportCard[];
  onAddReport: (report: ReportCard) => void;
}

export default function ReportsCarousel({ reports, onAddReport }: ReportsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % reports.length);
  }, [reports.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + reports.length) % reports.length);
  }, [reports.length]);

  useEffect(() => {
    if (!isPaused && !shouldReduceMotion) {
      timeoutRef.current = setTimeout(() => {
        handleNext();
      }, 2500);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, isPaused, shouldReduceMotion, handleNext]);

  const handleInteractionStart = () => {
    setIsPaused(true);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  // Keyboard accessibility within carousel
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement && carouselRef.current?.contains(document.activeElement)) {
        if (e.key === "ArrowLeft") {
          handleInteractionStart();
          handlePrev();
          handleInteractionEnd();
        } else if (e.key === "ArrowRight") {
          handleInteractionStart();
          handleNext();
          handleInteractionEnd();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const getPosition = (index: number) => {
    if (index === currentIndex) return "center";
    if (index === (currentIndex - 1 + reports.length) % reports.length) return "prev";
    if (index === (currentIndex + 1) % reports.length) return "next";

    const diff = index - currentIndex;
    const dist = Math.abs(diff) <= 2 ? diff : (diff > 0 ? diff - reports.length : diff + reports.length);
    return dist;
  };

  const variants = {
    center: {
      x: "0%",
      scale: 1,
      opacity: 1,
      zIndex: 10,
      transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.6 }
    },
    prev: {
      x: "-100%",
      scale: 0.85,
      opacity: 0.6,
      zIndex: 5,
      transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.6 }
    },
    next: {
      x: "100%",
      scale: 0.85,
      opacity: 0.6,
      zIndex: 5,
      transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.6 }
    },
    hidden: (dist: number) => ({
      x: dist < 0 ? "-150%" : "150%",
      scale: 0.7,
      opacity: 0,
      zIndex: 0,
      transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.6 }
    })
  };

  const reducedMotionVariants = {
    center: { opacity: 1, scale: 1, zIndex: 10, display: "block", x: 0 },
    prev: { opacity: 0, scale: 0.85, zIndex: 0, display: "none", x: 0 },
    next: { opacity: 0, scale: 0.85, zIndex: 0, display: "none", x: 0 },
    hidden: { opacity: 0, scale: 0.85, zIndex: 0, display: "none", x: 0 },
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div
      className="carousel-container relative w-full flex flex-col items-center"
      ref={carouselRef}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      tabIndex={-1}
    >
      {/* Carousel Track */}
      <div className="relative w-full h-[450px] md:h-[480px] flex items-center justify-center overflow-visible">
        {reports.map((report, index) => {
          const pos = getPosition(index);
          const isCenter = pos === "center";
          const isPrev = pos === "prev";
          const isNext = pos === "next";

          const variantName = typeof pos === "string" ? pos : "hidden";
          const customDist = typeof pos === "number" ? pos : 0;

          return (
            <motion.div
              key={report.slug}
              custom={customDist}
              variants={shouldReduceMotion ? reducedMotionVariants : variants}
              initial={false}
              animate={variantName}
              drag={isCenter && !shouldReduceMotion ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  handleNext();
                } else if (swipe > swipeConfidenceThreshold) {
                  handlePrev();
                }
              }}
              className={`absolute left-0 right-0 top-4 mx-auto w-full max-w-[280px] sm:max-w-sm md:max-w-[360px] ${isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
              onClick={() => {
                if (isPrev) { handlePrev(); }
                if (isNext) { handleNext(); }
              }}
            >
              <div
                className={`group w-full rounded-[22px] overflow-hidden border border-[#332D68]/55 shadow-[0_20px_60px_rgba(0,0,0,0.24)] bg-[#11102A] flex flex-col h-auto min-h-[400px] md:min-h-[420px] transition-all duration-300 ${isCenter ? 'shadow-[0_30px_80px_rgba(0,0,0,0.35)]' : ''}`}
              >
                {/* Top Image area */}
                <div className="relative h-[220px] shrink-0 w-full overflow-hidden bg-gradient-to-br from-[#332D73] via-[#241F56] to-[#15142F]">
                  <Image
                    src={report.imagePlaceholder || ""}
                    alt={report.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={`object-cover transition-transform duration-700 ${isCenter ? 'group-hover:scale-[1.02]' : ''}`}
                    priority={index === 0}
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#11102A] to-transparent z-10" />
                </div>

                {/* Bottom content area */}
                <div className="flex-1 bg-gradient-to-b from-[#FFFEFB] to-[#F4EEE3] px-5 py-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-playfair text-[20px] md:text-[22px] text-[#071B8D] font-bold leading-tight">
                      {report.title}
                    </h3>
                    <p className="mt-2 text-[13px] md:text-[14px] font-inter leading-relaxed text-[#6B5F52]">
                      Personalized insights designed to bring clarity, direction, and practical guidance.
                    </p>
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#E2C15D] to-transparent" />
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#8A8274] mb-1 font-poppins">
                        Starting at
                      </span>
                      <span className="font-inter text-[20px] md:text-[22px] text-[#F6A000] font-semibold leading-none">
                        ₹{report.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCenter) onAddReport(report);
                      }}
                      className="inline-flex items-center justify-center rounded-full border-[1.5px] border-[#F6A000] px-5 py-2 text-[12px] font-poppins font-semibold text-[#F6A000] whitespace-nowrap shrink-0 transition-all duration-300 hover:bg-[#F6A000] hover:text-white"
                    >
                      Get Report
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-8 z-20">
        {/* Desktop Prev Button */}
        <button
          onClick={handlePrev}
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-[#F6A000]/30 text-[#F6A000] hover:bg-[#F6A000] hover:text-white transition-all duration-300"
          aria-label="Previous report"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {reports.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                handleInteractionStart();
                setCurrentIndex(idx);
                handleInteractionEnd();
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-[#F6A000] w-6' : 'bg-white/30 hover:bg-white/50'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Desktop Next Button */}
        <button
          onClick={handleNext}
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-[#F6A000]/30 text-[#F6A000] hover:bg-[#F6A000] hover:text-white transition-all duration-300"
          aria-label="Next report"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
