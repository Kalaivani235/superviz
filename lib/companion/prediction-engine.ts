import type { PredictionQuestion } from "./types";

/** Picks the next question the visitor hasn't seen yet this session,
 * cycling back to the start once every question has been shown. Pure
 * function — session bookkeeping (which ids were shown) lives in the
 * caller via sessionStorage, not here. */
export function pickNextQuestion(pool: PredictionQuestion[], askedIds: string[]): PredictionQuestion | null {
  if (!pool.length) return null;
  const unseen = pool.filter((q) => !askedIds.includes(q.id));
  if (unseen.length > 0) return unseen[0];
  return pool[0];
}

export function validateAnswer(question: PredictionQuestion, selectedOptionId: string): boolean {
  return selectedOptionId === question.correctOptionId;
}
