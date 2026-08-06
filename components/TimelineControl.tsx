"use client";

import { useEffect, useRef } from "react";

type Props = {
  year: number;
  yearRange: [number, number];
  baselineYear: number;
  isPlaying: boolean;
  onChangeYear: (year: number) => void;
  onTogglePlay: () => void;
};

export default function TimelineControl({ year, yearRange, baselineYear, isPlaying, onChangeYear, onTogglePlay }: Props) {
  const [minYear, maxYear] = yearRange;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      onChangeYear(year >= maxYear ? minYear : year + 1);
    }, 1100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, year, minYear, maxYear]);

  return (
    <div className="timeline-control" role="group" aria-label="Year timeline">
      <div className="timeline-control-row">
        <button type="button" className="timeline-play" onClick={onTogglePlay} aria-pressed={isPlaying}>
          {isPlaying ? (
            <>
              <span aria-hidden="true">❚❚</span> Pause
            </>
          ) : (
            <>
              <span aria-hidden="true">▶</span> Play
            </>
          )}
        </button>
        <button type="button" className="timeline-reset" onClick={() => onChangeYear(baselineYear)}>
          Reset to {baselineYear}
        </button>
        <output className="timeline-year" htmlFor="timeline-slider">
          {year}
        </output>
      </div>
      <input
        id="timeline-slider"
        type="range"
        min={minYear}
        max={maxYear}
        step={1}
        value={year}
        onChange={(event) => onChangeYear(Number(event.target.value))}
        aria-valuetext={`${year}`}
      />
      <div className="timeline-scale" aria-hidden="true">
        <span>{minYear}</span>
        <span>{baselineYear} baseline</span>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}
