import { describe, expect, it } from "vitest";
import { clampSceneIndex, isLastScene, resolveStory } from "@/lib/companion/scene-runner";
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

describe("resolveStory", () => {
  it("resolves every scene when the dataset supports all four patterns", () => {
    const recoveries = [
      recovery({ iso3: "A", thrivePctChange: 20, feelAbsoluteChange: 1, recoveryPath: "recovered-together" }),
      recovery({ iso3: "B", thrivePctChange: 15, feelAbsoluteChange: -0.4, recoveryPath: "prosperity-without-healing" }),
      recovery({ iso3: "C", thrivePctChange: -10, feelAbsoluteChange: 0.3, recoveryPath: "resilient-lives" }),
      recovery({ iso3: "D", thrivePctChange: -8, feelAbsoluteChange: -0.5, recoveryPath: "still-recovering" }),
      recovery({ iso3: "E", thrivePctChange: 12, feelAbsoluteChange: -0.3, connectPointChange: 25, recoveryPath: "prosperity-without-healing" }),
    ];
    const scenes = resolveStory(recoveries, 2024, 2019);
    expect(scenes).toHaveLength(4);
    expect(scenes.map((s) => s.id)).toEqual([
      "uneven-recovery",
      "prosperity-without-healing",
      "connection-without-wellbeing",
      "not-one-score",
    ]);
    scenes.forEach((scene, index) => expect(scene.index).toBe(index));
  });

  it("never fabricates a scene it can't support with the current dataset", () => {
    // Only one recovery path present, and no connect/feel divergence — most
    // scenes require patterns this dataset does not contain.
    const recoveries = [recovery({ recoveryPath: "still-recovering", connectPointChange: 1, feelAbsoluteChange: 1 })];
    const scenes = resolveStory(recoveries, 2024, 2019);
    // uneven-recovery and not-one-score both need >=2 distinct quadrants —
    // with only one path present, neither can resolve.
    expect(scenes.find((s) => s.id === "uneven-recovery")).toBeUndefined();
    expect(scenes.find((s) => s.id === "not-one-score")).toBeUndefined();
  });

  it("returns an empty story for an empty dataset rather than throwing", () => {
    expect(resolveStory([], 2024, 2019)).toEqual([]);
  });
});

describe("clampSceneIndex", () => {
  it("clamps to the valid range", () => {
    expect(clampSceneIndex(-1, 4)).toBe(0);
    expect(clampSceneIndex(10, 4)).toBe(3);
    expect(clampSceneIndex(2, 4)).toBe(2);
  });
  it("returns 0 for an empty scene list", () => {
    expect(clampSceneIndex(2, 0)).toBe(0);
  });
});

describe("isLastScene", () => {
  it("identifies the final index", () => {
    expect(isLastScene(3, 4)).toBe(true);
    expect(isLastScene(2, 4)).toBe(false);
    expect(isLastScene(0, 0)).toBe(false);
  });
});
