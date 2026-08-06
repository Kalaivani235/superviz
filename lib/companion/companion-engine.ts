import { METRIC_CHANGE_KEY, METRIC_FULL_LABELS, METRIC_MAGNITUDE } from "@/lib/constants";
import { formatSigned, shortRegionLabel } from "@/lib/formatting";
import type { CompanionContext, CompanionPrompt, PredictionAnswerResult } from "./types";
import type { CountryRecovery, MetricKey } from "@/lib/types";

// ---------------------------------------------------------------------------
// Deterministic phrasing rules. No runtime model call anywhere in this file.
// Every sentence is assembled from already-computed values using templates
// that avoid causal language ("because", "caused", "led to", "proved") in
// favor of descriptive language ("moved differently", "did not recover at
// the same pace", "shows a contrast", "above/below its baseline").
// ---------------------------------------------------------------------------

const ALL_METRICS: MetricKey[] = ["live", "thrive", "connect", "feel"];

/** Lowercases only the leading word for mid-sentence use, preserving
 * embedded acronyms like "GDP" (a blanket .toLowerCase() would mangle
 * "Real GDP per person" into "real gdp per person"). */
function midSentence(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

function normalizedChange(recovery: CountryRecovery, metric: MetricKey): number | null {
  const value = recovery[METRIC_CHANGE_KEY[metric]];
  if (value === null) return null;
  return value / METRIC_MAGNITUDE[metric];
}

/** One-sentence, companion-voiced observation about a single country's
 * four signals — shorter and more conversational than the Country Panel's
 * full narrative, but grounded in the same computed values. */
export function getSelectedCountryInsight(recovery: CountryRecovery): string {
  const signed = ALL_METRICS.map((metric) => ({
    metric,
    normalized: normalizedChange(recovery, metric),
    raw: recovery[METRIC_CHANGE_KEY[metric]],
  })).filter((entry): entry is { metric: MetricKey; normalized: number; raw: number } => entry.normalized !== null);

  if (signed.length === 0) {
    return `${recovery.country} doesn't have enough comparable data yet to describe a pattern with confidence.`;
  }

  const strongestPositive = signed.filter((e) => e.normalized > 0).sort((a, b) => b.normalized - a.normalized)[0];
  const strongestNegative = signed.filter((e) => e.normalized < 0).sort((a, b) => a.normalized - b.normalized)[0];

  if (strongestPositive && strongestNegative) {
    return `${recovery.country}'s ${midSentence(METRIC_FULL_LABELS[strongestPositive.metric])} improved strongly since ${recovery.thrive.baselineYear} (${formatSigned(strongestPositive.raw, strongestPositive.metric === "feel" ? 2 : 1)}), while its ${midSentence(METRIC_FULL_LABELS[strongestNegative.metric])} signal followed a different path (${formatSigned(strongestNegative.raw, strongestNegative.metric === "feel" ? 2 : 1)}).`;
  }
  if (strongestPositive && !strongestNegative) {
    return `${recovery.country} shows every available signal at or above its ${recovery.thrive.baselineYear} level — a broad recovery across the dimensions measured here.`;
  }
  if (strongestNegative && !strongestPositive) {
    return `${recovery.country}'s available signals sit below their ${recovery.thrive.baselineYear} levels — recovery here did not reach its pre-pandemic starting point on the measures shown.`;
  }
  return `${recovery.country}'s signals moved only slightly from their ${recovery.thrive.baselineYear} levels.`;
}

/** One-sentence observation about a region's mix of recovery patterns. */
export function getRegionalInsight(region: string, recoveries: CountryRecovery[]): string {
  const regional = recoveries.filter((r) => r.region === region);
  const withPath = regional.filter((r) => r.recoveryPath !== "insufficient-data");
  if (withPath.length === 0) {
    return `${shortRegionLabel(region)} doesn't have enough complete data to describe a regional pattern yet.`;
  }
  const prosperityWithoutHealing = withPath.filter((r) => r.recoveryPath === "prosperity-without-healing").length;
  const recoveredTogether = withPath.filter((r) => r.recoveryPath === "recovered-together").length;

  if (prosperityWithoutHealing >= recoveredTogether && prosperityWithoutHealing > 0) {
    return `In ${shortRegionLabel(region)}, ${prosperityWithoutHealing} of ${withPath.length} countries show prosperity recovering without wellbeing catching up at the same pace.`;
  }
  if (recoveredTogether > 0) {
    return `In ${shortRegionLabel(region)}, ${recoveredTogether} of ${withPath.length} countries show both prosperity and wellbeing at or above their ${recoveries[0]?.thrive.baselineYear ?? 2019} baseline.`;
  }
  return `${shortRegionLabel(region)} shows a mixed pattern across its ${withPath.length} countries with comparable data — no single direction dominates.`;
}

/** One-sentence observation about the pattern the current lens reveals. */
export function getLensInsight(lensKey: string, recoveries: CountryRecovery[]): string {
  const withPath = recoveries.filter((r) => r.recoveryPath !== "insufficient-data");
  if (!withPath.length) return "Not enough complete data yet to describe a pattern for this lens.";

  if (lensKey === "thrive-feel") {
    const count = withPath.filter((r) => r.recoveryPath === "prosperity-without-healing").length;
    return `${count} of ${withPath.length} countries with complete data recovered economically without their wellbeing catching up at the same pace.`;
  }
  if (lensKey === "live-thrive") {
    const count = withPath.filter((r) => r.recoveryPath === "resilient-lives").length;
    return `${count} of ${withPath.length} countries held their health signal steady even while prosperity moved below its baseline.`;
  }
  const count = withPath.filter(
    (r) => r.connectPointChange !== null && r.connectPointChange > 5 && r.feelAbsoluteChange !== null && r.feelAbsoluteChange < 0,
  ).length;
  return `${count} countries expanded internet access by more than 5 points while wellbeing still sits below its baseline.`;
}

/** Combines a prediction question's pre-computed rationale with the
 * visitor's correctness into a single reveal sentence. */
export function getPredictionExplanation(correct: boolean, rationale: string): string {
  return `${correct ? "Correct." : "Not quite."} ${rationale}`;
}

// ---------------------------------------------------------------------------
// Contextual prompt selection — pure function of (trigger, context, data).
// Timing/gating (has this been shown this session, has enough time passed)
// lives in DataCompanion, not here.
// ---------------------------------------------------------------------------

export type CompanionTrigger = "hero-visible" | "entered-explore" | "country-selected" | "inactivity";

export function getContextualPrompt(
  trigger: CompanionTrigger,
  context: CompanionContext,
  recoveries: CountryRecovery[],
): CompanionPrompt | null {
  switch (trigger) {
    case "hero-visible":
      return {
        id: "welcome",
        message:
          "The world reopened, but recovery did not happen equally. Would you like a guided three-minute journey or explore on your own?",
        actions: [
          { id: "guide-me", label: "Guide me" },
          { id: "give-challenge", label: "Give me a challenge" },
          { id: "explore-myself", label: "I'll explore" },
        ],
      };

    case "entered-explore":
      return {
        id: "explore-entry",
        message: "Each bubble shows a country's movement from its 2019 baseline. Start with prosperity versus wellbeing?",
        actions: [
          { id: "show-contrast", label: "Show the pattern" },
          { id: "how-to-read", label: "How do I read this?" },
          { id: "hide-guide", label: "Hide guide" },
        ],
      };

    case "country-selected": {
      if (!context.selectedIso3) return null;
      const recovery = recoveries.find((r) => r.iso3 === context.selectedIso3);
      if (!recovery) return null;
      return {
        id: `country-${recovery.iso3}`,
        message: getSelectedCountryInsight(recovery),
        actions: [
          { id: "compare-region", label: "Compare with region" },
          { id: "see-another-contrast", label: "See another contrast" },
          { id: "continue-exploring", label: "Continue exploring" },
        ],
      };
    }

    case "inactivity":
      return {
        id: "inactivity",
        message: "Still there? Try comparing how digital access and wellbeing moved together — or didn't.",
        actions: [
          { id: "show-contrast", label: "Show the pattern" },
          { id: "hide-guide", label: "Hide guide" },
        ],
      };

    default:
      return null;
  }
}

export function buildAnswerResult(
  question: PredictionAnswerResult["question"],
  selectedOptionId: string,
): PredictionAnswerResult {
  const correct = selectedOptionId === question.correctOptionId;
  return {
    question,
    selectedOptionId,
    correct,
    explanation: getPredictionExplanation(correct, question.rationale),
  };
}
