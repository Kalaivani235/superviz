import { METRIC_LABELS } from "@/lib/constants";
import type { CountryRecovery, Story } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import StoryChart from "./StoryChart";

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
        description="Every story below is generated from the final dataset — not written first and matched to numbers afterward."
      />
      {stories.length ? (
        <div className="stories-grid">
          {stories.map((story) => (
            <article className="story-card" key={story.id}>
              <p className="eyebrow">{story.metrics.map((m) => METRIC_LABELS[m]).join(" · ")}</p>
              <h3>{story.headline}</h3>
              <p>{story.insight}</p>
              <div className="story-meta">
                <span>{story.countries.slice(0, 4).map(countryName).join(", ")}{story.countries.length > 4 ? "…" : ""}</span>
                <span>{story.years.join("–")}</span>
              </div>
              <StoryChart story={story} recoveries={recoveries} />
            </article>
          ))}
        </div>
      ) : (
        <p className="chart-empty">No stories could be generated from the current dataset.</p>
      )}
    </section>
  );
}
