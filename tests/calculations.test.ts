import { describe, expect, it } from "vitest";
import {
  absoluteChange,
  aggregateHeadlineMetrics,
  classifyRecoveryPath,
  deriveCountryRecovery,
  percentageChange,
} from "@/lib/calculations";
import type { PilotCountry } from "@/lib/types";

const country = (overrides: Partial<PilotCountry> = {}): PilotCountry => ({
  iso3: "TST",
  country: "Testland",
  region: "Test Region",
  population: 1_000_000,
  live: { baselineYear: 2019, baselineValue: 70, latestYear: 2023, latestValue: 71, unit: "years", sourceId: "life" },
  thrive: { baselineYear: 2019, baselineValue: 100, latestYear: 2024, latestValue: 110, unit: "USD", sourceId: "gdp" },
  connect: { baselineYear: 2019, baselineValue: 50, latestYear: 2023, latestValue: 65, unit: "%", sourceId: "internet" },
  feel: { baselineYear: 2019, baselineValue: 6, latestYear: 2024, latestValue: 5.8, unit: "points", sourceId: "happiness" },
  ...overrides,
});

describe("percentageChange", () => {
  it("calculates percentage change", () => expect(percentageChange(100, 115)).toBe(15));
  it("returns null for a missing baseline", () => expect(percentageChange(null, 115)).toBeNull());
  it("returns null for a missing latest value", () => expect(percentageChange(100, null)).toBeNull());
  it("protects against a zero baseline", () => expect(percentageChange(0, 115)).toBeNull());
});

describe("absoluteChange", () => {
  it("calculates signed absolute change", () => expect(absoluteChange(6.2, 5.9)).toBeCloseTo(-0.3));
  it("returns null when either side is missing", () => {
    expect(absoluteChange(null, 5.9)).toBeNull();
    expect(absoluteChange(6.2, null)).toBeNull();
  });
});

describe("classifyRecoveryPath", () => {
  it.each([
    [1, 0.1, "recovered-together"],
    [1, -0.1, "prosperity-without-healing"],
    [-1, 0.1, "resilient-lives"],
    [-1, -0.1, "still-recovering"],
    [null, 0.1, "insufficient-data"],
    [1, null, "insufficient-data"],
  ] as const)("classifies %s and %s as %s", (gdp, feel, expected) => {
    expect(classifyRecoveryPath(gdp, feel)).toBe(expected);
  });
});

describe("headline aggregation", () => {
  it("aggregates available values and ignores missing indicators", () => {
    const missingFeel = country({
      iso3: "MIS",
      thrive: { baselineYear: 2019, baselineValue: 100, latestYear: 2024, latestValue: 90, unit: "USD", sourceId: "gdp" },
      feel: { baselineYear: 2019, baselineValue: 6, latestYear: 2024, latestValue: null, unit: "points", sourceId: "happiness" },
    });
    const result = aggregateHeadlineMetrics([deriveCountryRecovery(country()), deriveCountryRecovery(missingFeel)]);
    expect(result.thriveRecoveredCount).toBe(1);
    expect(result.thriveCountryCount).toBe(2);
    expect(result.averageLiveChange).toBe(1);
    expect(result.averageFeelChange).toBeCloseTo(-0.2);
  });
});
