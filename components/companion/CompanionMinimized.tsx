import AtlasAvatar from "./AtlasAvatar";

type Props = {
  onExpand: () => void;
  hasNewPrompt: boolean;
};

export default function CompanionMinimized({ onExpand, hasNewPrompt }: Props) {
  return (
    <button type="button" className={`companion-minimized${hasNewPrompt ? " has-pulse" : ""}`} onClick={onExpand}>
      <AtlasAvatar state={hasNewPrompt ? "noticed" : "idle"} size={28} />
      Atlas Guide
    </button>
  );
}
