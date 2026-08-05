import type { DataSource } from "@/lib/types";
import SectionHeading from "./SectionHeading";

type Props = { sources: DataSource[]; mode: "demo" | "validated"; refreshDate: string };

export default function Methodology({ sources, mode, refreshDate }: Props) {
  return (
    <section className="methodology section-shell" aria-labelledby="methodology-title">
      <SectionHeading eyebrow="05 · Read the fine print" title="Methodology, in the open" description="A recovery story is only as credible as the choices beneath it." />
      {mode === "demo" && <div className="data-warning data-warning--method"><strong>Prototype data</strong><span>Replace with validated public-source values before submission.</span></div>}
      <div className="method-grid">
        <div className="method-copy">
          <details open><summary>Why 2019?</summary><p>2019 is the last full pre-pandemic year and acts as the baseline for life expectancy, real GDP per person and internet use. It is a reference point—not a claim that 2019 was ideal.</p></details>
          <details><summary>How are years aligned?</summary><p>Each indicator uses its latest credible available year, displayed wherever values appear. Life satisfaction compares a 2017–2019 pre-COVID average with a 2022–latest post-COVID average in the validated dataset.</p></details>
          <details><summary>How is missing data handled?</summary><p>Missing values remain missing. Countries without both GDP and life-satisfaction values are excluded from the constellation but remain available in the fingerprint where other signals exist.</p></details>
          <details><summary>What does GenAI contribute?</summary><p>GenAI was used to support code generation, data-cleaning logic, interface development, and narrative drafting. All calculations and displayed factual statements must be validated against the cited public data.</p></details>
        </div>
        <aside className="formula-panel" aria-label="Calculation formulas">
          <p className="eyebrow">THE FOUR CALCULATIONS</p>
          <dl>
            <div><dt>THRIVE</dt><dd>((latest − 2019) ÷ 2019) × 100</dd></div>
            <div><dt>LIVE</dt><dd>latest − 2019, in years</dd></div>
            <div><dt>CONNECT</dt><dd>latest − 2019, in percentage points</dd></div>
            <div><dt>FEEL</dt><dd>post-COVID average − pre-COVID average</dd></div>
          </dl>
          <p className="method-date">Data configuration refreshed <time dateTime={refreshDate}>{refreshDate}</time></p>
        </aside>
      </div>
      <div className="source-list">
        <p className="eyebrow">PUBLIC SOURCE FAMILIES</p>
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
            <span>{source.name}</span><b aria-hidden="true">↗</b><span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
      </div>
      <p className="prototype-limit"><strong>Prototype limitation.</strong> Current values are designed to exercise the interface and calculation logic. They are not evidence and must not be quoted as findings.</p>
    </section>
  );
}
