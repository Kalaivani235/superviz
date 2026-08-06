import type { CountryDataset, Dataset, IndicatorSeries, MetricKey } from "./types";

export type ValidationIssue = {
  path: string;
  message: string;
};

const indicators: MetricKey[] = ["live", "thrive", "connect", "feel"];

function validateIndicator(indicator: IndicatorSeries, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!indicator.unit?.trim()) issues.push({ path: `${path}.unit`, message: "is required" });
  if (!indicator.sourceId?.trim()) issues.push({ path: `${path}.sourceId`, message: "is required" });
  if (!Array.isArray(indicator.values)) {
    issues.push({ path: `${path}.values`, message: "must be an array" });
  } else {
    for (let i = 1; i < indicator.values.length; i += 1) {
      if (indicator.values[i].year <= indicator.values[i - 1].year) {
        issues.push({ path: `${path}.values[${i}]`, message: "years must be strictly ascending" });
      }
    }
  }
  for (const key of ["baselineValue", "latestValue"] as const) {
    const value = indicator[key];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
      issues.push({ path: `${path}.${key}`, message: "must be finite or null" });
    }
  }
  return issues;
}

export function validateCountry(country: CountryDataset, index = 0): ValidationIssue[] {
  const base = `countries[${index}]`;
  const issues: ValidationIssue[] = [];
  if (!country.iso3?.trim()) issues.push({ path: `${base}.iso3`, message: "is required" });
  if (!country.country?.trim()) issues.push({ path: `${base}.country`, message: "is required" });
  if (!country.region?.trim()) issues.push({ path: `${base}.region`, message: "is required" });
  if (country.population !== null && (!Number.isFinite(country.population) || country.population <= 0)) {
    issues.push({ path: `${base}.population`, message: "must be positive, finite, or null" });
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
