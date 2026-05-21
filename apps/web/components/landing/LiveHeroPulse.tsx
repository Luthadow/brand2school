"use client";

import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { formatCount } from "../../lib/formatCount";
import { usePlatformLive } from "./LivePlatformProvider";

export function LiveHeroProofStrip(): JSX.Element {
  const { data, pulsing } = usePlatformLive();
  const { stats } = data;

  return (
    <motion.div
      className="lp-hero-proof-strip"
      animate={pulsing ? { opacity: [1, 0.92, 1] } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <span>
        <motion.strong
          key={stats.activeSchools}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {formatCount(stats.activeSchools)}
        </motion.strong>{" "}
        schools active
      </span>
      <span className="lp-hero-proof-dot" />
      <span>
        <motion.strong
          key={stats.validSubmissions}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {formatCount(stats.validSubmissions)}
        </motion.strong>{" "}
        verified participations
      </span>
      <span className="lp-hero-proof-dot" />
      <span>
        <motion.strong
          key={stats.provincesActive}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {stats.provincesActive}
        </motion.strong>{" "}
        provinces
      </span>
    </motion.div>
  );
}

export function LiveHeroMonthCard(): JSX.Element {
  const { data, pulsing } = usePlatformLive();
  const { stats } = data;

  return (
    <motion.div
      className="lp-hero-float-card lp-hero-float-card--bottom"
      animate={pulsing ? { y: [0, -4, 0] } : { y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <Users size={18} />
      <motion.div
        key={stats.submissionsThisMonth}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
      >
        <strong>{formatCount(stats.submissionsThisMonth)}</strong>
        <span>verified this month</span>
      </motion.div>
    </motion.div>
  );
}
