"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { generateNarrative } from "@/lib/narrative";
import { METRIC_FULL_LABELS, METRIC_LABELS } from "@/lib/constants";
import { formatSigned, PATH_LABELS, shortRegionLabel } from "@/lib/formatting";
import type { CountryRecovery, MetricKey, SourceDefinition } from "@/lib/types";
import RecoveryProfile from "./RecoveryProfile";

type Props = {
  recovery: CountryRecovery;
  allRecoveries: CountryRecovery[];
  yearRange: [number, number];
  sources: SourceDefinition[];
};

const MAGNITUDE: Record<MetricKey, number> = { thrive: 30, live: 3, connect: 30, feel: 1.5 };
const CHANGE_KEY: Record<MetricKey, "thrivePctChange" | "liveAbsoluteChange" | "connectPointChange" | "feelAbsoluteChange"> = {
  thrive: "thrivePctChange",
  live: "liveAbsoluteChange",
  connect: "connectPointChange",
  feel: "feelAbsoluteChange",
};

export default function CountryPanel({ recovery, allRecoveries, yearRange, sources }: Props) {
  const [minYear, maxYear] = yearRange;
  // Scoped to this panel alone — scrubbing the recovery profile never
  // touches the Recovery Orbit's own year. Resets to minYear whenever a
  // different country is selected because the panel remounts (keyed by
  // iso3 below).
  const [year, setYear] = useState(minYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setYear((current) => (current >= maxYear ? minYear : current + 1));
    }, 1100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, minYear, maxYear]);

  const narrative = generateNarrative(recovery);

  const regionPeers = allRecoveries.filter(
    (c) => c.region === recovery.region && c.thrivePctChange !== null,
  );
  const regionRank = [...regionPeers]
    .sort((a, b) => (b.thrivePctChange ?? -Infinity) - (a.thrivePctChange ?? -Infinity))
    .findIndex((c) => c.iso3 === recovery.iso3);

  const movements = (["live", "thrive", "connect", "feel"] as MetricKey[])
    .map((metric) => {
      const value = recovery[CHANGE_KEY[metric]];
      if (value === null) return null;
      return { metric, value, normalized: value / MAGNITUDE[metric] };
    })
    .filter((entry): entry is { metric: MetricKey; value: number; normalized: number } => entry !== null);

  const mostPositive = movements.length ? movements.reduce((a, b) => (b.normalized > a.normalized ? b : a)) : null;
  const mostNegative = movements.length ? movements.reduce((a, b) => (b.normalized < a.normalized ? b : a)) : null;

  const relevantSourceIds = new Set([recovery.live.sourceId, recovery.thrive.sourceId, recovery.connect.sourceId, recovery.feel.sourceId]);
  const relevantSources = sources.filter((s) => relevantSourceIds.has(s.id));

  return (
    <motion.div key={`${recovery.iso3}-panel`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="country-panel">
      <div className={`path-badge path-${recovery.recoveryPath}`}>
        <i aria-hidden="true" />
        {PATH_LABELS[recovery.recoveryPath]}
      </div>
      <p className="path-badge-note">Based on THRIVE and FEEL only — the narrative below considers all four signals.</p>
      <div className="country-panel-identity">
        <span>{recovery.iso3}</span>
        <div>
          <h3>{recovery.country}</h3>
          <p>
            {shortRegionLabel(recovery.region)} · {recovery.incomeGroup} · viewing {year}
          </p>
        </div>
      </div>

      <div className="recovery-profile-chart-row">
        <RecoveryProfile country={recovery} year={year} />
        <div className="profile-year-rail" role="group" aria-label={`Year for ${recovery.country}'s recovery profile`}>
          <span className="profile-year-bound" aria-hidden="true">{maxYear}</span>
          <input
            id={`profile-year-slider-${recovery.iso3}`}
            type="range"
            className="profile-year-slider"
            min={minYear}
            max={maxYear}
            step={1}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            aria-label="Recovery profile year"
            aria-valuetext={`${year}`}
          />
          <span className="profile-year-bound" aria-hidden="true">{minYear}</span>
          <button
            type="button"
            className="profile-year-play"
            onClick={() => setIsPlaying((playing) => !playing)}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "Pause recovery profile playback" : "Play recovery profile through the years"}
          >
            {isPlaying ? <span aria-hidden="true">❚❚</span> : <span aria-hidden="true">▶</span>}
          </button>
          <output htmlFor={`profile-year-slider-${recovery.iso3}`} className="profile-year-value">
            {year}
          </output>
        </div>
      </div>

      <dl className="country-panel-facts">
        <div>
          <dt>Regional position (THRIVE)</dt>
          <dd>{regionRank >= 0 ? `${regionRank + 1} of ${regionPeers.length} in ${shortRegionLabel(recovery.region)}` : "Not available"}</dd>
        </div>
        <div>
          <dt>Most positive movement</dt>
          <dd>{mostPositive ? `${METRIC_LABELS[mostPositive.metric]} · ${formatSigned(mostPositive.value, mostPositive.metric === "feel" ? 2 : 1)}` : "Not available"}</dd>
        </div>
        <div>
          <dt>Most negative movement</dt>
          <dd>{mostNegative && mostNegative.value < 0 ? `${METRIC_LABELS[mostNegative.metric]} · ${formatSigned(mostNegative.value, mostNegative.metric === "feel" ? 2 : 1)}` : "None — every available signal is at or above baseline"}</dd>
        </div>
      </dl>

      <blockquote>{narrative}</blockquote>

      <div className="country-panel-sources">
        <p className="eyebrow">SOURCES FOR THIS COUNTRY</p>
        <ul>
          {relevantSources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="country-panel-source-def">{METRIC_FULL_LABELS[(Object.keys(CHANGE_KEY) as MetricKey[]).find((m) => recovery[m].sourceId === source.id) ?? "thrive"]}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
