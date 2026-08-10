import type { CoverageReport, DatasetMetadata, MetricKey } from "@/lib/types";
import SectionHeading from "./SectionHeading";

type Props = {
  metadata: DatasetMetadata;
  coverage: CoverageReport;
};

const INDICATOR_ORDER: MetricKey[] = ["live", "thrive", "connect", "feel"];
const INDICATOR_LABEL: Record<MetricKey, string> = { live: "LIVE", thrive: "THRIVE", connect: "CONNECT", feel: "FEEL" };

export default function Methodology({ metadata, coverage }: Props) {
  return (
    <section id="methodology" className="methodology section-shell" aria-labelledby="methodology-title">
      <SectionHeading
        eyebrow="Methodology"
        title="How this atlas is built"
        description="A recovery story is only as credible as the choices beneath it — every value here traces back to a public source."
      />
      <div className="method-grid">
        <div className="method-copy">
          <details open>
            <summary>Why {metadata.baselineYear}?</summary>
            <p>{metadata.baselineNote}</p>
          </details>
          <details>
            <summary>Which countries are included?</summary>
            <p>{metadata.coverageScopeNote}</p>
          </details>
          <details>
            <summary>How are GenAI tools used here?</summary>
            <p>
              This site was built with substantial help from Claude, Anthropic&apos;s AI coding assistant — drafting and
              refactoring the Next.js/React/TypeScript codebase, the World Bank and World Happiness Report data
              pipeline, the CSS design system, the Recovery Orbit visualization, and the Atlas Guide companion. Every
              change was reviewed, tested, and directed by a human before it shipped.
            </p>
            <p>
              That is separate from what happens when you use the site. No runtime AI call ever generates or alters a
              number, a narrative sentence, or an Atlas discovery — every value on screen is computed by deterministic
              rules evaluated against the published data, so the same inputs always produce the same output.
            </p>
          </details>
          <details>
            <summary>How is missing data handled?</summary>
            <p>{metadata.missingDataNote}</p>
          </details>
        </div>
        <aside className="formula-panel" aria-label="Calculation formulas">
          <p className="eyebrow">THE FOUR CALCULATIONS</p>
          <dl>
            <div>
              <dt>THRIVE</dt>
              <dd>((latest − {metadata.baselineYear}) ÷ {metadata.baselineYear}) × 100</dd>
            </div>
            <div>
              <dt>LIVE</dt>
              <dd>latest − {metadata.baselineYear}, in years</dd>
            </div>
            <div>
              <dt>CONNECT</dt>
              <dd>latest − {metadata.baselineYear}, in percentage points</dd>
            </div>
            <div>
              <dt>FEEL</dt>
              <dd>post-2022 average − 2017–2019 average</dd>
            </div>
          </dl>
          <p className="method-date">Dataset last refreshed <time dateTime={metadata.generatedAt}>{metadata.generatedAt.slice(0, 10)}</time></p>
        </aside>
      </div>

      <div className="coverage-panel">
        <p className="eyebrow">DATASET COVERAGE</p>
        <div className="coverage-grid">
          <div className="coverage-stat">
            <strong>{coverage.totalCountries}</strong>
            <span>economies with at least one indicator</span>
          </div>
          <div className="coverage-stat">
            <strong>{coverage.fullyCoveredCountries}</strong>
            <span>with all four dimensions complete</span>
          </div>
          <div className="coverage-stat">
            <strong>{coverage.regions.length}</strong>
            <span>World Bank regions represented</span>
          </div>
        </div>
        <table className="coverage-table">
          <caption className="sr-only">Coverage by indicator</caption>
          <thead>
            <tr>
              <th scope="col">Indicator</th>
              <th scope="col">Countries with baseline</th>
              <th scope="col">Countries with latest</th>
              <th scope="col">Observed years</th>
            </tr>
          </thead>
          <tbody>
            {INDICATOR_ORDER.map((key) => {
              const stat = coverage.byIndicator[key];
              return (
                <tr key={key}>
                  <th scope="row">{INDICATOR_LABEL[key]}</th>
                  <td>{stat.countriesWithBaseline}</td>
                  <td>{stat.countriesWithLatest}</td>
                  <td>{stat.earliestYear}–{stat.latestYear}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="source-list">
        <p className="eyebrow">PUBLIC SOURCES</p>
        {metadata.sources.map((source) => (
          <div className="source-entry" key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer">
              <span>{source.name}</span>
              <b aria-hidden="true">↗</b>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p>{source.definition}</p>
            <small>
              {source.unit} · {source.license} · indicator {source.indicatorCode}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
