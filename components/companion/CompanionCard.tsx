import type { CompanionActionId, CompanionPrompt } from "@/lib/companion/types";
import AtlasAvatar, { type AtlasAvatarState } from "./AtlasAvatar";
import CompanionActions from "./CompanionActions";

type Props = {
  prompt: CompanionPrompt;
  onAction: (id: CompanionActionId) => void;
  onMinimize: () => void;
};

// Derived from the prompt id rather than a separate piece of state — an
// "atlas-discovery-*" prompt just noticed something, an "atlas-reveal-*"
// prompt is delivering the evidence, everything else is idle chatter.
function avatarStateFor(promptId: string): AtlasAvatarState {
  if (promptId.startsWith("atlas-discovery")) return "noticed";
  if (promptId.startsWith("atlas-reveal")) return "reveal";
  return "idle";
}

export default function CompanionCard({ prompt, onAction, onMinimize }: Props) {
  return (
    <div className="companion-card" role="status" aria-live="polite">
      <div className="companion-card-head">
        <span className="companion-label">
          <AtlasAvatar state={avatarStateFor(prompt.id)} size={26} />
          Atlas Guide
        </span>
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
