import { GUIDED_SCENES } from "@/data/companion/guided-scenes";
import type { ResolvedScene } from "./types";
import type { CountryRecovery } from "@/lib/types";

export type StoryPlaybackState = "playing" | "paused" | "idle";

/**
 * Resolves every guided scene against the current dataset once, up front,
 * dropping any scene whose data requirements aren't met (never fabricated).
 * The result is a clean, contiguous list — story navigation is then just
 * array-index bookkeeping in the player component.
 */
export function resolveStory(recoveries: CountryRecovery[], latestYear: number, baselineYear: number): ResolvedScene[] {
  const scenes: ResolvedScene[] = [];
  for (const definition of GUIDED_SCENES) {
    const resolved = definition.resolve({ recoveries, latestYear, baselineYear });
    if (resolved) scenes.push({ ...resolved, index: scenes.length });
  }
  return scenes;
}

export function clampSceneIndex(index: number, sceneCount: number): number {
  if (sceneCount === 0) return 0;
  return Math.max(0, Math.min(index, sceneCount - 1));
}

export function isLastScene(index: number, sceneCount: number): boolean {
  return sceneCount > 0 && index >= sceneCount - 1;
}
