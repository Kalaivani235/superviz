// Validates the transformed dataset for structural and logical integrity.
// Run with: node scripts/validate-data.mjs

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATASET_PATH = path.join(ROOT, "public/data/countries.json");
const REPORT_PATH = path.join(ROOT, "data/metadata/validation-report.json");

const INDICATOR_KEYS = ["live", "thrive", "connect", "feel"];

function validateIndicatorSeries(series, path) {
  const issues = [];
  if (!series || typeof series !== "object") {
    return [{ path, message: "indicator series must be an object" }];
  }
  if (!series.unit || typeof series.unit !== "string") issues.push({ path: `${path}.unit`, message: "missing unit" });
  if (!series.sourceId || typeof series.sourceId !== "string") issues.push({ path: `${path}.sourceId`, message: "missing sourceId" });
  if (!Array.isArray(series.values)) {
    issues.push({ path: `${path}.values`, message: "must be an array" });
  } else {
    for (let i = 1; i < series.values.length; i += 1) {
      if (series.values[i].year <= series.values[i - 1].year) {
        issues.push({ path: `${path}.values[${i}]`, message: "years must be strictly ascending" });
      }
    }
    for (const point of series.values) {
      if (!Number.isInteger(point.year)) issues.push({ path: `${path}.values`, message: `non-integer year ${point.year}` });
      if (typeof point.value !== "number" || !Number.isFinite(point.value)) {
        issues.push({ path: `${path}.values`, message: `non-finite value at year ${point.year}` });
      }
    }
  }
  if (series.baselineValue !== null && typeof series.baselineValue !== "number") {
    issues.push({ path: `${path}.baselineValue`, message: "must be number or null" });
  }
  if (series.latestValue !== null && typeof series.latestValue !== "number") {
    issues.push({ path: `${path}.latestValue`, message: "must be number or null" });
  }
  return issues;
}

function validateCountry(country, index) {
  const base = `countries[${index}] (${country.iso3 ?? "?"})`;
  const issues = [];
  if (!/^[A-Z]{3}$/.test(country.iso3 ?? "")) issues.push({ path: base, message: "invalid iso3" });
  if (!country.country?.trim()) issues.push({ path: base, message: "missing country name" });
  if (!country.region?.trim()) issues.push({ path: base, message: "missing region" });
  if (country.population !== null && (!Number.isFinite(country.population) || country.population <= 0)) {
    issues.push({ path: `${base}.population`, message: "must be positive, finite, or null" });
  }
  for (const key of INDICATOR_KEYS) {
    issues.push(...validateIndicatorSeries(country[key], `${base}.${key}`));
  }
  return issues;
}

async function main() {
  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf-8"));
  const issues = [];

  if (dataset.mode !== "validated" && dataset.mode !== "demo") {
    issues.push({ path: "mode", message: "must be validated or demo" });
  }
  if (!Array.isArray(dataset.countries) || dataset.countries.length === 0) {
    issues.push({ path: "countries", message: "must be a non-empty array" });
  } else {
    dataset.countries.forEach((country, index) => issues.push(...validateCountry(country, index)));
  }

  const isoSet = new Set();
  const duplicates = [];
  for (const country of dataset.countries ?? []) {
    if (isoSet.has(country.iso3)) duplicates.push(country.iso3);
    isoSet.add(country.iso3);
  }
  if (duplicates.length) issues.push({ path: "countries", message: `duplicate iso3 codes: ${duplicates.join(", ")}` });

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  const report = {
    validatedAt: new Date().toISOString(),
    countryCount: dataset.countries?.length ?? 0,
    issueCount: issues.length,
    issues,
  };
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  if (issues.length) {
    console.error(`Validation found ${issues.length} issue(s). See data/metadata/validation-report.json`);
    issues.slice(0, 20).forEach((issue) => console.error(`  ${issue.path}: ${issue.message}`));
    process.exitCode = 1;
  } else {
    console.log(`Validation passed for ${report.countryCount} countries. Report: data/metadata/validation-report.json`);
  }
}

main().catch((error) => {
  console.error("validate-data failed:", error);
  process.exitCode = 1;
});
