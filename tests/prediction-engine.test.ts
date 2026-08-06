import { describe, expect, it } from "vitest";
import { pickNextQuestion, validateAnswer } from "@/lib/companion/prediction-engine";
import type { PredictionQuestion } from "@/lib/companion/types";

function question(id: string, correctOptionId = "a"): PredictionQuestion {
  return {
    id,
    type: "country-choice",
    question: `Question ${id}`,
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    correctOptionId,
    rationale: "Because the data says so.",
    command: { type: "SET_VIEW" },
    highlightIso3s: [],
    sourceMetrics: ["thrive"],
    years: [2019, 2024],
  };
}

describe("pickNextQuestion", () => {
  const pool = [question("q1"), question("q2"), question("q3")];

  it("returns null for an empty pool", () => {
    expect(pickNextQuestion([], [])).toBeNull();
  });

  it("picks the first unseen question", () => {
    expect(pickNextQuestion(pool, [])?.id).toBe("q1");
    expect(pickNextQuestion(pool, ["q1"])?.id).toBe("q2");
  });

  it("cycles back to the start once every question has been seen", () => {
    expect(pickNextQuestion(pool, ["q1", "q2", "q3"])?.id).toBe("q1");
  });
});

describe("validateAnswer", () => {
  it("returns true only for the correct option", () => {
    const q = question("q1", "b");
    expect(validateAnswer(q, "b")).toBe(true);
    expect(validateAnswer(q, "a")).toBe(false);
  });
});
