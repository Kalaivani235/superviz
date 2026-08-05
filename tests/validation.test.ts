import { describe, expect, it } from "vitest";
import pilotData from "@/data/pilot-countries.json";
import type { Dataset, PilotCountry } from "@/lib/types";
import { validateCountry, validateDataset } from "@/lib/validation";

describe("dataset validation", () => {
  it("accepts the committed pilot dataset", () => {
    expect(validateDataset(pilotData as Dataset)).toEqual([]);
  });

  it("reports required identity and population errors", () => {
    const base = (pilotData as Dataset).countries[0];
    const invalid: PilotCountry = { ...base, iso3: "", population: 0 };
    const issues = validateCountry(invalid);
    expect(issues.map((issue) => issue.path)).toContain("countries[0].iso3");
    expect(issues.map((issue) => issue.path)).toContain("countries[0].population");
  });

  it("allows null indicator values but rejects non-finite values", () => {
    const base = (pilotData as Dataset).countries[0];
    expect(validateCountry({ ...base, feel: { ...base.feel, latestValue: null } })).toEqual([]);
    const issues = validateCountry({ ...base, feel: { ...base.feel, latestValue: Number.NaN } });
    expect(issues.some((issue) => issue.path.endsWith("feel.latestValue"))).toBe(true);
  });
});
