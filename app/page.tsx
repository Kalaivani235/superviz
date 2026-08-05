import DataStory from "@/components/DataStory";
import BuildPreview from "@/components/BuildPreview";
import Hero from "@/components/Hero";
import Methodology from "@/components/Methodology";
import RecoveryTimeline from "@/components/RecoveryTimeline";
import pilotData from "@/data/pilot-countries.json";
import sourcesData from "@/data/sources.json";
import { deriveCountryRecovery } from "@/lib/calculations";
import type { DataSource, Dataset } from "@/lib/types";
import { validateDataset } from "@/lib/validation";

export default function Home() {
  const dataset = pilotData as Dataset;
  const issues = validateDataset(dataset);
  const recoveries = dataset.countries.map(deriveCountryRecovery);

  return (
    <main>
      <a className="skip-link" href="#story">Skip to the data story</a>
      <Hero />
      <div id="story">
        <RecoveryTimeline />
        <DataStory recoveries={recoveries} dataMode={dataset.mode} validationIssues={issues.length} />
        <BuildPreview />
        <Methodology
          sources={sourcesData as DataSource[]}
          mode={dataset.mode}
          refreshDate={dataset.refreshDate}
        />
      </div>
      <section className="closing section-shell" aria-labelledby="closing-title">
        <div className="closing-orbit" aria-hidden="true" />
        <p className="eyebrow">A closing thought</p>
        <h2 id="closing-title">RECOVERY IS NOT A DATE.</h2>
        <p>It is the distance between what returned<br />and what did not.</p>
        <div className="signal-line" aria-label="Live, thrive, connect, feel">
          <span>LIVE</span><i /> <span>THRIVE</span><i /> <span>CONNECT</span><i /> <span>FEEL</span>
        </div>
      </section>
      <footer className="site-footer section-shell">
        <div>
          <strong>The World Reopened. Did Life Recover?</strong>
          <span>Public prototype · Demonstration data</span>
        </div>
        <div className="footer-links">
          <a href="https://data.worldbank.org/" target="_blank" rel="noreferrer">World Bank<span className="sr-only"> (opens in a new tab)</span></a>
          <a href="https://www.worldhappiness.report/" target="_blank" rel="noreferrer">World Happiness Report<span className="sr-only"> (opens in a new tab)</span></a>
          <span>Built with Next.js</span>
        </div>
      </footer>
    </main>
  );
}
