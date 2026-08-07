"use client";

import { useRef, useState } from "react";
import { METRIC_LABELS } from "@/lib/constants";
import type { CountryRecovery, Story } from "@/lib/types";
import StoryChart from "./StoryChart";

type Props = {
  story: Story;
  recoveries: CountryRecovery[];
  countryName: (iso3: string) => string;
};

export default function StoryFlipCard({ story, recoveries, countryName }: Props) {
  const [flipped, setFlipped] = useState(false);
  const frontRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  const flipTo = (next: boolean) => {
    setFlipped(next);
    // Move focus off the face that's about to become aria-hidden — leaving
    // focus on a hidden element is an accessibility violation.
    (next ? backRef : frontRef).current?.focus();
  };

  return (
    <div className={`story-card-flip${flipped ? " is-flipped" : ""}`}>
      <div className="story-card-flip-inner">
        <button
          ref={frontRef}
          type="button"
          className="story-card story-card-face story-card-face--front"
          onClick={() => flipTo(true)}
          aria-expanded={flipped}
          aria-hidden={flipped}
          tabIndex={flipped ? -1 : 0}
        >
          <p className="eyebrow">{story.metrics.map((m) => METRIC_LABELS[m]).join(" · ")}</p>
          <p className="story-card-title">{story.headline}</p>
          <p>{story.insight}</p>
          <div className="story-meta">
            <span>
              {story.countries.slice(0, 4).map(countryName).join(", ")}
              {story.countries.length > 4 ? "…" : ""}
            </span>
            <span>{story.years.join("–")}</span>
          </div>
          <span className="story-card-flip-hint">See the chart →</span>
        </button>

        <button
          ref={backRef}
          type="button"
          className="story-card story-card-face story-card-face--back"
          onClick={() => flipTo(false)}
          aria-expanded={flipped}
          aria-hidden={!flipped}
          tabIndex={flipped ? 0 : -1}
        >
          <p className="eyebrow">{story.headline}</p>
          <StoryChart story={story} recoveries={recoveries} />
          <span className="story-card-flip-hint">← Back to the story</span>
        </button>
      </div>
    </div>
  );
}
