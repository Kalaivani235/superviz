export type AtlasAvatarState = "idle" | "noticed" | "thinking" | "reveal" | "celebrate";

type Props = {
  state?: AtlasAvatarState;
  size?: number;
};

export default function AtlasAvatar({ state = "idle", size = 32 }: Props) {
  const happy = state === "celebrate";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={`atlas-avatar atlas-avatar--${state}`}
    >
      <ellipse cx="48" cy="50" rx="32" ry="11" className="atlas-avatar-ring" transform="rotate(-18 48 50)" />
      <circle cx="48" cy="48" r="23" className="atlas-avatar-head" />
      {happy ? (
        <>
          <path d="M36 44 Q40 40 44 44" className="atlas-avatar-eye atlas-avatar-eye--happy" />
          <path d="M52 44 Q56 40 60 44" className="atlas-avatar-eye atlas-avatar-eye--happy" />
        </>
      ) : (
        <>
          <circle cx="40" cy="48" r="3" className="atlas-avatar-eye" />
          <circle cx="56" cy="48" r="3" className="atlas-avatar-eye" />
        </>
      )}
      {(state === "noticed" || state === "celebrate") && (
        <path d="M67 27 L69 32 L74 34 L69 36 L67 41 L65 36 L60 34 L65 32 Z" className="atlas-avatar-sparkle" />
      )}
      {state === "thinking" && (
        <>
          <circle cx="76" cy="34" r="2" className="atlas-avatar-dot atlas-avatar-dot--1" />
          <circle cx="82" cy="40" r="2" className="atlas-avatar-dot atlas-avatar-dot--2" />
          <circle cx="86" cy="47" r="2" className="atlas-avatar-dot atlas-avatar-dot--3" />
        </>
      )}
    </svg>
  );
}
