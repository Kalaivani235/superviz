import { describe, expect, it } from "vitest";
import {
  absoluteChange,
  aggregateHeadlineMetrics,
  changeAsOfYear,
  classifyRecoveryPath,
  deriveCountryRecovery,
  percentageChange,
  pointAsOfYear,
} from "@/lib/calculations";
import type { CountryDataset, IndicatorSeries } from "@/lib/types";

const series = (overrides: Partial<IndicatorSeries> = {}): IndicatorSeries => ({
  unit: "units",
  sourceId: "test-source",
  values: [
    { year: 2019, value: 100 },
    { year: 2021, value: 105 },
    { year: 2023, value: 110 },
  ],
  baselineYear: 2019,
  baselineValue: 100,
  latestYear: 2023,
  latestValue: 110,
  ...overrides,
});

const country = (overrides: Partial<CountryDataset> = {}): CountryDataset => ({
  iso3: "TST",
  country: "Testland",
  region: "Test Region",
  incomeGroup: "High income",
  population: 1_000_000,
  populationYear: 2023,
  live: series({ values: [{ year: 2019, value: 70 }, { year: 2023, value: 71 }], baselineValue: 70, latestYear: 2023, latestValue: 71 }),
  thrive: series(),
  connect: series({ values: [{ year: 2019, value: 50 }, { year: 2023, value: 65 }], baselineValue: 50, latestYear: 2023, latestValue: 65 }),
  feel: series({ values: [{ year: 2019, value: 6 }, { year: 2023, value: 5.8 }], baselineValue: 6, latestYear: 2023, latestValue: 5.8 }),
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
      thrive: series({ latestValue: 90 }),
      feel: series({ values: [{ year: 2019, value: 6 }], baselineValue: 6, latestYear: null, latestValue: null }),
    });
    const result = aggregateHeadlineMetrics([deriveCountryRecovery(country()), deriveCountryRecovery(missingFeel)]);
    expect(result.thriveRecoveredCount).toBe(1);
    expect(result.thriveCountryCount).toBe(2);
    expect(result.averageLiveChange).toBe(1);
    expect(result.averageFeelChange).toBeCloseTo(-0.2);
  });
});

describe("pointAsOfYear", () => {
  const s = series({ values: [{ year: 2019, value: 10 }, { year: 2021, value: 12 }, { year: 2023, value: 15 }] });
  it("returns the exact observation when available", () => {
    expect(pointAsOfYear(s, 2021)).toEqual({ year: 2021, value: 12, isExact: true });
  });
  it("carries forward the most recent prior observation", () => {
    expect(pointAsOfYear(s, 2022)).toEqual({ year: 2021, value: 12, isExact: false });
  });
  it("returns null when there is no observation on or before the year", () => {
    expect(pointAsOfYear(s, 2018)).toBeNull();
  });
});

describe("changeAsOfYear", () => {
  it("computes percentage change for thrive", () => {
    const c = country();
    const result = changeAsOfYear(c, "thrive", 2021);
    expect(result?.value).toBeCloseTo(5);
    expect(result?.isExact).toBe(true);
  });
  it("computes absolute change for live", () => {
    const c = country();
    const result = changeAsOfYear(c, "live", 2023);
    expect(result?.value).toBeCloseTo(1);
  });
  it("returns null when the metric has no baseline observation", () => {
    const c = country({ live: series({ values: [{ year: 2021, value: 71 }], baselineValue: null }) });
    expect(changeAsOfYear(c, "live", 2023)).toBeNull();
  });
});
