// Derives deterministic prediction questions for the Atlas Guide companion
// from the final transformed dataset. Every question, option, and rationale
// is computed from real values — nothing here is hard-coded ahead of the
// data, and no question is emitted when the underlying data is incomplete
// or ambiguous. Run with: node scripts/generate-companion-questions.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATASET_PATH = path.join(ROOT, "public/data/countries.json");
const OUTPUT_PATH = path.join(ROOT, "public/data/companion-questions.json");

const METRIC_LABELS = { live: "LIVE", thrive: "THRIVE", connect: "CONNECT", feel: "FEEL" };
const METRIC_MAGNITUDE = { thrive: 30, live: 3, connect: 30, feel: 1.5 };
const METRIC_UNITS = { live: " yrs", thrive: "%", connect: " pp", feel: " pts" };
const REGION_SHORT = { "Middle East, North Africa, Afghanistan & Pakistan": "Middle East & North Africa" };
const shortRegion = (r) => REGION_SHORT[r] ?? r;

function pctChange(baseline, latest) {
  if (baseline === null || latest === null || baseline === 0) return null;
  return ((latest - baseline) / baseline) * 100;
}

function absChange(baseline, latest) {
  if (baseline === null || latest === null) return null;
  return latest - baseline;
}

function classifyPath(thriveChange, feelChange) {
  if (thriveChange === null || feelChange === null) return "insufficient-data";
  if (thriveChange >= 0 && feelChange >= 0) return "recovered-together";
  if (thriveChange >= 0 && feelChange < 0) return "prosperity-without-healing";
  if (thriveChange < 0 && feelChange >= 0) return "resilient-lives";
  return "still-recovering";
}

function fmtSigned(value, digits = 1, suffix = "") {
  if (value === null || !Number.isFinite(value)) return "not available";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}${suffix}`;
}

function deriveRecovery(country) {
  const thrivePct = pctChange(country.thrive.baselineValue, country.thrive.latestValue);
  const livePts = absChange(country.live.baselineValue, country.live.latestValue);
  const connectPts = absChange(country.connect.baselineValue, country.connect.latestValue);
  const feelPts = absChange(country.feel.baselineValue, country.feel.latestValue);
  return {
    iso3: country.iso3,
    country: country.country,
    region: country.region,
    population: country.population,
    baselineYear: country.thrive.baselineYear,
    latestYear: country.thrive.latestYear,
    thrivePct,
    livePts,
    connectPts,
    feelPts,
    recoveryPath: classifyPath(thrivePct, feelPts),
  };
}

let questionSeq = 0;
function nextId(prefix) {
  questionSeq += 1;
  return `${prefix}-${questionSeq}`;
}

function shuffleOptions(options, correctId, seedIndex) {
  // Deterministic "shuffle" (no Math.random — build output must be
  // reproducible) using a simple rotation keyed off the question index.
  const rotated = [...options.slice(seedIndex % options.length), ...options.slice(0, seedIndex % options.length)];
  return rotated;
}

// ---------------------------------------------------------------------------
// Type A — country choice
// ---------------------------------------------------------------------------
function buildCountryChoiceQuestions(recoveries) {
  const withPath = recoveries.filter((r) => r.recoveryPath !== "insufficient-data");
  const candidates = withPath
    .filter((r) => r.recoveryPath === "prosperity-without-healing")
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .slice(0, 4);

  const distractorPool = withPath
    .filter((r) => r.recoveryPath !== "prosperity-without-healing")
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

  const questions = [];
  candidates.forEach((correct, idx) => {
    const distractors = distractorPool
      .filter((r) => r.region !== correct.region || idx % 2 === 0)
      .slice(idx * 2, idx * 2 + 2);
    if (distractors.length < 2) return;

    const options = shuffleOptions(
      [correct, ...distractors].map((r) => ({ id: r.iso3, label: r.country })),
      correct.iso3,
      idx,
    );

    questions.push({
      id: nextId("country"),
      type: "country-choice",
      question: "Which country recovered economically but remained below its wellbeing baseline?",
      options,
      correctOptionId: correct.iso3,
      rationale: `${correct.country}'s real GDP per person moved ${fmtSigned(correct.thrivePct, 1, "%")} against its ${correct.baselineYear} baseline, while reported life satisfaction moved ${fmtSigned(correct.feelPts, 2)} points over the same period.`,
      command: {
        type: "SET_VIEW",
        lens: "thrive-feel",
        region: "All regions",
        selectedIso3: correct.iso3,
        spotlightIso3s: [correct.iso3],
      },
      highlightIso3s: [correct.iso3],
      sourceMetrics: ["thrive", "feel"],
      years: [correct.baselineYear, correct.latestYear],
    });
  });
  return questions;
}

