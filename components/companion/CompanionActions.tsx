import type { CompanionAction, CompanionActionId } from "@/lib/companion/types";

type Props = {
  actions: CompanionAction[];
  onAction: (id: CompanionActionId) => void;
};

export default function CompanionActions({ actions, onAction }: Props) {
  if (!actions.length) return null;
  return (
    <div className="companion-actions" role="group" aria-label="Guide options">
      {actions.map((action) => (
        <button key={action.id} type="button" onClick={() => onAction(action.id)}>
          {action.label}
        </button>
      ))}
    </div>
  );
}
