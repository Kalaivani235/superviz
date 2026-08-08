import { METRIC_MAGNITUDE } from "@/lib/constants";
import { formatSigned } from "@/lib/formatting";
import type { CountryRecovery } from "@/lib/types";
import type { CompanionCommand } from "./types";

// ---------------------------------------------------------------------------
// Deterministic discovery generation — no runtime model call. A discovery is
// picked by scoring real, already-computed recovery values and taking the
// strongest match. Atlas only ever narrates numbers this file computed.
// ---------------------------------------------------------------------------

export type AtlasDiscoveryType = "economic_wellbeing_gap";

export interface AtlasDiscovery {
  id: string;
  type: AtlasDiscoveryType;
  setup: string;
  surprise: string;
  iso3: string;
  country: string;
  command: CompanionCommand;
  evidence: {
    thriveChange: number;
    feelChange: number;
    baselineYear: number;
  };
}

/** Finds the country with the strongest contrast between a positive THRIVE
 * (prosperity) recovery and a negative FEEL (wellbeing) recovery — ranked by
 * how far apart the two normalized signals sit, per the spec's
 * `contrastStrength` scoring idea. */
export function findEconomicWellbeingGap(recoveries: CountryRecovery[]): AtlasDiscovery | null {
  const candidates = recoveries
    .map((recovery) => {
      const thriveChange = recovery.thrivePctChange;
      const feelChange = recovery.feelAbsoluteChange;
      if (thriveChange === null || feelChange === null) return null;
      if (!(thriveChange > 0 && feelChange < 0)) return null;
      const contrast = Math.abs(thriveChange / METRIC_MAGNITUDE.thrive - feelChange / METRIC_MAGNITUDE.feel);
      return { recovery, thriveChange, feelChange, contrast };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.contrast - a.contrast);

  const top = candidates[0];
  if (!top) return null;
  const { recovery, thriveChange, feelChange } = top;

  return {
    id: recovery.iso3,
    type: "economic_wellbeing_gap",
    setup: "Economic recovery looks strong here.",
    surprise: "But wellbeing tells another story.",
    iso3: recovery.iso3,
    country: recovery.country,
    evidence: { thriveChange, feelChange, baselineYear: recovery.thrive.baselineYear },
    command: {
      type: "SET_VIEW",
      lens: "thrive-feel",
      selectedIso3: recovery.iso3,
      spotlightIso3s: [recovery.iso3],
    },
  };
}

/** One-paragraph, evidence-grounded explanation shown after "Show me" —
 * every number here comes straight from the discovery's own evidence. */
export function getDiscoveryExplanation(discovery: AtlasDiscovery): string {
  const { country, evidence } = discovery;
  return `Exactly. ${country}'s prosperity signal moved ${formatSigned(evidence.thriveChange, 1, "%")} above its ${evidence.baselineYear} baseline, while its wellbeing signal moved ${formatSigned(evidence.feelChange, 2)} over the same period — prosperity recovered, wellbeing didn't keep pace.`;
}
