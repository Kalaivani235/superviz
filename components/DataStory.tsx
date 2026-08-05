"use client";

import { useMemo, useState } from "react";
import type { CountryRecovery } from "@/lib/types";
import { aggregateHeadlineMetrics } from "@/lib/calculations";
import CountryFingerprint from "./CountryFingerprint";
import RecoveryConstellation from "./RecoveryConstellation";
import SectionHeading from "./SectionHeading";
import VitalSigns from "./VitalSigns";

type Props = { recoveries: CountryRecovery[]; dataMode: "demo" | "validated"; validationIssues: number };

export default function DataStory({ recoveries, dataMode, validationIssues }: Props) {
  const defaultCountry = recoveries.find((country) => country.iso3 === "BRA") ?? recoveries[0];
  const [selectedIso3, setSelectedIso3] = useState(defaultCountry.iso3);
  const selected = recoveries.find((country) => country.iso3 === selectedIso3) ?? defaultCountry;
  const metrics = useMemo(() => aggregateHeadlineMetrics(recoveries), [recoveries]);

  return (
    <>
      {dataMode === "demo" && (
        <div className="data-warning section-shell" role="status">
          <strong>Prototype data</strong><span>Replace with validated public-source values before submission.</span>
          <small>{validationIssues === 0 ? "Data contract checks passed" : `${validationIssues} data validation issue${validationIssues === 1 ? "" : "s"}`}</small>
        </div>
      )}
      <VitalSigns metrics={metrics} />
      <section className="constellation section-shell" aria-labelledby="constellation-title">
        <SectionHeading eyebrow="03 · The divergence" title="One shock. Many recoveries." description="Economic recovery did not always bring human recovery with it." />
        <RecoveryConstellation recoveries={recoveries} selectedIso3={selectedIso3} onSelect={setSelectedIso3} />
      </section>
      <section className="fingerprint section-shell" aria-labelledby="fingerprint-title">
        <SectionHeading eyebrow="03B · Look closer" title="One country. Four recoveries." description="Choose a point above—or use the country selector—to see how one recovery separates into four signals." />
        <CountryFingerprint recoveries={recoveries} selected={selected} onSelect={setSelectedIso3} />
      </section>
    </>
  );
}
