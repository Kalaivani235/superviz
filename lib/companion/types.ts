import type { CountryRecovery, LensKey, MetricKey } from "@/lib/types";

// ---------------------------------------------------------------------------
// Command contract — the companion never touches visualization state
// directly. It only ever issues one of these through AtlasApp's single
// command handler, which is the same state AtlasApp already owns.
// ---------------------------------------------------------------------------

export type CompanionCommand =
  | {
      type: "SET_VIEW";
      lens?: LensKey;
      region?: string;
      year?: number;
      selectedIso3?: string;
      spotlightIso3s?: string[];
      section?: string;
    }
  | {
      type: "CLEAR_SPOTLIGHT";
    }
  | {
      type: "SCROLL_TO_SECTION";
      section: string;
    };

// ---------------------------------------------------------------------------
// Context — read-only snapshot of the current visualization state, passed
// into the companion each render so it can decide what to say.
// ---------------------------------------------------------------------------

export interface CompanionContext {
  activeSection: string;
  lens: LensKey;
  region: string;
  year: number;
  selectedIso3: string | null;
  selectedCountryName?: string;
  storySpotlight: string[] | null;
}

// ---------------------------------------------------------------------------
// Orbit highlighting — a superset of the old single-purpose spotlight prop,
// so the companion's guided story and prediction reveal can both drive the
// same mechanism the (removed) story cards used to.
// ---------------------------------------------------------------------------

export type CompanionHighlightMode = "spotlight" | "pulse" | "compare" | "answer-reveal";

export interface CompanionHighlight {
  iso3s: string[];
  mode: CompanionHighlightMode;
  label?: string;
  /** Only meaningful for mode "answer-reveal": tints the highlight to
   * indicate whether the visitor's prediction was correct. */
  correct?: boolean;
}

// ---------------------------------------------------------------------------
// Companion message + action chips — the only UI vocabulary the companion
// is allowed to use. No free text input, no transcript.
// ---------------------------------------------------------------------------

export type CompanionActionId =
  | "guide-me"
  | "give-challenge"
  | "explore-myself"
  | "show-contrast"
  | "how-to-read"
  | "hide-guide"
  | "compare-region"
  | "see-another-contrast"
  | "continue-exploring"
  | "story-next"
  | "story-prev"
  | "story-pause"
  | "story-resume"
  | "story-exit"
  | "story-restart"
  | "prediction-show-another"
  | "prediction-explore-country"
  | "prediction-continue-story"
  | "atlas-show-me"
  | "minimize";

export interface CompanionAction {
  id: CompanionActionId;
  label: string;
}

export interface CompanionPrompt {
  id: string;
  message: string;
  actions: CompanionAction[];
  /** A command to issue as soon as the prompt is shown (e.g. entering
   * Explore already scrolls there) — most prompts have none. */
  command?: CompanionCommand;
}

// ---------------------------------------------------------------------------
// Guided story
// ---------------------------------------------------------------------------

export interface ResolvedScene {
  id: string;
  index: number;
  title: string;
  narrative: string;
  command: CompanionCommand;
  highlight: CompanionHighlight | null;
}

export interface SceneResolution {
  scene: ResolvedScene | null;
  /** True when the scene's data requirements (e.g. a country matching a
   * pattern) could not be met with the current dataset — the scene is
   * skipped rather than shown with fabricated content. */
  skipped: boolean;
}

// ---------------------------------------------------------------------------
// Prediction questions
// ---------------------------------------------------------------------------

export type PredictionQuestionType = "country-choice" | "region-choice" | "signal-choice";

export interface PredictionOption {
  id: string;
  label: string;
}

export interface PredictionQuestion {
  id: string;
  type: PredictionQuestionType;
  question: string;
  options: PredictionOption[];
  correctOptionId: string;
  /** Why the correct option is correct, in terms of the underlying
   * computed values — shown after the visitor answers. */
  rationale: string;
  /** The visualization command to issue when revealing the answer. */
  command: CompanionCommand;
  /** Countries to highlight during reveal. */
  highlightIso3s: string[];
  sourceMetrics: MetricKey[];
  years: number[];
}

export interface PredictionAnswerResult {
  question: PredictionQuestion;
  selectedOptionId: string;
  correct: boolean;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Session-scoped preferences (sessionStorage only — never persistent)
// ---------------------------------------------------------------------------

export const COMPANION_SESSION_KEYS = {
  dismissed: "atlas-guide-dismissed",
  started: "atlas-guide-started",
  completedStory: "atlas-guide-completed-story",
  lastPrediction: "atlas-guide-last-prediction",
  mode: "atlas-guide-mode",
} as const;

export type CompanionSessionMode = "guided" | "challenge" | "explore" | "idle";

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type CompanionEventName =
  | "companion_opened"
  | "story_started"
  | "story_scene_completed"
  | "prediction_answered"
  | "companion_dismissed"
  | "companion_action_clicked";

export interface CompanionEvent {
  event: CompanionEventName;
  metadata: Record<string, string | number | boolean>;
}

// Re-exported so companion modules don't need to import from two places.
export type { CountryRecovery, LensKey, MetricKey };
