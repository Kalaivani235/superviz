import { absoluteChange, percentageChange, pointAsOfYear } from "@/lib/calculations";
import { METRIC_COLORS, METRIC_FULL_LABELS, METRIC_LABELS, METRIC_UNITS_SHORT } from "@/lib/constants";
import { formatSigned } from "@/lib/formatting";
import type { CountryDataset, MetricKey } from "@/lib/types";

const METRICS: MetricKey[] = ["live", "thrive", "connect", "feel"];

type Props = {
  country: CountryDataset;
  year: number;
};

export default function RecoveryProfile({ country, year }: Props) {
  return (
    <div className="recovery-profile" role="list" aria-label="Four-dimension recovery profile">
      {METRICS.map((metric) => {
        const series = country[metric];
        const asOfPoint = pointAsOfYear(series, year);
        const change =
          series.baselineValue !== null && asOfPoint
            ? metric === "thrive"
              ? percentageChange(series.baselineValue, asOfPoint.value)
              : absoluteChange(series.baselineValue, asOfPoint.value)
            : null;
        const suffix = METRIC_UNITS_SHORT[metric];
        const magnitude = metric === "thrive" ? 30 : metric === "live" ? 3 : metric === "connect" ? 30 : 1.5;
        const position = change === null ? 50 : 50 + Math.max(-1, Math.min(1, change / magnitude)) * 42;

        return (
          <article
            className="recovery-profile-row"
            role="listitem"
            key={metric}
            style={{ "--accent": METRIC_COLORS[metric] } as React.CSSProperties}
          >
            <div className="recovery-profile-label">
              <strong>{METRIC_LABELS[metric]}</strong>
              <span>{METRIC_FULL_LABELS[metric]}</span>
            </div>
            <div
              className="recovery-profile-track"
              aria-label={`${METRIC_LABELS[metric]}: ${series.baselineValue === null ? "no baseline" : `baseline ${series.baselineValue}`}, as of ${year}: ${asOfPoint ? asOfPoint.value : "not available"}, change ${formatSigned(change, metric === "feel" ? 2 : 1, suffix)}`}
            >
              <i className="baseline" />
              <span className="baseline-label">{series.baselineYear}</span>
              {change !== null ? (
                <b style={{ left: `${position}%` }}>
                  <span>{formatSigned(change, metric === "feel" ? 2 : 1, suffix)}</span>
                </b>
              ) : (
                <em>Not available</em>
              )}
            </div>
            <div className="recovery-profile-years">
              <span>
                {series.baselineYear}: {series.baselineValue === null ? "—" : series.baselineValue.toFixed(metric === "feel" ? 2 : 1)}
              </span>
              <span>
                {asOfPoint ? asOfPoint.year : year}
                {asOfPoint && !asOfPoint.isExact ? " (carried forward)" : ""}: {asOfPoint ? asOfPoint.value.toFixed(metric === "feel" ? 2 : 1) : "—"}
              </span>
            </div>
            <p className="recovery-profile-source">{series.unit} · source: {series.sourceId}</p>
          </article>
        );
      })}
    </div>
  );
}
