import type { CountryRecovery, Story } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import StoryFlipCard from "./StoryFlipCard";

type Props = {
  stories: Story[];
  recoveries: CountryRecovery[];
};

export default function StoriesSection({ stories, recoveries }: Props) {
  const countryName = (iso3: string) => recoveries.find((c) => c.iso3 === iso3)?.country ?? iso3;

  return (
    <section id="stories" className="stories section-shell" aria-labelledby="stories-title">
      <SectionHeading
        eyebrow="Stories"
        title="What the data reveals"
        description="Every story below is generated from the final dataset — not written first and matched to numbers afterward. Click a card to flip it and see the chart behind it."
      />
      {stories.length ? (
        <div className="stories-grid">
          {stories.map((story) => (
            <StoryFlipCard key={story.id} story={story} recoveries={recoveries} countryName={countryName} />
          ))}
        </div>
      ) : (
        <p className="chart-empty">No stories could be generated from the current dataset.</p>
      )}
    </section>
  );
}
