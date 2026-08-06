type Props = {
  onExpand: () => void;
  hasNewPrompt: boolean;
};

export default function CompanionMinimized({ onExpand, hasNewPrompt }: Props) {
  return (
    <button type="button" className={`companion-minimized${hasNewPrompt ? " has-pulse" : ""}`} onClick={onExpand}>
      <span className="companion-minimized-dot" aria-hidden="true" />
      Atlas Guide
    </button>
  );
}
