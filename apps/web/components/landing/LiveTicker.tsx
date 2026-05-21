"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlatformLive } from "./LivePlatformProvider";

type LiveTickerProps = {
  /** Continuous marquee scroll — best on /movement */
  variant?: "rotate" | "marquee";
};

function buildTickerLines(
  pulse: string[],
  feedMessages: string[]
): string[] {
  const lines = [...pulse, ...feedMessages].filter(Boolean);
  return lines.length ? lines : ["Participation updates appear here as schools verify codes."];
}

export function LiveTicker({ variant = "rotate" }: LiveTickerProps): JSX.Element {
  const { data, pulsing } = usePlatformLive();
  const lines = useMemo(
    () => buildTickerLines(data.pulse, data.feed.map((item) => item.message)),
    [data.pulse, data.feed]
  );

  if (variant === "marquee") {
    return <LiveTickerMarquee lines={lines} pulsing={pulsing} />;
  }

  return <LiveTickerRotate lines={lines} pulsing={pulsing} updatedAt={data.updatedAt} />;
}

function LiveTickerRotate({
  lines,
  pulsing,
  updatedAt
}: {
  lines: string[];
  pulsing: boolean;
  updatedAt: string;
}): JSX.Element {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (lines.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % lines.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [lines.length]);

  useEffect(() => {
    setIndex(0);
  }, [updatedAt]);

  const line = lines[index] ?? lines[0];

  return (
    <motion.div
      className={`ds-ticker${pulsing ? " ds-ticker--pulse" : ""}`}
      aria-live="polite"
      animate={pulsing ? { boxShadow: "0 0 0 2px rgba(108, 194, 74, 0.35)" } : { boxShadow: "0 0 0 0 rgba(108, 194, 74, 0)" }}
      transition={{ duration: 0.45 }}
    >
      <span className="ds-ticker-dot" />
      <span className="ds-ticker-label">Live</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={`${index}-${line}`}
          className="ds-ticker-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          {line}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

function LiveTickerMarquee({ lines, pulsing }: { lines: string[]; pulsing: boolean }): JSX.Element {
  const track = [...lines, ...lines];

  return (
    <div className={`ds-ticker ds-ticker--marquee${pulsing ? " ds-ticker--pulse" : ""}`} aria-live="polite">
      <span className="ds-ticker-dot" />
      <span className="ds-ticker-label">Live</span>
      <div className="ds-ticker-marquee-viewport">
        <motion.div
          className="ds-ticker-marquee-track"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: Math.max(lines.length * 6, 24), repeat: Infinity, ease: "linear" }}
        >
          {track.map((line, index) => (
            <span key={`${index}-${line}`} className="ds-ticker-marquee-item">
              {line}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
