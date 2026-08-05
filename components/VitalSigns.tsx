import type { HeadlineMetrics } from "@/lib/types";
import { formatSigned } from "@/lib/formatting";
import SectionHeading from "./SectionHeading";

type Props = { metrics: HeadlineMetrics };

const cards = (metrics: HeadlineMetrics) => [
  {
    signal: "LIVE",
    index: "01",
    value: formatSigned(metrics.averageLiveChange, 1, " yrs"),
    label: "Average change in life expectancy since 2019",
    interpretation: "A physical recovery signal, measured in years of life expectancy.",
    meta: "2019 → latest available",
    className: "live",
    direction: metrics.averageLiveChange,
  },
  {
    signal: "THRIVE",
    index: "02",
    value: `${metrics.thriveRecoveredCount}/${metrics.thriveCountryCount}`,
    label: "Countries above their 2019 real GDP-per-person level",
    interpretation: "Prosperity may return even when other parts of life do not.",
    meta: "constant-price GDP · pilot sample",
    className: "thrive",
    direction: metrics.thriveRecoveredCount - metrics.thriveCountryCount / 2,
  },
  {
    signal: "CONNECT",
    index: "03",
    value: formatSigned(metrics.averageConnectChange, 1, " pp"),
    label: "Average change in internet participation since 2019",
    interpretation: "Digital connection expanded, but access is not the same as belonging.",
    meta: "percentage-point change",
    className: "connect",
    direction: metrics.averageConnectChange,
  },
  {
    signal: "FEEL",
    index: "04",
    value: formatSigned(metrics.averageFeelChange, 2, " pts"),
    label: "Average change in reported life satisfaction",
    interpretation: "An emotional signal that can move differently from the economy.",
    meta: "pre-COVID avg → post-COVID avg",
    className: "feel",
    direction: metrics.averageFeelChange,
  },
];

export default function VitalSigns({ metrics }: Props) {
  return (
    <section className="vital-signs section-shell" aria-labelledby="vital-title">
      <SectionHeading eyebrow="02 · Four signals" title="A recovery can look complete—and still feel unfinished." description="No composite score. Four distinct measures, each allowed to tell its own story." />
      <div className="vital-grid">
        {cards(metrics).map((card) => (
          <article className={`vital-card vital-card--${card.className}`} key={card.signal}>
            <div className="vital-card-top"><span>{card.index}</span><strong>{card.signal}</strong></div>
            <p className="vital-value">{card.value}</p>
            <h3>{card.label}</h3>
            <div className="spark" aria-hidden="true"><i /><b style={{ left: `${50 + Math.max(-38, Math.min(38, (card.direction ?? 0) * 3))}%` }} /></div>
            <p>{card.interpretation}</p>
            <small>{card.meta}</small>
          </article>
        ))}
      </div>
      <p className="sample-note">Calculated from available records in the {metrics.thriveCountryCount}-country pilot sample. Demonstration values are not factual findings.</p>
    </section>
  );
}
