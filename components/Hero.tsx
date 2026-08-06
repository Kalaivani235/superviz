"use client";

import { motion } from "framer-motion";
import { METRIC_COLORS, METRIC_LABELS } from "@/lib/constants";
import { formatSigned } from "@/lib/formatting";
import type { HeadlineMetrics, MetricKey } from "@/lib/types";

type Props = {
  countryCount: number;
  regionCount: number;
  yearRange: [number, number];
  baselineYear: number;
  metrics: HeadlineMetrics;
  onExplore: () => void;
};

const particles = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 29) % 97}%`,
  top: `${12 + ((index * 47) % 76)}%`,
  delay: `${(index % 7) * 0.42}s`,
  size: `${2 + (index % 3)}px`,
}));

export default function Hero({ countryCount, regionCount, yearRange, baselineYear, metrics, onExplore }: Props) {
  const previewCards: { metric: MetricKey; value: string }[] = [
    { metric: "live", value: formatSigned(metrics.averageLiveChange, 1, " yrs") },
    { metric: "thrive", value: `${metrics.thriveRecoveredCount}/${metrics.thriveCountryCount} above 2019` },
    { metric: "connect", value: formatSigned(metrics.averageConnectChange, 1, " pp") },
    { metric: "feel", value: formatSigned(metrics.averageFeelChange, 2, " pts") },
  ];

  return (
    <section id="overview" className="hero" aria-labelledby="hero-title">
      <div className="hero-field" aria-hidden="true">
        {particles.map((particle, index) => (
          <span
            key={index}
            style={{ left: particle.left, top: particle.top, animationDelay: particle.delay, width: particle.size, height: particle.size }}
          />
        ))}
      </div>
      <div className="hero-grid" aria-hidden="true" />
      <motion.div
        className="hero-content section-shell"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="status-pill">
          <span /> {countryCount} COUNTRIES · {regionCount} REGIONS · {yearRange[0]}–{yearRange[1]}
        </p>
        <h1 id="hero-title">
          <span>RECOVERY</span>
          <em>ATLAS</em>
        </h1>
        <p className="hero-subtitle">
          Economic activity returned quickly in many places. Health, connection and wellbeing followed very different paths.
        </p>
        <p className="hero-context">
          Using {baselineYear} as the pre-pandemic baseline, explore how {countryCount} economies recovered — or
          didn&apos;t — across four independent signals: LIVE, THRIVE, CONNECT and FEEL.
        </p>
        <div className="hero-preview" role="group" aria-label="Global averages since 2019 preview">
          {previewCards.map((card) => (
            <div className="hero-preview-card" key={card.metric} style={{ "--accent": METRIC_COLORS[card.metric] } as React.CSSProperties}>
              <strong>{METRIC_LABELS[card.metric]}</strong>
              <span>{card.value}</span>
            </div>
          ))}
        </div>
        <button type="button" className="scroll-cue" onClick={onExplore}>
          <span>Explore the Recovery Orbit</span>
          <b aria-hidden="true">↓</b>
        </button>
      </motion.div>
      <div className="hero-index" aria-hidden="true">
        {yearRange[0]} <span>→</span> {yearRange[1]}
      </div>
    </section>
  );
}
