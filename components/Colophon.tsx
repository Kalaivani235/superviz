const STACK: { label: string; items: string }[] = [
  { label: "Framework", items: "Next.js 16 · React 19 · TypeScript" },
  { label: "Styling", items: "Hand-authored CSS · Tailwind reset" },
  { label: "Visualization", items: "ECharts 6 · Framer Motion" },
  { label: "Data", items: "World Bank API · World Happiness Report" },
  { label: "Testing", items: "Vitest · ESLint" },
  { label: "Hosting", items: "Vercel" },
];

export default function Colophon() {
  return (
    <section className="colophon section-shell" aria-labelledby="colophon-title">
      <p className="eyebrow">Colophon</p>
      <h2 id="colophon-title" className="colophon-title">
        Built with
      </h2>

      <div className="colophon-grid">
        {STACK.map((entry) => (
          <div key={entry.label}>
            <p className="colophon-label">{entry.label}</p>
            <p className="colophon-items">{entry.items}</p>
          </div>
        ))}
      </div>

      <div className="colophon-author">
        <div>
          <p className="colophon-label">Author</p>
          <p className="colophon-author-name">
            Kalaivani Ramanathan <span>@kalairam</span>
          </p>
          <p className="colophon-author-role">Business Analyst</p>
        </div>
        <a className="colophon-link" href="mailto:kalairam@amazon.com">
          Email
        </a>
      </div>
    </section>
  );
}
