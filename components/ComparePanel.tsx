"use client";

import { absoluteChange, percentageChange, pointAsOfYear } from "@/lib/calculations";
import { METRIC_COLORS, METRIC_FULL_LABELS, METRIC_LABELS, METRIC_UNITS_SHORT } from "@/lib/constants";
import { formatSigned, shortRegionLabel } from "@/lib/formatting";
import type { CountryDataset, MetricKey } from "@/lib/types";
import CountrySearch from "./CountrySearch";

const METRICS: MetricKey[] = ["live", "thrive", "connect", "feel"];
const MAGNITUDE: Record<MetricKey, number> = { thrive: 30, live: 3, connect: 30, feel: 1.5 };

type Props = {
  countries: CountryDataset[];
  countryA: CountryDataset | null;
  countryB: CountryDataset | null;
  year: number;
  onSelectA: (iso3: string) => void;
  onSelectB: (iso3: string) => void;
  onSwap: () => void;
  onClear: () => void;
};

function metricChange(country: CountryDataset, metric: MetricKey, year: number) {
  const series = country[metric];
  const point = pointAsOfYear(series, year);
  if (series.baselineValue === null || !point) return null;
  return metric === "thrive" ? percentageChange(series.baselineValue, point.value) : absoluteChange(series.baselineValue, point.value);
}

export default function ComparePanel({ countries, countryA, countryB, year, onSelectA, onSelectB, onSwap, onClear }: Props) {
  return (
    <div className="compare-panel">
      <div className="compare-selectors">
        <div className="compare-selector">
          <span className="compare-slot-label" style={{ color: "var(--recovery-cyan)" }}>
            Country A
          </span>
          {countryA ? (
            <p className="compare-slot-name">
              {countryA.country} <small>{shortRegionLabel(countryA.region)}</small>
            </p>
          ) : (
            <CountrySearch countries={countries} label="Choose Country A" onSelect={onSelectA} compact />
          )}
        </div>
        <div className="compare-actions">
          <button type="button" onClick={onSwap} disabled={!countryA || !countryB} title="Swap countries">
            ⇄ Swap
          </button>
          <button type="button" onClick={onClear} disabled={!countryA && !countryB}>
            Clear
          </button>
        </div>
        <div className="compare-selector">
          <span className="compare-slot-label" style={{ color: "var(--wellbeing-lavender)" }}>
            Country B
          </span>
          {countryB ? (
            <p className="compare-slot-name">
              {countryB.country} <small>{shortRegionLabel(countryB.region)}</small>
            </p>
          ) : (
            <CountrySearch countries={countries} label="Choose Country B" onSelect={onSelectB} compact />
          )}
        </div>
      </div>

      {countryA && countryB ? (
        <div className="compare-grid" role="list" aria-label={`Comparing ${countryA.country} and ${countryB.country}`}>
          {METRICS.map((metric) => {
            const seriesA = countryA[metric];
            const seriesB = countryB[metric];
            const changeA = metricChange(countryA, metric, year);
            const changeB = metricChange(countryB, metric, year);
            const pointA = pointAsOfYear(seriesA, year);
            const pointB = pointAsOfYear(seriesB, year);
            const posA = changeA === null ? null : 50 + Math.max(-1, Math.min(1, changeA / MAGNITUDE[metric])) * 42;
            const posB = changeB === null ? null : 50 + Math.max(-1, Math.min(1, changeB / MAGNITUDE[metric])) * 42;
            const diff = changeA !== null && changeB !== null ? changeA - changeB : null;

            return (
              <article className="compare-row" role="listitem" key={metric} style={{ "--accent": METRIC_COLORS[metric] } as React.CSSProperties}>
                <div className="recovery-profile-label">
                  <strong>{METRIC_LABELS[metric]}</strong>
                  <span>{METRIC_FULL_LABELS[metric]}</span>
                </div>
                <div className="compare-track">
                  <i className="baseline" />
                  {posA !== null && (
                    <b className="compare-dot compare-dot--a" style={{ left: `${posA}%` }} title={`${countryA.country}: ${formatSigned(changeA, metric === "feel" ? 2 : 1, METRIC_UNITS_SHORT[metric])}`} />
                  )}
                  {posB !== null && (
                    <b className="compare-dot compare-dot--b" style={{ left: `${posB}%` }} title={`${countryB.country}: ${formatSigned(changeB, metric === "feel" ? 2 : 1, METRIC_UNITS_SHORT[metric])}`} />
                  )}
                </div>
                <div className="compare-readout">
                  <span className="compare-readout-a">
                    {countryA.country}: {pointA ? pointA.value.toFixed(metric === "feel" ? 2 : 1) : "—"} ({formatSigned(changeA, metric === "feel" ? 2 : 1, METRIC_UNITS_SHORT[metric])})
                  </span>
                  <span className="compare-readout-b">
                    {countryB.country}: {pointB ? pointB.value.toFixed(metric === "feel" ? 2 : 1) : "—"} ({formatSigned(changeB, metric === "feel" ? 2 : 1, METRIC_UNITS_SHORT[metric])})
                  </span>
                  <span className="compare-readout-diff">Difference: {diff === null ? "Not available" : formatSigned(diff, metric === "feel" ? 2 : 1, METRIC_UNITS_SHORT[metric])}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="compare-empty">Choose two countries to compare their recovery on all four dimensions since {countryA?.thrive.baselineYear ?? 2019}.</p>
      )}
    </div>
  );
}
