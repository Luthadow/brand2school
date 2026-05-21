"use client";

import { Award, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatCount } from "../../lib/formatCount";
import { provinceShort } from "../../lib/platformLive";
import { FadeIn } from "./FadeIn";
import { usePlatformLive } from "./LivePlatformProvider";

export function LiveMovementPanel(): JSX.Element {
  const { data, pulsing } = usePlatformLive();
  const { leaderboard, provinces } = data;

  return (
    <motion.div
      className="lp-movement-grid"
      animate={pulsing ? { scale: [1, 1.002, 1] } : { scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <FadeIn className="lp-leaderboard">
        <h3 className="lp-movement-panel-title">
          <Award size={20} />
          Top Contributing Schools
          <span className="lp-live-badge">This month</span>
        </h3>
        {leaderboard.length === 0 ? (
          <p className="lp-live-empty">No verified submissions yet — schools can register and start participating today.</p>
        ) : (
          <ol className="lp-leaderboard-list">
            {leaderboard.map((entry) => (
              <motion.li
                key={entry.schoolId}
                className="lp-leaderboard-row"
                layout
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
              >
                <span className="lp-leaderboard-rank">#{entry.rank}</span>
                <motion.div
                  className="lp-leaderboard-info"
                  initial={false}
                  animate={pulsing ? { x: [0, 2, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <strong>{entry.schoolName}</strong>
                  <span>{provinceShort(entry.province)} · {entry.district}</span>
                </motion.div>
                <motion.span
                  className="lp-leaderboard-score"
                  key={`${entry.schoolId}-${entry.submissions}`}
                  initial={{ scale: 1.15, color: "#6CC24A" }}
                  animate={{ scale: 1, color: "#003B8E" }}
                  transition={{ duration: 0.45 }}
                >
                  {formatCount(entry.submissions)}
                </motion.span>
              </motion.li>
            ))}
          </ol>
        )}
      </FadeIn>

      <FadeIn delay={0.1} className="lp-province-map">
        <h3 className="lp-movement-panel-title">
          <MapPin size={20} />
          Province Reach
          <span className="lp-live-badge">Verified</span>
        </h3>
        <motion.div className="lp-province-list" layout>
          {provinces.length === 0 ? (
            <p className="lp-live-empty">Province activity will appear as participation grows.</p>
          ) : (
            provinces.map((p) => (
              <div key={p.code} className="lp-province-row">
                <motion.div
                  className="lp-province-meta"
                  initial={false}
                  animate={pulsing ? { opacity: [1, 0.85, 1] } : { opacity: 1 }}
                >
                  <strong>{p.name}</strong>
                  <span>{p.schools} schools · {formatCount(p.submissions)} verified</span>
                </motion.div>
                <motion.div className="lp-province-bar-wrap" layout>
                  <motion.div
                    className="lp-province-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(p.pct, 4)}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </motion.div>
                <span className="lp-province-pct">{p.pct}%</span>
              </div>
            ))
          )}
        </motion.div>
      </FadeIn>
    </motion.div>
  );
}
