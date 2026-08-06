import { formatSigned } from "@/lib/formatting";
import type { CompanionCommand, CompanionHighlight, ResolvedScene } from "@/lib/companion/types";
import type { CountryRecovery } from "@/lib/types";

type ResolveParams = {
  recoveries: CountryRecovery[];
  latestYear: number;
  baselineYear: number;
};

export interface GuidedSceneDefinition {
  id: string;
  title: string;
  /** Returns null when the current dataset can't support this scene (e.g.
   * no country matches the pattern) — the scene is skipped, never faked. */
  resolve: (params: ResolveParams) => ResolvedScene | null;
}

function withPath(recoveries: CountryRecovery[]) {
  return recoveries.filter((r) => r.recoveryPath !== "insufficient-data");
}

/** One representative country per THRIVE/FEEL quadrant, picked by the
 * strongest example of each pattern (largest absolute divergence). */
function pickOnePerQuadrant(recoveries: CountryRecovery[]): CountryRecovery[] {
  const paths = ["recovered-together", "prosperity-without-healing", "resilient-lives", "still-recovering"] as const;
  const picks: CountryRecovery[] = [];
  for (const path of paths) {
    const candidates = recoveries.filter((r) => r.recoveryPath === path);
    if (!candidates.length) continue;
    const strongest = [...candidates].sort((a, b) => {
      const magnitudeA = Math.abs(a.thrivePctChange ?? 0) + Math.abs(a.feelAbsoluteChange ?? 0) * 20;
      const magnitudeB = Math.abs(b.thrivePctChange ?? 0) + Math.abs(b.feelAbsoluteChange ?? 0) * 20;
      return magnitudeB - magnitudeA;
    })[0];
    picks.push(strongest);
  }
  return picks;
}

function defineScene(
  id: string,
  title: string,
  index: number,
  resolve: (params: ResolveParams) => Omit<ResolvedScene, "id" | "index" | "title"> | null,
): GuidedSceneDefinition {
  return {
    id,
    title,
    resolve: (params) => {
      const result = resolve(params);
      if (!result) return null;
      return { id, index, title, ...result };
    },
  };
}

export const GUIDED_SCENES: GuidedSceneDefinition[] = [
  defineScene("uneven-recovery", "Recovery was uneven", 0, ({ recoveries, latestYear }) => {
    const quadrantPicks = pickOnePerQuadrant(withPath(recoveries));
    if (quadrantPicks.length < 2) return null;
    const command: CompanionCommand = {
      type: "SET_VIEW",
      section: "explore",
      lens: "thrive-feel",
      region: "All regions",
      year: latestYear,
      spotlightIso3s: quadrantPicks.map((c) => c.iso3),
    };
    const highlight: CompanionHighlight = {
      iso3s: quadrantPicks.map((c) => c.iso3),
      mode: "spotlight",
      label: "Four different recovery patterns",
    };
    return {
      narrative:
        "Economic activity returned in many places, but wellbeing did not always recover at the same speed. These countries show four different patterns from the same starting point.",
      command,
      highlight,
    };
  }),

  defineScene("prosperity-without-healing", "Prosperity without healing", 1, ({ recoveries, latestYear }) => {
    const candidates = withPath(recoveries)
      .filter((r) => r.recoveryPath === "prosperity-without-healing")
      .sort((a, b) => (b.thrivePctChange ?? 0) - (a.thrivePctChange ?? 0));
    if (!candidates.length) return null;
    const picks = candidates.slice(0, Math.min(3, candidates.length));
    const lead = picks[0];
    const command: CompanionCommand = {
      type: "SET_VIEW",
      section: "explore",
      lens: "thrive-feel",
      region: "All regions",
      year: latestYear,
      selectedIso3: lead.iso3,
      spotlightIso3s: picks.map((c) => c.iso3),
    };
    const highlight: CompanionHighlight = {
      iso3s: picks.map((c) => c.iso3),
      mode: "spotlight",
      label: "Prosperity recovered, wellbeing didn't",
    };
    return {
      narrative: `In ${lead.country}, real GDP per person rose ${formatSigned(lead.thrivePctChange, 1, "%")} against its ${lead.thrive.baselineYear} baseline, while life satisfaction moved ${formatSigned(lead.feelAbsoluteChange, 2)} points over the same period.${picks.length > 1 ? ` ${picks.length - 1} more countries here show the same pattern.` : ""}`,
      command,
      highlight,
    };
  }),

  defineScene("connection-without-wellbeing", "Connection was not the same as wellbeing", 2, ({ recoveries, latestYear }) => {
    const candidates = recoveries
      .filter((r) => r.connectPointChange !== null && r.connectPointChange > 10 && r.feelAbsoluteChange !== null && r.feelAbsoluteChange <= 0)
      .sort((a, b) => (b.connectPointChange ?? 0) - (a.connectPointChange ?? 0));
    if (!candidates.length) return null;
    const picks = candidates.slice(0, Math.min(3, candidates.length));
    const lead = picks[0];
    const command: CompanionCommand = {
      type: "SET_VIEW",
      section: "explore",
      lens: "connect-feel",
      region: "All regions",
      year: latestYear,
      selectedIso3: lead.iso3,
      spotlightIso3s: picks.map((c) => c.iso3),
    };
    const highlight: CompanionHighlight = {
      iso3s: picks.map((c) => c.iso3),
      mode: "spotlight",
      label: "Digital access grew, wellbeing didn't follow",
    };
    return {
      narrative: `${lead.country}'s internet participation grew ${formatSigned(lead.connectPointChange, 1, " points")} since ${lead.connect.baselineYear}, while its wellbeing signal moved ${formatSigned(lead.feelAbsoluteChange, 2, " points")} over the same period. Being connected was not the same as feeling recovered here.`,
      command,
      highlight,
    };
  }),

  defineScene("not-one-score", "Recovery cannot be one score", 3, ({ recoveries, latestYear }) => {
    const quadrantPicks = pickOnePerQuadrant(withPath(recoveries));
    if (quadrantPicks.length < 2) return null;
    const command: CompanionCommand = {
      type: "SET_VIEW",
      section: "explore",
      lens: "thrive-feel",
      region: "All regions",
      year: latestYear,
      spotlightIso3s: quadrantPicks.map((c) => c.iso3),
    };
    const highlight: CompanionHighlight = {
      iso3s: quadrantPicks.map((c) => c.iso3),
      mode: "spotlight",
      label: "Contrasting recovery profiles",
    };
    return {
      narrative:
        "Recovery is not a date and it is not one score. It is the distance between what returned and what people regained.",
      command,
      highlight,
    };
  }),
];
