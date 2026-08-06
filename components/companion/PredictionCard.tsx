import type { CompanionActionId, PredictionAnswerResult, PredictionQuestion } from "@/lib/companion/types";
import CompanionActions from "./CompanionActions";

type Props = {
  question: PredictionQuestion;
  selectedOptionId: string | null;
  revealed: boolean;
  result: PredictionAnswerResult | null;
  onSelectOption: (optionId: string) => void;
  onAction: (id: CompanionActionId) => void;
  onExit: () => void;
};

export default function PredictionCard({ question, selectedOptionId, revealed, result, onSelectOption, onAction, onExit }: Props) {
  const locked = selectedOptionId !== null;

  return (
    <div className="companion-card prediction-card" role="status" aria-live="polite">
      <div className="companion-card-head">
        <span className="companion-label">Atlas Guide · Predict</span>
        <div className="companion-card-controls">
          <button type="button" onClick={onExit} aria-label="Exit prediction">
            ×
          </button>
        </div>
      </div>
      <p className="companion-message">{question.question}</p>
      <div className="prediction-options" role="group" aria-label="Answer options">
        {question.options.map((option) => {
          const isSelected = option.id === selectedOptionId;
          const isCorrectOption = option.id === question.correctOptionId;
          const showCorrectness = revealed && (isSelected || isCorrectOption);
          return (
            <button
              key={option.id}
              type="button"
              className={`prediction-option${isSelected ? " is-selected" : ""}${showCorrectness ? (isCorrectOption ? " is-correct" : " is-incorrect") : ""}`}
              disabled={locked}
              aria-pressed={isSelected}
              onClick={() => onSelectOption(option.id)}
            >
              <span>{option.label}</span>
              {showCorrectness && <span className="prediction-option-tag">{isCorrectOption ? "Correct answer" : "Your answer"}</span>}
            </button>
          );
        })}
      </div>
      {revealed && result && (
        <div className="prediction-reveal" role="status">
          <p className={`prediction-verdict${result.correct ? " is-correct" : " is-incorrect"}`}>
            {result.correct ? "Correct" : "Not quite"}
          </p>
          <p className="prediction-explanation">{result.explanation}</p>
          <CompanionActions
            actions={[
              { id: "prediction-explore-country", label: "Explore this country" },
              { id: "prediction-show-another", label: "Show another" },
              { id: "prediction-continue-story", label: "Continue" },
            ]}
            onAction={onAction}
          />
        </div>
      )}
    </div>
  );
}
