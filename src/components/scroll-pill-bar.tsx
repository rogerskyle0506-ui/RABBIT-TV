import React, { useState, useRef, useEffect, useCallback } from "react";
import { AppTheme } from "@/lib/settings";

interface PillOption {
  id: string;
  label: string;
}

interface ScrollPillBarProps {
  options: PillOption[];
  activeId: string;
  onSelect: (id: string) => void;
  appTheme: AppTheme;
  getPrimaryBgColor: (theme: AppTheme) => string;
}

export function ScrollPillBar({
  options,
  activeId,
  onSelect,
  appTheme,
  getPrimaryBgColor,
}: ScrollPillBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollBounds = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Scroll margin threshold (5px) prevents rounding precision glitches on high-DPI displays
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollBounds();

    // Listen for manual user scrolling
    container.addEventListener("scroll", checkScrollBounds, { passive: true });

    // Listen for container resize or dynamic pill layout recalculations
    const resizeObserver = new ResizeObserver(() => {
      checkScrollBounds();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollBounds);
      resizeObserver.disconnect();
    };
  }, [options, checkScrollBounds]);

  // Dynamic Theme Color Mapping for the micro-arrows & soft neon aura
  const getThemeArrowColor = (theme: AppTheme) => {
    switch (theme) {
      case "red":
        return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]";
      case "midnight":
        return "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]";
      case "emerald":
        return "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]";
      case "amber":
        return "text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]";
      case "cyan":
        return "text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]";
      case "violet":
      default:
        return "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]";
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-1.5">
      {/* Left Side Edge Fade + Theme-Matched Slow Glowing Left Arrow */}
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10 flex items-center justify-start pl-2.5 transition-opacity duration-300 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className={`text-sm font-black transition-colors duration-300 animate-slow-glow ${getThemeArrowColor(appTheme)}`}>
          ‹
        </span>
      </div>

      {/* Scrollable Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none px-2 py-1"
      >
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition shrink-0 ${
              activeId === item.id
                ? `${getPrimaryBgColor(appTheme)} text-white shadow-md`
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Right Side Edge Fade + Theme-Matched Slow Glowing Right Arrow */}
      <div
        className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/90 via-black/40 to-transparent z-10 flex items-center justify-end pr-2.5 transition-opacity duration-300 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className={`text-sm font-black transition-colors duration-300 animate-slow-glow ${getThemeArrowColor(appTheme)}`}>
          ›
        </span>
      </div>
    </div>
  );
}
