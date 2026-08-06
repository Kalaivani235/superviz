import { describe, expect, it } from "vitest";
import { getContextualPrompt, getPredictionExplanation, getRegionalInsight, getSelectedCountryInsight } from "@/lib/companion/companion-engine";
import type { CompanionContext } from "@/lib/companion/types";
import type { CountryRecovery, IndicatorSeries } from "@/lib/types";

const series = (baselineValue: number | null, latestValue: number | null): IndicatorSeries => ({
  unit: "units",
  sourceId: "test",
  values: [],
  baselineYear: 2019,
  baselineValue,
  latestYear: 2024,
  latestValue,
});

function recovery(overrides: Partial<CountryRecovery> = {}): CountryRecovery {
  return {
    iso3: "TST",
    country: "Testland",
    region: "Test Region",
    incomeGroup: "High income",
    population: 1_000_000,
    populationYear: 2024,
    live: series(70, 71),
    thrive: series(100, 110),
    connect: series(50, 65),
    feel: series(6, 5.8),
    thrivePctChange: 10,
    liveAbsoluteChange: 1,
    connectPointChange: 15,
    feelAbsoluteChange: -0.2,
    recoveryPath: "prosperity-without-healing",
    ...overrides,
  };
}

describe("getSelectedCountryInsight", () => {
  it("names both a strongest positive and strongest negative signal", () => {
    const text = getSelectedCountryInsight(recovery());
    expect(text).toContain("Testland");
    expect(text).toContain("improved strongly");
    expect(text).toContain("followed a different path");
  });

  it("preserves acronym casing (GDP) instead of blanket-lowercasing", () => {
    const text = getSelectedCountryInsight(
      recovery({ thrivePctChange: 40, connectPointChange: 2, liveAbsoluteChange: 1, feelAbsoluteChange: -0.5 }),
    );
    expect(text).toContain("GDP");
    expect(text).not.toContain("gdp");
  });

  it("describes broad recovery when every signal is non-negative", () => {
    const text = getSelectedCountryInsight(
      recovery({ thrivePctChange: 5, liveAbsoluteChange: 1, connectPointChange: 2, feelAbsoluteChange: 0.1 }),
    );
    expect(text).toContain("broad recovery");
  });

  it("handles a country with no comparable data without fabricating a value", () => {
    const text = getSelectedCountryInsight(
      recovery({ thrivePctChange: null, liveAbsoluteChange: null, connectPointChange: null, feelAbsoluteChange: null }),
    );
    expect(text).toContain("doesn't have enough comparable data");
  });

  it("never uses causal language", () => {
    const text = getSelectedCountryInsight(recovery());
    for (const forbidden of [/\bbecause\b/i, /\bcaused\b/i, /\bled to\b/i, /\bproved\b/i]) {
      expect(text).not.toMatch(forbidden);
    }
  });
});

describe("getRegionalInsight", () => {
  it("reports the dominant pattern within a region", () => {
    const recoveries = [
      recovery({ iso3: "A", region: "Test Region", recoveryPath: "prosperity-without-healing" }),
      recovery({ iso3: "B", region: "Test Region", recoveryPath: "prosperity-without-healing" }),
      recovery({ iso3: "C", region: "Test Region", recoveryPath: "recovered-together" }),
      recovery({ iso3: "D", region: "Other Region", recoveryPath: "recovered-together" }),
    ];
    const text = getRegionalInsight("Test Region", recoveries);
    expect(text).toContain("2 of 3");
    expect(text).toContain("Test Region");
  });

  it("does not fabricate a pattern when there is no complete data", () => {
    const recoveries = [recovery({ region: "Empty Region", recoveryPath: "insufficient-data" })];
    const text = getRegionalInsight("Empty Region", recoveries);
    expect(text).toContain("doesn't have enough");
  });
});

describe("getPredictionExplanation", () => {
  it("prefixes the rationale with Correct when right", () => {
    expect(getPredictionExplanation(true, "X grew 10%.")).toBe("Correct. X grew 10%.");
  });
  it("prefixes the rationale with Not quite when wrong", () => {
    expect(getPredictionExplanation(false, "X grew 10%.")).toBe("Not quite. X grew 10%.");
  });
});

describe("getContextualPrompt", () => {
  const baseContext: CompanionContext = {
    activeSection: "overview",
    lens: "thrive-feel",
    region: "All regions",
    year: 2024,
    selectedIso3: null,
    isPlaying: false,
    storySpotlight: null,
  };

  it("returns the welcome prompt with exactly the three specified actions", () => {
    const prompt = getContextualPrompt("hero-visible", baseContext, []);
    expect(prompt?.actions.map((a) => a.id)).toEqual(["guide-me", "give-challenge", "explore-myself"]);
  });

  it("returns null for country-selected when no country is selected", () => {
    const prompt = getContextualPrompt("country-selected", baseContext, []);
    expect(prompt).toBeNull();
  });

  it("returns a grounded observation once a country is selected", () => {
    const context = { ...baseContext, selectedIso3: "TST" };
    const prompt = getContextualPrompt("country-selected", context, [recovery()]);
    expect(prompt?.message).toContain("Testland");
  });
});
