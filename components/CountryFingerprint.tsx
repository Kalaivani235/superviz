"use client";

import { motion } from "framer-motion";
import type { CountryRecovery } from "@/lib/types";
import { directionWord, formatSigned, PATH_LABELS } from "@/lib/formatting";

type Props = { recoveries: CountryRecovery[]; selected: CountryRecovery; onSelect: (iso3: string) => void };

const trackConfig = [
  { key: "liveAbsoluteChange", signal: "LIVE", label: "Life expectancy", max: 2, suffix: " yrs", className: "live" },
  { key: "thrivePctChange", signal: "THRIVE", label: "Real GDP per person", max: 20, suffix: "%", className: "thrive" },
  { key: "connectPointChange", signal: "CONNECT", label: "Internet participation", max: 25, suffix: " pp", className: "connect" },
  { key: "feelAbsoluteChange", signal: "FEEL", label: "Life satisfaction", max: 1, suffix: " pts", className: "feel" },
] as const;

export default function CountryFingerprint({ recoveries, selected, onSelect }: Props) {
  const generatedNarrative = `${selected.country}’s economy is ${directionWord(selected.thrivePctChange)} its 2019 position, while reported life satisfaction is ${directionWord(selected.feelAbsoluteChange)} its pre-COVID level. Life expectancy changed by ${formatSigned(selected.liveAbsoluteChange, 1, " years")}, and internet participation changed by ${formatSigned(selected.connectPointChange, 1, " percentage points")}. Its recovery path is classified as ${PATH_LABELS[selected.recoveryPath]}.`;

  return (
    <div className="fingerprint-panel">
      <div className="fingerprint-head">
        <div>
          <label htmlFor="country-select">Explore a country</label>
          <select id="country-select" value={selected.iso3} onChange={(event) => onSelect(event.target.value)}>
            {[...recoveries].sort((a, b) => a.country.localeCompare(b.country)).map((country) => <option value={country.iso3} key={country.iso3}>{country.country}</option>)}
          </select>
        </div>
        <motion.div key={selected.iso3} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="country-identity">
          <span>{selected.iso3}</span><div><h3>{selected.country}</h3><p>{selected.region} · {selected.incomeGroup}</p></div>
        </motion.div>
      </div>
      <motion.div key={`${selected.iso3}-body`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        <div className={`path-badge path-${selected.recoveryPath}`}><i aria-hidden="true" />{PATH_LABELS[selected.recoveryPath]}</div>
        <div className="recovery-tracks">
          {trackConfig.map((track) => {
            const value = selected[track.key] as number | null;
            const position = value === null ? 50 : 50 + Math.max(-1, Math.min(1, value / track.max)) * 42;
            const indicator = selected[track.className as "live" | "thrive" | "connect" | "feel"];
            return (
              <div className={`recovery-track recovery-track--${track.className}`} key={track.signal}>
                <div className="track-label"><strong>{track.signal}</strong><span>{track.label}</span></div>
                <div className="track-line" aria-label={`${track.signal}: ${formatSigned(value, track.signal === "FEEL" ? 2 : 1, track.suffix)}`}>
                  <i className="baseline" /><span className="baseline-label">2019</span>
                  {value !== null && <b style={{ left: `${position}%` }}><span>{formatSigned(value, track.signal === "FEEL" ? 2 : 1, track.suffix)}</span></b>}
                  {value === null && <em>Not available</em>}
                </div>
                <div className="track-years"><span>{indicator.baselineYear}: {indicator.baselineValue ?? "—"}</span><span>{indicator.latestYear}: {indicator.latestValue ?? "—"}</span></div>
              </div>
            );
          })}
        </div>
        <blockquote>{selected.narrative ?? generatedNarrative}</blockquote>
        <p className="fingerprint-note">Classification uses only THRIVE and FEEL. No weighting or hidden score is applied.</p>
      </motion.div>
    </div>
  );
}
