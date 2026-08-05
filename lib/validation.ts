import type { Dataset, IndicatorValue, PilotCountry } from "./types";

export type ValidationIssue = {
  path: string;
  message: string;
};

const indicators = ["live", "thrive", "connect", "feel"] as const;

function validateIndicator(
  indicator: IndicatorValue,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Number.isInteger(indicator.baselineYear)) {
    issues.push({ path: `${path}.baselineYear`, message: "must be an integer year" });
  }
  if (!Number.isInteger(indicator.latestYear)) {
    issues.push({ path: `${path}.latestYear`, message: "must be an integer year" });
  }
  for (const key of ["baselineValue", "latestValue"] as const) {
    const value = indicator[key];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
      issues.push({ path: `${path}.${key}`, message: "must be finite or null" });
    }
  }
  if (!indicator.unit.trim()) issues.push({ path: `${path}.unit`, message: "is required" });
  if (!indicator.sourceId.trim()) issues.push({ path: `${path}.sourceId`, message: "is required" });
  return issues;
}

export function validateCountry(country: PilotCountry, index = 0): ValidationIssue[] {
  const base = `countries[${index}]`;
  const issues: ValidationIssue[] = [];
  if (!country.iso3?.trim()) issues.push({ path: `${base}.iso3`, message: "is required" });
  if (!country.country?.trim()) issues.push({ path: `${base}.country`, message: "is required" });
  if (!country.region?.trim()) issues.push({ path: `${base}.region`, message: "is required" });
  if (!Number.isFinite(country.population) || country.population <= 0) {
    issues.push({ path: `${base}.population`, message: "must be positive and finite" });
  }
  indicators.forEach((key) => issues.push(...validateIndicator(country[key], `${base}.${key}`)));
  return issues;
}

export function validateDataset(dataset: Dataset): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (dataset.mode !== "demo" && dataset.mode !== "validated") {
    issues.push({ path: "mode", message: "must be demo or validated" });
  }
  if (!dataset.refreshDate?.trim()) {
    issues.push({ path: "refreshDate", message: "is required" });
  }
  if (!Array.isArray(dataset.countries) || dataset.countries.length === 0) {
    issues.push({ path: "countries", message: "must contain at least one country" });
    return issues;
  }
  dataset.countries.forEach((country, index) => issues.push(...validateCountry(country, index)));
  return issues;
}
