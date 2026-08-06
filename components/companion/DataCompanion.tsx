"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getContextualPrompt, getPredictionExplanation, getRegionalInsight, getSelectedCountryInsight } from "@/lib/companion/companion-engine";
import { pickNextQuestion, validateAnswer } from "@/lib/companion/prediction-engine";
import { resolveStory } from "@/lib/companion/scene-runner";
import { trackCompanionEvent } from "@/lib/companion/analytics";
import { COMPANION_SESSION_KEYS } from "@/lib/companion/types";
import type {
  CompanionActionId,
  CompanionCommand,
  CompanionContext,
  CompanionPrompt,
  CompanionSessionMode,
  PredictionAnswerResult,
  PredictionQuestion,
  ResolvedScene,
} from "@/lib/companion/types";
import type { CountryRecovery } from "@/lib/types";
import CompanionCard from "./CompanionCard";
import CompanionMinimized from "./CompanionMinimized";
import PredictionCard from "./PredictionCard";
import StoryPlayer from "./StoryPlayer";

type CompanionMode = "hidden" | "minimized" | "prompt" | "story" | "prediction";

type Props = {
  context: CompanionContext;
  recoveries: CountryRecovery[];
  yearRange: [number, number];
  onCommand: (command: CompanionCommand) => void;
  /** Narrower than the command contract: only used for the brief
   * correct/incorrect pulse on a prediction reveal, cleared as soon as the
   * reveal is no longer current. */
  onReveal: (reveal: { iso3s: string[]; correct: boolean } | null) => void;
};

const INACTIVITY_MS = 45000;
const HERO_DWELL_MS = 2500;

function readSession(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage unavailable (private mode, etc.) — companion still
    // works within the page load, just without cross-reload gating.
  }
}

