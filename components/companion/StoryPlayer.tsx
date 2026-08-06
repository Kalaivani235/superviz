"use client";

import { useEffect } from "react";
import type { ResolvedScene } from "@/lib/companion/types";
import StoryProgress from "./StoryProgress";

const AUTO_ADVANCE_MS = 8000;

type Props = {
  scenes: ResolvedScene[];
  index: number;
  isPaused: boolean;
  onNext: () => void;
  onPrev: () => void;
  onTogglePause: () => void;
  onExit: () => void;
  onRestart: () => void;
};

export default function StoryPlayer({ scenes, index, isPaused, onNext, onPrev, onTogglePause, onExit, onRestart }: Props) {
  const scene = scenes[index];
  const isLast = index >= scenes.length - 1;

  useEffect(() => {
    if (isPaused || isLast) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(onNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isPaused, isLast]);

  if (!scene) return null;

  return (
    <div className="companion-card story-player" role="status" aria-live="polite">
      <div className="companion-card-head">
        <span className="companion-label">Atlas Guide · Guided story</span>
        <div className="companion-card-controls">
          <button type="button" onClick={onExit} aria-label="Exit guided story">
            ×
          </button>
        </div>
      </div>
      <StoryProgress total={scenes.length} current={index} />
      <h3 className="story-player-title">{scene.title}</h3>
      <p className="companion-message">{scene.narrative}</p>
      <div className="story-player-controls">
        <button type="button" onClick={onPrev} disabled={index === 0}>
          ← Previous
        </button>
        <button type="button" onClick={onTogglePause}>
          {isPaused ? "▶ Resume" : "❚❚ Pause"}
        </button>
        <button type="button" onClick={onRestart}>
          ↺ Restart
        </button>
        <button type="button" onClick={onNext} disabled={isLast}>
          Next →
        </button>
      </div>
    </div>
  );
}
