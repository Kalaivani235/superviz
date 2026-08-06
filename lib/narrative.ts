import type { CountryRecovery, MetricKey } from "./types";
import { formatSigned } from "./formatting";

type Direction = "up" | "down" | "flat" | "unavailable";

function direction(value: number | null): Direction {
  if (value === null) return "unavailable";
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

const METRIC_LABEL: Record<MetricKey, string> = {
  live: "life expectancy",
  thrive: "real GDP per person",
  connect: "internet participation",
  feel: "life satisfaction",
};

/**
 * Deterministic, rule-based narrative for a country's recovery pattern.
 * No runtime model call: every sentence is assembled from fixed templates
 * driven by the sign of each already-computed change value. Language is
 * kept descriptive ("the data shows", "this pattern suggests") and avoids
 * causal claims that the data cannot support.
 */
export function generateNarrative(recovery: CountryRecovery): string {
  const thrive = direction(recovery.thrivePctChange);
  const feel = direction(recovery.feelAbsoluteChange);
  const live = direction(recovery.liveAbsoluteChange);
  const connect = direction(recovery.connectPointChange);
  const sentences: string[] = [];

  const directions: Record<MetricKey, Direction> = { live, thrive, connect, feel };
  const missing: MetricKey[] = (["live", "thrive", "connect", "feel"] as MetricKey[]).filter(
    (key) => directions[key] === "unavailable",
  );

  if (thrive === "up" && feel === "down") {
    sentences.push(
      `Compared with its ${recovery.thrive.baselineYear} baseline, ${recovery.country}'s real GDP per person grew ${formatSigned(recovery.thrivePctChange, 1, "%")}, while reported life satisfaction moved ${formatSigned(recovery.feelAbsoluteChange, 2)} points in the opposite direction. This pattern suggests economic recovery did not translate directly into subjective wellbeing here.`,
    );
  } else if (thrive !== "up" && thrive !== "unavailable" && feel === "up") {
    sentences.push(
      `Compared with its ${recovery.thrive.baselineYear} baseline, reported life satisfaction improved by ${formatSigned(recovery.feelAbsoluteChange, 2)} points even though real GDP per person moved ${formatSigned(recovery.thrivePctChange, 1, "%")}. This pattern suggests wellbeing held up without proportional economic growth.`,
    );
  } else if (connect === "up" && Math.abs(recovery.connectPointChange ?? 0) >= 10 && (feel === "down" || feel === "flat")) {
    sentences.push(
      `Internet participation expanded by ${formatSigned(recovery.connectPointChange, 1, " points")} since ${recovery.connect.baselineYear}, but reported life satisfaction ${feel === "down" ? "moved lower" : "stayed roughly flat"} over the same period. The data shows digital access growing faster than emotional recovery here.`,
    );
  } else if ([thrive, live, connect, feel].every((d) => d === "up" || d === "flat")) {
    sentences.push(
      `The data shows every available signal at or above its ${recovery.thrive.baselineYear} level — ${recovery.country} recorded a broad recovery across the dimensions measured here.`,
    );
  } else if (missing.length >= 3) {
    sentences.push(
      `Available data for ${recovery.country} is limited, so a recovery pattern cannot be established across dimensions with confidence.`,
    );
  } else {
    sentences.push(
      `The data shows a mixed pattern for ${recovery.country} since ${recovery.thrive.baselineYear}, with no single dimension dominating its trajectory.`,
    );
  }

  if (missing.length > 0 && missing.length < 4) {
    const labels = missing.map((key) => METRIC_LABEL[key]);
    sentences.push(
      `${labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`} data is not available for this country and is excluded from this comparison.`,
    );
  }

  return sentences.join(" ");
}
