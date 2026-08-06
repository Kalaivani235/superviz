type Props = {
  total: number;
  current: number;
};

export default function StoryProgress({ total, current }: Props) {
  return (
    <div className="story-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index === current ? "is-active" : index < current ? "is-done" : ""} />
      ))}
      <span className="sr-only">
        Scene {current + 1} of {total}
      </span>
    </div>
  );
}