// ---------------------------------------------------------------------------
// Type B — region choice
// ---------------------------------------------------------------------------
function buildRegionChoiceQuestions(recoveries) {
  const withPath = recoveries.filter((r) => r.recoveryPath !== "insufficient-data");
  const regions = Array.from(new Set(withPath.map((r) => r.region)));
  const patterns = [
    ["prosperity-without-healing", "the “Prosperity Without Healing” quadrant"],
    ["recovered-together", "the “Recovered Together” quadrant"],
    ["resilient-lives", "the “Resilient Lives” quadrant"],
    ["still-recovering", "the “Still Recovering” quadrant"],
  ];

  const questions = [];
  patterns.forEach(([path, phraseLabel], idx) => {
    const counts = regions
      .map((region) => ({
        region,
        count: withPath.filter((r) => r.region === region && r.recoveryPath === path).length,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);

    if (counts.length < 3) return;
    if (counts[0].count === counts[1].count) return; // tie — ambiguous, skip

    const correct = counts[0];
    const others = counts.slice(1, 3);

    const options = shuffleOptions(
      [correct, ...others].map((entry) => ({ id: entry.region, label: shortRegion(entry.region) })),
      correct.region,
      idx,
    );

    questions.push({
      id: nextId("region"),
      type: "region-choice",
      question: `Which region contains more countries in ${phraseLabel}?`,
      options,
      correctOptionId: correct.region,
      rationale: `${shortRegion(correct.region)} has ${correct.count} countries with complete data in ${phraseLabel}, more than any other region compared here.`,
      command: {
        type: "SET_VIEW",
        lens: "thrive-feel",
        region: correct.region,
      },
      highlightIso3s: withPath.filter((r) => r.region === correct.region && r.recoveryPath === path).map((r) => r.iso3),
      sourceMetrics: ["thrive", "feel"],
      years: [],
    });
  });
  return questions;
}

// ---------------------------------------------------------------------------
// Type C — signal choice
// ---------------------------------------------------------------------------
function buildSignalChoiceQuestions(recoveries) {
  const questions = [];
  const withEnoughSignals = recoveries
    .map((r) => {
      const signals = [
        { metric: "live", value: r.livePts },
        { metric: "thrive", value: r.thrivePct },
        { metric: "connect", value: r.connectPts },
        { metric: "feel", value: r.feelPts },
      ].filter((s) => s.value !== null);
      return { ...r, signals };
    })
    .filter((r) => r.signals.length >= 3);

  const scored = withEnoughSignals
    .map((r) => {
      const normalized = r.signals.map((s) => ({ ...s, normalized: s.value / METRIC_MAGNITUDE[s.metric] }));
      const sorted = [...normalized].sort((a, b) => b.normalized - a.normalized);
      const top = sorted[0];
      const second = sorted[1];
      const gap = top.normalized - second.normalized;
      return { r, top, gap };
    })
    .filter((entry) => entry.gap > 0.15) // require a clear, unambiguous winner
    .sort((a, b) => (b.r.population ?? 0) - (a.r.population ?? 0))
    .slice(0, 6);

  scored.forEach(({ r, top }, idx) => {
    const options = shuffleOptions(
      Object.entries(METRIC_LABELS).map(([id, label]) => ({ id, label })),
      top.metric,
      idx,
    );
    questions.push({
      id: nextId("signal"),
      type: "signal-choice",
      question: `For ${r.country}, which signal recovered most strongly since ${r.baselineYear}?`,
      options,
      correctOptionId: top.metric,
      rationale: `${r.country}'s ${METRIC_LABELS[top.metric]} signal moved ${fmtSigned(top.value, top.metric === "feel" ? 2 : 1, METRIC_UNITS[top.metric])} — the largest relative change among its available signals.`,
      command: {
        type: "SET_VIEW",
        lens: top.metric === "connect" ? "connect-feel" : top.metric === "live" ? "live-thrive" : "thrive-feel",
        region: "All regions",
        selectedIso3: r.iso3,
        spotlightIso3s: [r.iso3],
      },
      highlightIso3s: [r.iso3],
      sourceMetrics: r.signals.map((s) => s.metric),
      years: [r.baselineYear, r.latestYear],
    });
  });
  return questions;
}

async function main() {
  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf-8"));
  const recoveries = dataset.countries.map(deriveRecovery);

  const questions = [
    ...buildCountryChoiceQuestions(recoveries),
    ...buildRegionChoiceQuestions(recoveries),
    ...buildSignalChoiceQuestions(recoveries),
  ];

  await writeFile(OUTPUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), questions }, null, 2));
  console.log(`Generated ${questions.length} prediction questions from ${recoveries.length} countries.`);
  console.log(`  country-choice: ${questions.filter((q) => q.type === "country-choice").length}`);
  console.log(`  region-choice: ${questions.filter((q) => q.type === "region-choice").length}`);
  console.log(`  signal-choice: ${questions.filter((q) => q.type === "signal-choice").length}`);
}

main().catch((error) => {
  console.error("generate-companion-questions failed:", error);
  process.exitCode = 1;
});
