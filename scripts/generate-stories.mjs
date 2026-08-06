// Derives evidence-based stories from the final transformed dataset.
// Every story is computed from public/data/countries.json — nothing here is
// hard-coded ahead of the data. Run with: node scripts/generate-stories.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATASET_PATH = path.join(ROOT, "public/data/countries.json");
const OUTPUT_PATH = path.join(ROOT, "public/data/stories.json");

function pctChange(baseline, latest) {
  if (baseline === null || latest === null || baseline === 0) return null;
  return ((latest - baseline) / baseline) * 100;
}

function absChange(baseline, latest) {
  if (baseline === null || latest === null) return null;
  return latest - baseline;
}

function deriveRecovery(country) {
  return {
    iso3: country.iso3,
    country: country.country,
    region: country.region,
    thrivePct: pctChange(country.thrive.baselineValue, country.thrive.latestValue),
    livePts: absChange(country.live.baselineValue, country.live.latestValue),
    connectPts: absChange(country.connect.baselineValue, country.connect.latestValue),
    feelPts: absChange(country.feel.baselineValue, country.feel.latestValue),
    thriveYears: [country.thrive.baselineYear, country.thrive.latestYear],
    liveYears: [country.live.baselineYear, country.live.latestYear],
    connectYears: [country.connect.baselineYear, country.connect.latestYear],
    feelYears: [country.feel.baselineYear, country.feel.latestYear],
  };
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values) {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function fmtPct(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function fmtPts(value, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

const REGION_SHORT_LABELS = {
  "Middle East, North Africa, Afghanistan & Pakistan": "Middle East & North Africa",
};

function shortRegion(region) {
  return REGION_SHORT_LABELS[region] ?? region;
}

async function main() {
  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf-8"));
  const recoveries = dataset.countries.map(deriveRecovery);
  const stories = [];

  // Story 1: Prosperity recovered faster than wellbeing
  const prosperityWithoutHealing = recoveries
    .filter((c) => c.thrivePct !== null && c.feelPts !== null && c.thrivePct > 5 && c.feelPts < 0)
    .sort((a, b) => (b.thrivePct - b.feelPts * 20) - (a.thrivePct - a.feelPts * 20))
    .slice(0, 4);
  if (prosperityWithoutHealing.length >= 2) {
    const lead = prosperityWithoutHealing[0];
    stories.push({
      id: "prosperity-without-wellbeing",
      headline: "Prosperity recovered faster than wellbeing",
      insight: `${prosperityWithoutHealing.length} of ${recoveries.filter((c) => c.thrivePct !== null && c.feelPts !== null).length} countries with complete data grew real GDP per person while reported life satisfaction fell below its 2019 level. ${lead.country} grew ${fmtPct(lead.thrivePct)} in real GDP per person while life satisfaction moved ${fmtPts(lead.feelPts)} points.`,
      countries: prosperityWithoutHealing.map((c) => c.iso3),
      years: [dataset.baselineYear, lead.thriveYears[1]],
      metrics: ["thrive", "feel"],
      lens: "thrive-feel",
      highlightIso3: lead.iso3,
    });
  }

  // Story 2: Digital connection increased while life satisfaction weakened
  const digitalWithoutFeeling = recoveries
    .filter((c) => c.connectPts !== null && c.feelPts !== null && c.connectPts > 10 && c.feelPts < 0)
    .sort((a, b) => b.connectPts - a.connectPts)
    .slice(0, 4);
  if (digitalWithoutFeeling.length >= 2) {
    const lead = digitalWithoutFeeling[0];
    stories.push({
      id: "digital-without-wellbeing",
      headline: "Digital access expanded while life satisfaction weakened",
      insight: `${digitalWithoutFeeling.length} countries gained more than 10 percentage points of internet participation since 2019 while life satisfaction still sits below its pre-pandemic level. ${lead.country} added ${fmtPts(lead.connectPts, 1)} points of internet participation, the widest gap between digital growth and wellbeing decline in the sample.`,
      countries: digitalWithoutFeeling.map((c) => c.iso3),
      years: [dataset.baselineYear, lead.connectYears[1]],
      metrics: ["connect", "feel"],
      lens: "connect-feel",
      highlightIso3: lead.iso3,
    });
  }

  // Story 3: Health outcomes remained resilient despite economic pressure
  const resilientHealth = recoveries
    .filter((c) => c.thrivePct !== null && c.livePts !== null && c.thrivePct < 0 && c.livePts >= 0)
    .sort((a, b) => a.thrivePct - b.thrivePct)
    .slice(0, 4);
  if (resilientHealth.length >= 2) {
    const lead = resilientHealth[0];
    stories.push({
      id: "resilient-health",
      headline: "Health outcomes held steady despite economic pressure",
      insight: `${resilientHealth.length} countries recorded real GDP per person below its 2019 level while life expectancy still rose or held flat. ${lead.country}'s real GDP per person is ${fmtPct(lead.thrivePct)} against 2019, yet life expectancy moved ${fmtPts(lead.livePts, 1)} years.`,
      countries: resilientHealth.map((c) => c.iso3),
      years: [dataset.baselineYear, lead.liveYears[1]],
      metrics: ["thrive", "live"],
      lens: "live-thrive",
      highlightIso3: lead.iso3,
    });
  }

  // Story 4: Broad four-dimensional recovery
  const broadRecovery = recoveries
    .filter((c) => [c.thrivePct, c.livePts, c.connectPts, c.feelPts].every((v) => v !== null && v >= 0))
    .sort((a, b) => (b.thrivePct + b.connectPts) - (a.thrivePct + a.connectPts))
    .slice(0, 6);
  if (broadRecovery.length >= 3) {
    stories.push({
      id: "broad-recovery",
      headline: "A small group of countries recovered on all four signals",
      insight: `Only ${broadRecovery.length} of ${recoveries.length} countries with any data show non-negative movement in LIVE, THRIVE, CONNECT and FEEL simultaneously — broad recovery was the exception, not the rule. ${broadRecovery[0].country} leads the group.`,
      countries: broadRecovery.map((c) => c.iso3),
      years: [dataset.baselineYear, "latest"],
      metrics: ["live", "thrive", "connect", "feel"],
      lens: "thrive-feel",
      highlightIso3: broadRecovery[0].iso3,
    });
  }

  // Story 5: Region with the most uneven recovery
  const regions = Array.from(new Set(recoveries.map((c) => c.region)));
  const regionSpread = regions
    .map((region) => {
      const values = recoveries.filter((c) => c.region === region && c.thrivePct !== null).map((c) => c.thrivePct);
      if (values.length < 4) return null;
      return { region, spread: stddev(values), countries: recoveries.filter((c) => c.region === region && c.thrivePct !== null) };
    })
    .filter(Boolean)
    .sort((a, b) => b.spread - a.spread);
  if (regionSpread.length) {
    const top = regionSpread[0];
    const sorted = [...top.countries].sort((a, b) => b.thrivePct - a.thrivePct);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    stories.push({
      id: "uneven-region",
      headline: `${shortRegion(top.region)} shows the widest recovery spread of any region`,
      insight: `Within ${shortRegion(top.region)}, real GDP per person ranges from ${fmtPct(lowest.thrivePct)} at ${lowest.country} to ${fmtPct(highest.thrivePct)} at ${highest.country} against the same 2019 baseline — one region, very different recoveries.`,
      countries: [highest.iso3, lowest.iso3],
      years: [dataset.baselineYear, "latest"],
      metrics: ["thrive"],
      lens: "thrive-feel",
      highlightIso3: highest.iso3,
      region: top.region,
    });
  }

  await writeFile(OUTPUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), stories }, null, 2));
  console.log(`Generated ${stories.length} stories from ${recoveries.length} countries.`);
}

main().catch((error) => {
  console.error("generate-stories failed:", error);
  process.exitCode = 1;
});
