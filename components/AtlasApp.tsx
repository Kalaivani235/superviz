"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { aggregateHeadlineMetrics, datasetYearRange, deriveCountryRecovery } from "@/lib/calculations";
import { LENSES, NAV_SECTIONS, REGION_ORDER } from "@/lib/constants";
import { shortRegionLabel } from "@/lib/formatting";
import type { CompanionCommand, CompanionContext } from "@/lib/companion/types";
import type { LensKey } from "@/lib/types";
import { useAtlasData } from "@/lib/useAtlasData";
import DataCompanion from "./companion/DataCompanion";
import BackToTop from "./BackToTop";
import Colophon from "./Colophon";
import ComparePanel from "./ComparePanel";
import CountryPanel from "./CountryPanel";
import Header from "./Header";
import Hero from "./Hero";
import Methodology from "./Methodology";
import RecoveryOrbit from "./RecoveryOrbit";
import SectionHeading from "./SectionHeading";
import StatusScreen from "./StatusScreen";
import StoriesSection from "./StoriesSection";

export default function AtlasApp() {
  const state = useAtlasData();
  const dataset = state.status === "ready" ? state.data.dataset : null;

  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [hoveredIso3, setHoveredIso3] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [lens, setLens] = useState<LensKey>("thrive-feel");
  const [region, setRegion] = useState("All regions");
  const [activeSection, setActiveSection] = useState("overview");
  const [storySpotlight, setStorySpotlight] = useState<string[] | null>(null);
  const [predictionReveal, setPredictionReveal] = useState<{ iso3s: string[]; correct: boolean } | null>(null);

  // Manual country selection (search, clicking a bubble, the keyboard list)
  // always clears any active companion spotlight — picking a country
  // yourself means you've left "look at this" mode. Companion-driven
  // selection goes through handleCompanionCommand instead, which does not
  // clear the spotlight it may be setting in the same command.
  const selectCountry = useCallback((iso3: string) => {
    setSelectedIso3(iso3);
    setStorySpotlight(null);
  }, []);

  const recoveries = useMemo(() => (dataset ? dataset.countries.map(deriveCountryRecovery) : []), [dataset]);
  const yearRange = useMemo(
    () => (dataset ? datasetYearRange(dataset.countries, ["live", "thrive", "connect", "feel"]) : ([2019, 2019] as [number, number])),
    [dataset],
  );

  // Defaults derived from the loaded dataset rather than synced via an effect,
  // so the first render already has a valid selection with no extra re-render.
  const effectiveSelectedIso3 =
    selectedIso3 ?? (dataset ? dataset.countries.find((c) => c.iso3 === "BRA")?.iso3 ?? dataset.countries[0]?.iso3 ?? null : null);
  const effectiveYear = year ?? yearRange[1];

  const scrollToSection = useCallback((id: string) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, []);

  // The companion never touches visualization state directly — it only
  // ever issues one of these commands, which is why this is the single
  // place SET_VIEW etc. are translated into AtlasApp's own setters.
  const handleCompanionCommand = useCallback(
    (command: CompanionCommand) => {
      switch (command.type) {
        case "SET_VIEW":
          if (command.lens) setLens(command.lens);
          if (command.region) setRegion(command.region);
          if (command.year !== undefined) setYear(command.year);
          if (command.selectedIso3) setSelectedIso3(command.selectedIso3);
          if (command.spotlightIso3s) setStorySpotlight(command.spotlightIso3s);
          if (command.section) scrollToSection(command.section);
          break;
        case "CLEAR_SPOTLIGHT":
          setStorySpotlight(null);
          break;
        case "SCROLL_TO_SECTION":
          scrollToSection(command.section);
          break;
      }
    },
    [scrollToSection],
  );

  useEffect(() => {
    if (!dataset) return;
    const sections = NAV_SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.1, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [dataset]);

  if (state.status === "loading" || !dataset || effectiveSelectedIso3 === null) {
    return <StatusScreen kind="loading" />;
  }
  if (state.status === "error") {
    return <StatusScreen kind="error" message={state.message} />;
  }

  const { metadata, coverage, stories } = state.data;
  const selectedRecovery = recoveries.find((r) => r.iso3 === effectiveSelectedIso3) ?? recoveries[0];
  const activeLens = LENSES.find((l) => l.key === lens) ?? LENSES[0];
  const countryA = compareA ? dataset.countries.find((c) => c.iso3 === compareA) ?? null : null;
  const countryB = compareB ? dataset.countries.find((c) => c.iso3 === compareB) ?? null : null;
  const availableRegions = [
    "All regions",
    ...REGION_ORDER.filter((r) => dataset.countries.some((c) => c.region === r)),
  ];

  const companionContext: CompanionContext = {
    activeSection,
    lens,
    region,
    year: effectiveYear,
    selectedIso3: effectiveSelectedIso3,
    selectedCountryName: selectedRecovery?.country,
    storySpotlight,
  };

  return (
    <main>
      <a className="skip-link" href="#overview">
        Skip to main content
      </a>
      <Header activeSection={activeSection} onNavigate={scrollToSection} countries={dataset.countries} onSelectCountry={selectCountry} />

      <Hero
        countryCount={coverage.totalCountries}
        regionCount={coverage.regions.length}
        yearRange={yearRange}
        baselineYear={dataset.baselineYear}
        metrics={aggregateHeadlineMetrics(recoveries)}
        onExplore={() => scrollToSection("explore")}
      />

      <section id="explore" className="explore section-shell" aria-labelledby="explore-title">
        <SectionHeading
          eyebrow="Explore"
          title="The Recovery Orbit"
          description="Every bubble traces one country's path from its 2019 baseline to the selected year. Switch the lens to compare different signals."
        />
        <div className="explore-toolbar">
          <div className="lens-switch" role="group" aria-label="Choose comparison lens">
            {LENSES.map((l) => (
              <button key={l.key} type="button" className={l.key === lens ? "is-active" : ""} aria-pressed={l.key === lens} onClick={() => setLens(l.key)}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="region-filter">
            <label htmlFor="region-select">Region</label>
            <select id="region-select" value={region} onChange={(event) => setRegion(event.target.value)}>
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {shortRegionLabel(r)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="reset-view"
            onClick={() => {
              setRegion("All regions");
              setLens("thrive-feel");
              setYear(yearRange[1]);
              setHoveredIso3(null);
              setStorySpotlight(null);
              setPredictionReveal(null);
            }}
          >
            Reset view
          </button>
        </div>

        <RecoveryOrbit
          countries={dataset.countries}
          lens={activeLens}
          year={effectiveYear}
          region={region}
          selectedIso3={effectiveSelectedIso3}
          hoveredIso3={hoveredIso3}
          compareIso3={countryB?.iso3 ?? null}
          spotlightIso3s={storySpotlight}
          revealHighlight={predictionReveal}
          onSelect={selectCountry}
          onHover={setHoveredIso3}
        />

        {selectedRecovery && (
          <CountryPanel recovery={selectedRecovery} allRecoveries={recoveries} yearRange={yearRange} sources={metadata.sources} />
        )}
      </section>

      <section id="compare" className="compare section-shell" aria-labelledby="compare-title">
        <SectionHeading
          eyebrow="Compare"
          title="Two countries, side by side"
          description="Compare all four dimensions at once, aligned to the same baseline and year."
        />
        <ComparePanel
          countries={dataset.countries}
          countryA={countryA}
          countryB={countryB}
          year={effectiveYear}
          onSelectA={setCompareA}
          onSelectB={setCompareB}
          onSwap={() => {
            setCompareA(compareB);
            setCompareB(compareA);
          }}
          onClear={() => {
            setCompareA(null);
            setCompareB(null);
          }}
        />
      </section>

      <StoriesSection stories={stories.stories} recoveries={recoveries} />

      <Methodology metadata={metadata} coverage={coverage} />

      <section className="closing section-shell" aria-labelledby="closing-title">
        <div className="closing-orbit" aria-hidden="true" />
        <p className="eyebrow">A closing thought</p>
        <h2 id="closing-title">RECOVERY IS NOT A DATE.</h2>
        <p>
          It is the distance between what returned
          <br />
          and what did not.
        </p>
        <div className="signal-line" aria-label="Live, thrive, connect, feel">
          <span>LIVE</span>
          <i /> <span>THRIVE</span>
          <i /> <span>CONNECT</span>
          <i /> <span>FEEL</span>
        </div>
      </section>

      <Colophon />

      <footer className="site-footer section-shell">
        <div>
          <strong>Recovery Atlas</strong>
          <span>
            {coverage.totalCountries} economies · {yearRange[0]}–{yearRange[1]} · data refreshed{" "}
            {dataset.refreshDate}
          </span>
        </div>
        <div className="footer-links">
          <a href="https://data.worldbank.org/" target="_blank" rel="noreferrer">
            World Bank<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href="https://www.worldhappiness.report/" target="_blank" rel="noreferrer">
            World Happiness Report<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <span>Built with Next.js</span>
        </div>
      </footer>

      <DataCompanion
        context={companionContext}
        recoveries={recoveries}
        yearRange={yearRange}
        onCommand={handleCompanionCommand}
        onReveal={setPredictionReveal}
      />

      <BackToTop />
    </main>
  );
}
