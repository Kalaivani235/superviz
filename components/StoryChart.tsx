import { METRIC_CHANGE_KEY, METRIC_COLORS, METRIC_LABELS, METRIC_MAGNITUDE, METRIC_UNITS_SHORT } from "@/lib/constants";
import { formatSigned } from "@/lib/formatting";
import type { CountryRecovery, Story } from "@/lib/types";

type Props = {
  story: Story;
  recoveries: CountryRecovery[];
};

const MAX_COUNTRIES = 4;

/**
 * A standalone diverging bar chart built for this specific story — every
 * country the story names, one bar per metric the story is about, reading
 * the same computed change values as the rest of the app. Deliberately not
 * wired to the Recovery Orbit or any shared selection state: it exists to
 * make the story's finding legible on its own, inside the card.
 */
export default function StoryChart({ story, recoveries }: Props) {
  const allCountries = story.countries
    .map((iso3) => recoveries.find((r) => r.iso3 === iso3))
    .filter((r): r is CountryRecovery => r !== undefined);
  const shown = allCountries.slice(0, MAX_COUNTRIES);
  const remaining = allCountries.length - shown.length;

  if (!shown.length) return null;

  return (
    <div className="story-chart">
      <p className="story-chart-label">{story.metrics.map((m) => METRIC_LABELS[m]).join(" vs. ")} · change since {story.years[0]}</p>
      {shown.map((country) => (
        <div className="story-chart-country" key={country.iso3}>
          <p className="story-chart-country-name">
            {country.country}
            {country.iso3 === story.highlightIso3 && <span className="story-chart-featured">featured</span>}
          </p>
          {story.metrics.map((metric) => {
            const raw = country[METRIC_CHANGE_KEY[metric]];
            if (raw === null) return null;
            const magnitude = Math.min(50, Math.abs(raw / METRIC_MAGNITUDE[metric]) * 50);
            const isNegative = raw < 0;
            return (
              <div className="story-chart-row" key={metric} style={{ "--accent": METRIC_COLORS[metric] } as React.CSSProperties}>
                <span className="story-chart-metric-tag">{METRIC_LABELS[metric]}</span>
                <div className="story-chart-bar-track">
                  <i className="story-chart-zero" aria-hidden="true" />
                  <div
                    className={`story-chart-bar${isNegative ? " is-negative" : ""}`}
                    style={isNegative ? { right: "50%", width: `${magnitude}%` } : { left: "50%", width: `${magnitude}%` }}
                  />
                </div>
                <span className="story-chart-value">{formatSigned(raw, metric === "feel" ? 2 : 1, METRIC_UNITS_SHORT[metric])}</span>
              </div>
            );
          })}
        </div>
      ))}
      {remaining > 0 && <p className="story-chart-more">+{remaining} more {remaining === 1 ? "country" : "countries"} show this same pattern</p>}
    </div>
  );
}
