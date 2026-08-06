import type { RecoveryPath } from "./types";

export const PATH_LABELS: Record<RecoveryPath, string> = {
  "recovered-together": "Recovered Together",
  "prosperity-without-healing": "Prosperity Without Healing",
  "resilient-lives": "Resilient Lives",
  "still-recovering": "Still Recovering",
  "insufficient-data": "Insufficient Data",
};

export function formatSigned(
  value: number | null,
  digits = 1,
  suffix = "",
): string {
  if (value === null || !Number.isFinite(value)) return "Not available";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}${suffix}`;
}

export function formatPopulation(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function directionWord(value: number | null): "above" | "below" | "at" | "without comparable data to" {
  if (value === null) return "without comparable data to";
  if (value > 0) return "above";
  if (value < 0) return "below";
  return "at";
}

export function formatValue(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "Not available";
  return value.toFixed(digits);
}

export function formatYear(year: number | string | null): string {
  if (year === null) return "—";
  return String(year);
}

const REGION_LABELS: Record<string, string> = {
  "Middle East, North Africa, Afghanistan & Pakistan": "Middle East & North Africa",
};

export function shortRegionLabel(region: string): string {
  return REGION_LABELS[region] ?? region;
}
