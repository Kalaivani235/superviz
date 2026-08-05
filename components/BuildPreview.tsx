import SectionHeading from "./SectionHeading";

const cards = [
  { number: "01", title: "Global recovery paths", copy: "Expand validated country coverage and reveal regional patterns without reducing recovery to a single score." },
  { number: "02", title: "Country comparison", copy: "Place two countries side by side to see where economic, physical, digital and emotional recovery diverged." },
  { number: "03", title: "Transparent methodology", copy: "Trace every indicator to its source, year and transformation—with GenAI use documented and calculations reviewable." },
];

export default function BuildPreview() {
  return (
    <section className="build-preview section-shell" aria-labelledby="build-title">
      <SectionHeading eyebrow="04 · The next chapter" title="From pilot to full experience" description="This prototype establishes the story. The contest entry will deepen the evidence." />
      <div className="preview-grid">
        {cards.map((card) => (
          <article className="preview-card" key={card.number}>
            <span>{card.number}</span><h3>{card.title}</h3><p>{card.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
