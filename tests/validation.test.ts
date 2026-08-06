import { describe, expect, it } from "vitest";
import countriesData from "@/public/data/countries.json";
import type { CountryDataset, Dataset } from "@/lib/types";
import { validateCountry, validateDataset } from "@/lib/validation";

const dataset = countriesData as Dataset;

describe("dataset validation", () => {
  it("accepts the committed, pipeline-generated dataset", () => {
    expect(validateDataset(dataset)).toEqual([]);
  });

  it("reports required identity and population errors", () => {
    const base = dataset.countries[0];
    const invalid: CountryDataset = { ...base, iso3: "", population: 0 };
    const issues = validateCountry(invalid);
    expect(issues.map((issue) => issue.path)).toContain("countries[0].iso3");
    expect(issues.map((issue) => issue.path)).toContain("countries[0].population");
  });

  it("allows null indicator values but rejects non-finite values", () => {
    const base = dataset.countries[0];
    expect(validateCountry({ ...base, feel: { ...base.feel, latestValue: null } })).toEqual([]);
    const issues = validateCountry({ ...base, feel: { ...base.feel, latestValue: Number.NaN } });
    expect(issues.some((issue) => issue.path.endsWith("feel.latestValue"))).toBe(true);
  });

  it("allows a null population (unavailable, but country preserved)", () => {
    const base = dataset.countries[0];
    expect(validateCountry({ ...base, population: null })).toEqual([]);
  });
});
