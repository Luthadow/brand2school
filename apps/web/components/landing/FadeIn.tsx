"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatCount } from "../../lib/formatCount";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function FadeIn({ children, className, delay = 0 }: FadeInProps): JSX.Element {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 1, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

type CounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

export function ImpactCounter({ value, suffix = "", prefix = "", label }: CounterProps): JSX.Element {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, value]);

  const formatted = prefix + (value >= 1000 ? formatCount(display) : String(display)) + suffix;

  return (
    <div ref={ref} className="lp-metric">
      <span className="lp-metric-value">{formatted}</span>
      <p className="lp-metric-label">{label}</p>
    </div>
  );
}
