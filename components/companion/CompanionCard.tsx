import type { CompanionActionId, CompanionPrompt } from "@/lib/companion/types";
import CompanionActions from "./CompanionActions";

type Props = {
  prompt: CompanionPrompt;
  onAction: (id: CompanionActionId) => void;
  onMinimize: () => void;
};

export default function CompanionCard({ prompt, onAction, onMinimize }: Props) {
  return (
    <div className="companion-card" role="status" aria-live="polite">
      <div className="companion-card-head">
        <span className="companion-label">Atlas Guide</span>
        <div className="companion-card-controls">
          <button type="button" onClick={onMinimize} aria-label="Minimize guide">
            −
          </button>
        </div>
      </div>
      <p className="companion-message">{prompt.message}</p>
      <CompanionActions actions={prompt.actions} onAction={onAction} />
    </div>
  );
}