export default function DataCompanion({ context, recoveries, yearRange, onCommand, onReveal }: Props) {
  const [mode, setMode] = useState<CompanionMode>("hidden");
  const [prompt, setPrompt] = useState<CompanionPrompt | null>(null);
  const [hasNewPrompt, setHasNewPrompt] = useState(false);

  const [storyScenes, setStoryScenes] = useState<ResolvedScene[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);

  const [questions, setQuestions] = useState<PredictionQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<PredictionQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answerResult, setAnswerResult] = useState<PredictionAnswerResult | null>(null);
  const [askedIds, setAskedIds] = useState<string[]>(() => {
    const asked = readSession(COMPANION_SESSION_KEYS.lastPrediction);
    if (!asked) return [];
    try {
      return JSON.parse(asked);
    } catch {
      return [];
    }
  });

  const dismissedRef = useRef(readSession(COMPANION_SESSION_KEYS.dismissed) === "true");
  const shownExploreEntryRef = useRef(false);
  const previousSectionRef = useRef(context.activeSection);
  const previousCountryRef = useRef(context.selectedIso3);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- lazy-load the prediction question pool ------------------------
  useEffect(() => {
    let cancelled = false;
    fetch("/data/companion-questions.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.questions) setQuestions(data.questions);
      })
      .catch(() => {
        // Predictions simply won't be offered if the pool can't load —
        // never fabricate questions client-side.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showPrompt = useCallback((next: CompanionPrompt, issueCommand?: CompanionCommand) => {
    setPrompt(next);
    setMode("prompt");
    setHasNewPrompt(true);
    if (issueCommand) onCommand(issueCommand);
    trackCompanionEvent({ event: "companion_opened", metadata: { promptId: next.id } });
  }, [onCommand]);

  // ---- trigger: hero visible ------------------------------------------
  useEffect(() => {
    if (dismissedRef.current || readSession(COMPANION_SESSION_KEYS.started)) return;
    if (context.activeSection !== "overview") return;
    heroTimerRef.current = setTimeout(() => {
      if (dismissedRef.current || readSession(COMPANION_SESSION_KEYS.started)) return;
      const next = getContextualPrompt("hero-visible", context, recoveries);
      if (next) showPrompt(next);
    }, HERO_DWELL_MS);
    return () => {
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.activeSection]);

  // ---- trigger: entered explore ---------------------------------------
  useEffect(() => {
    const enteredExplore = previousSectionRef.current !== "explore" && context.activeSection === "explore";
    previousSectionRef.current = context.activeSection;
    if (!enteredExplore || shownExploreEntryRef.current) return;
    if (dismissedRef.current || mode === "story" || mode === "prediction") return;
    shownExploreEntryRef.current = true;
    const timer = setTimeout(() => {
      const next = getContextualPrompt("entered-explore", context, recoveries);
      if (next) showPrompt(next);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.activeSection]);

  // ---- trigger: country selected ---------------------------------------
  useEffect(() => {
    const changed = previousCountryRef.current !== context.selectedIso3;
    previousCountryRef.current = context.selectedIso3;
    if (!changed || !context.selectedIso3) return;
    if (dismissedRef.current || mode === "story" || mode === "prediction") return;
    const timer = setTimeout(() => {
      const next = getContextualPrompt("country-selected", context, recoveries);
      if (next) showPrompt(next);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.selectedIso3]);

  // ---- trigger: inactivity (once per session) ---------------------------
  useEffect(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (dismissedRef.current) return;
    if (readSession(COMPANION_SESSION_KEYS.mode) === "inactivity-shown") return;
    inactivityTimerRef.current = setTimeout(() => {
      if (dismissedRef.current || mode !== "hidden") return;
      if (readSession(COMPANION_SESSION_KEYS.mode) === "inactivity-shown") return;
      const next = getContextualPrompt("inactivity", context, recoveries);
      if (next) {
        showPrompt(next);
        writeSession(COMPANION_SESSION_KEYS.mode, "inactivity-shown");
      }
    }, INACTIVITY_MS);
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.activeSection, context.selectedIso3, context.year, context.lens, context.region, mode]);

  // ---- story lifecycle ---------------------------------------------------
  const startStory = useCallback(
    (sessionMode: CompanionSessionMode) => {
      const scenes = resolveStory(recoveries, yearRange[1], yearRange[1] >= 2019 ? 2019 : yearRange[0]);
      if (!scenes.length) return;
      setStoryScenes(scenes);
      setStoryIndex(0);
      setStoryPaused(false);
      setMode("story");
      setHasNewPrompt(false);
      onCommand(scenes[0].command);
      writeSession(COMPANION_SESSION_KEYS.started, sessionMode);
      writeSession(COMPANION_SESSION_KEYS.mode, sessionMode);
      trackCompanionEvent({ event: "story_started", metadata: { sceneCount: scenes.length } });
    },
    [recoveries, yearRange, onCommand],
  );

  const goToScene = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, storyScenes.length - 1));
      setStoryIndex(clamped);
      const scene = storyScenes[clamped];
      if (scene) {
        onCommand(scene.command);
        trackCompanionEvent({ event: "story_scene_completed", metadata: { sceneId: scene.id, index: clamped } });
      }
    },
    [storyScenes, onCommand],
  );

  const exitStory = useCallback(() => {
    // Minimized, not hidden — exiting mid-story shouldn't strand the
    // visitor with no way back in short of a page reload.
    setMode("minimized");
    onCommand({ type: "CLEAR_SPOTLIGHT" });
  }, [onCommand]);

  // ---- prediction lifecycle ----------------------------------------------
  const startPrediction = useCallback(
    (sessionMode: CompanionSessionMode) => {
      if (!questions.length) return;
      const next = pickNextQuestion(questions, askedIds);
      if (!next) return;
      setCurrentQuestion(next);
      setSelectedOptionId(null);
      setRevealed(false);
      setAnswerResult(null);
      onReveal(null);
      setMode("prediction");
      setHasNewPrompt(false);
      writeSession(COMPANION_SESSION_KEYS.started, sessionMode);
      writeSession(COMPANION_SESSION_KEYS.mode, sessionMode);
    },
    [questions, askedIds, onReveal],
  );

  const handleAnswerSelect = useCallback(
    (optionId: string) => {
      if (!currentQuestion || selectedOptionId) return;
      setSelectedOptionId(optionId);
      const correct = validateAnswer(currentQuestion, optionId);
      const nextAsked = Array.from(new Set([...askedIds, currentQuestion.id]));
      setAskedIds(nextAsked);
      writeSession(COMPANION_SESSION_KEYS.lastPrediction, JSON.stringify(nextAsked));
      window.setTimeout(() => {
        onCommand(currentQuestion.command);
        const result: PredictionAnswerResult = {
          question: currentQuestion,
          selectedOptionId: optionId,
          correct,
          explanation: getPredictionExplanation(correct, currentQuestion.rationale),
        };
        setAnswerResult(result);
        setRevealed(true);
        onReveal({ iso3s: currentQuestion.highlightIso3s, correct });
        trackCompanionEvent({ event: "prediction_answered", metadata: { questionId: currentQuestion.id, correct } });
      }, 550);
    },
    [currentQuestion, selectedOptionId, askedIds, onCommand, onReveal],
  );

  // ---- action chip dispatch ----------------------------------------------
  const handleAction = useCallback(
    (actionId: CompanionActionId) => {
      trackCompanionEvent({ event: "companion_action_clicked", metadata: { actionId } });

      switch (actionId) {
        case "guide-me":
          startStory("guided");
          return;
        case "give-challenge":
          startPrediction("challenge");
          return;
        case "explore-myself":
          writeSession(COMPANION_SESSION_KEYS.started, "explore");
          setMode("minimized");
          return;

        case "show-contrast":
          onCommand({ type: "SET_VIEW", section: "explore", lens: "thrive-feel", region: "All regions" });
          setMode("minimized");
          return;
        case "how-to-read":
          showPrompt({
            id: "how-to-read",
            message:
              "Each bubble is a country. Its position shows how far it moved on the two signals shown. The faint ring marks its 2019 starting point; the line traces the path to today.",
            actions: [{ id: "continue-exploring", label: "Got it" }],
          });
          return;
        case "hide-guide":
          setMode("minimized");
          return;

        case "compare-region": {
          if (!context.selectedIso3) return;
          const recovery = recoveries.find((r) => r.iso3 === context.selectedIso3);
          if (!recovery) return;
          showPrompt({
            id: `region-${recovery.region}`,
            message: getRegionalInsight(recovery.region, recoveries),
            actions: [
              { id: "see-another-contrast", label: "See another contrast" },
              { id: "continue-exploring", label: "Continue exploring" },
            ],
          });
          return;
        }
        case "see-another-contrast": {
          const withPath = recoveries.filter((r) => r.recoveryPath === "prosperity-without-healing");
          if (!withPath.length) return;
          const pick = withPath[Math.floor(withPath.length / 2)];
          onCommand({ type: "SET_VIEW", lens: "thrive-feel", selectedIso3: pick.iso3, spotlightIso3s: [pick.iso3] });
          showPrompt({
            id: `country-${pick.iso3}`,
            message: getSelectedCountryInsight(pick),
            actions: [
              { id: "compare-region", label: "Compare with region" },
              { id: "see-another-contrast", label: "See another contrast" },
              { id: "continue-exploring", label: "Continue exploring" },
            ],
          });
          return;
        }
        case "continue-exploring":
          setMode("minimized");
          return;

        case "story-next":
          if (storyIndex >= storyScenes.length - 1) {
            writeSession(COMPANION_SESSION_KEYS.completedStory, "true");
            showPrompt({
              id: "story-complete",
              message: "That's the guided journey. Want to test what you noticed, or keep exploring on your own?",
              actions: [
                { id: "give-challenge", label: "Try a prediction" },
                { id: "explore-myself", label: "Explore myself" },
              ],
            });
            return;
          }
          goToScene(storyIndex + 1);
          return;
        case "story-prev":
          goToScene(storyIndex - 1);
          return;
        case "story-pause":
          setStoryPaused(true);
          return;
        case "story-resume":
          setStoryPaused(false);
          return;
        case "story-exit":
          exitStory();
          return;
        case "story-restart":
          goToScene(0);
          setStoryPaused(false);
          return;

        case "prediction-show-another":
          startPrediction((readSession(COMPANION_SESSION_KEYS.mode) as CompanionSessionMode) ?? "challenge");
          return;
        case "prediction-explore-country":
          if (answerResult) onCommand({ type: "SET_VIEW", selectedIso3: answerResult.question.highlightIso3s[0] });
          setMode("minimized");
          return;
        case "prediction-continue-story":
          if (storyScenes.length) {
            setMode("story");
          } else {
            setMode("minimized");
          }
          return;

        case "dismiss":
          dismissedRef.current = true;
          writeSession(COMPANION_SESSION_KEYS.dismissed, "true");
          trackCompanionEvent({ event: "companion_dismissed", metadata: {} });
          setMode("hidden");
          return;
        case "minimize":
          setMode("minimized");
          return;
        default:
          return;
      }
    },
    [
      context.selectedIso3,
      recoveries,
      onCommand,
      showPrompt,
      startStory,
      startPrediction,
      storyIndex,
      storyScenes,
      goToScene,
      exitStory,
      answerResult,
    ],
  );

  const handleExpand = useCallback(() => {
    setMode(prompt ? "prompt" : "minimized");
    setHasNewPrompt(false);
  }, [prompt]);

  // Clear any prediction-reveal pulse once we leave prediction mode.
  useEffect(() => {
    if (mode !== "prediction") onReveal(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (mode === "hidden") return null;

  return (
    <div className="companion-root">
      {mode === "minimized" && <CompanionMinimized onExpand={handleExpand} hasNewPrompt={hasNewPrompt} />}
      {mode === "prompt" && prompt && (
        <CompanionCard
          prompt={prompt}
          onAction={handleAction}
          onMinimize={() => handleAction("minimize")}
          onDismiss={() => handleAction("dismiss")}
        />
      )}
      {mode === "story" && storyScenes.length > 0 && (
        <StoryPlayer
          scenes={storyScenes}
          index={storyIndex}
          isPaused={storyPaused}
          onNext={() => handleAction("story-next")}
          onPrev={() => handleAction("story-prev")}
          onTogglePause={() => handleAction(storyPaused ? "story-resume" : "story-pause")}
          onExit={() => handleAction("story-exit")}
          onRestart={() => handleAction("story-restart")}
        />
      )}
      {mode === "prediction" && currentQuestion && (
        <PredictionCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          revealed={revealed}
          result={answerResult}
          onSelectOption={handleAnswerSelect}
          onAction={handleAction}
          onExit={() => setMode("minimized")}
        />
      )}
    </div>
  );
}
