// Transforms raw source data (data/raw/) into the frontend-ready Recovery Atlas
// dataset (public/data/*.json) plus processed/metadata artifacts for provenance.
// Run with: node scripts/transform-data.mjs

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "data/raw");
const PROCESSED_DIR = path.join(ROOT, "data/processed");
const METADATA_DIR = path.join(ROOT, "data/metadata");
const PUBLIC_DATA_DIR = path.join(ROOT, "public/data");

const BASELINE_YEAR = 2019;
const FEEL_BASELINE_WINDOW = [2017, 2019];
const FEEL_LATEST_WINDOW_START = 2022;
const TOP_N_COUNTRIES = 150;
const MIN_YEAR = 2015;

const SOURCES = {
  "world-bank-gdp": {
    id: "world-bank-gdp",
    name: "World Bank — GDP per capita (constant 2015 US$)",
    publisher: "World Bank, World Development Indicators",
    url: "https://data.worldbank.org/indicator/NY.GDP.PCAP.KD",
    indicatorCode: "NY.GDP.PCAP.KD",
    definition: "Gross domestic product divided by midyear population, in constant 2015 U.S. dollars, so growth reflects real economic output rather than inflation or exchange-rate movement.",
    unit: "constant 2015 US$ per person",
    license: "CC BY-4.0",
  },
  "world-bank-life": {
    id: "world-bank-life",
    name: "World Bank — Life expectancy at birth",
    publisher: "World Bank, World Development Indicators (UN Population Division)",
    url: "https://data.worldbank.org/indicator/SP.DYN.LE00.IN",
    indicatorCode: "SP.DYN.LE00.IN",
    definition: "Number of years a newborn would live if prevailing patterns of mortality at the time of birth stayed the same throughout its life.",
    unit: "years",
    license: "CC BY-4.0",
  },
  "world-bank-internet": {
    id: "world-bank-internet",
    name: "World Bank — Individuals using the Internet",
    publisher: "World Bank, World Development Indicators (ITU)",
    url: "https://data.worldbank.org/indicator/IT.NET.USER.ZS",
    indicatorCode: "IT.NET.USER.ZS",
    definition: "Share of the population that used the internet from any location in the last three months.",
    unit: "% of population",
    license: "CC BY-4.0",
  },
  "world-bank-population": {
    id: "world-bank-population",
    name: "World Bank — Population, total",
    publisher: "World Bank, World Development Indicators",
    url: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    indicatorCode: "SP.POP.TOTL",
    definition: "Total resident population, used only to scale visualization bubbles.",
    unit: "people",
    license: "CC BY-4.0",
  },
  "world-happiness": {
    id: "world-happiness",
    name: "World Happiness Report — Life evaluation (Cantril ladder)",
    publisher: "Wellbeing Research Centre / World Happiness Report, via Our World in Data",
    url: "https://ourworldindata.org/grapher/happiness-cantril-ladder",
    indicatorCode: "cantril-ladder-score",
    definition: "Average survey response to the Cantril ladder question, where 0 is the worst possible life a respondent can imagine for themselves and 10 is the best possible life.",
    unit: "Cantril ladder points (0–10)",
    license: "CC BY-4.0",
  },
};

async function loadJson(file) {
  return JSON.parse(await readFile(path.join(RAW_DIR, file), "utf-8"));
}

function buildIndicatorMap(rows) {
  const map = new Map();
  for (const row of rows) {
    if (row.value === null || row.value === undefined) continue;
    const iso3 = row.countryiso3code;
    if (!iso3) continue;
    const year = Number(row.date);
    if (!Number.isInteger(year)) continue;
    if (!map.has(iso3)) map.set(iso3, new Map());
    map.get(iso3).set(year, row.value);
  }
  return map;
}

function round(value, digits = 3) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function seriesFromMap(yearMap) {
  if (!yearMap) return [];
  return Array.from(yearMap.entries())
    .map(([year, value]) => ({ year, value: round(value) }))
    .sort((a, b) => a.year - b.year);
}

function mean(values) {
  if (!values.length) return null;
  return round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function directIndicatorSeries(yearMap, sourceId, unit) {
  const values = seriesFromMap(yearMap);
  const baselinePoint = values.find((point) => point.year === BASELINE_YEAR);
  const latestPoint = values.length ? values[values.length - 1] : null;
  return {
    unit,
    sourceId,
    values,
    baselineYear: BASELINE_YEAR,
    baselineValue: baselinePoint ? baselinePoint.value : null,
    latestYear: latestPoint ? latestPoint.year : null,
    latestValue: latestPoint ? latestPoint.value : null,
  };
}

function feelIndicatorSeries(yearMap, sourceId, unit) {
  const values = seriesFromMap(yearMap);
  const baselinePoints = values.filter(
    (point) => point.year >= FEEL_BASELINE_WINDOW[0] && point.year <= FEEL_BASELINE_WINDOW[1],
  );
  const latestPoints = values.filter((point) => point.year >= FEEL_LATEST_WINDOW_START);
  const latestYear = latestPoints.length ? latestPoints[latestPoints.length - 1].year : null;
  return {
    unit,
    sourceId,
    values,
    baselineYear: BASELINE_YEAR,
    baselineValue: mean(baselinePoints.map((p) => p.value)),
    baselineYears: baselinePoints.map((p) => p.year),
    latestYear,
    latestValue: mean(latestPoints.map((p) => p.value)),
    latestYears: latestPoints.map((p) => p.year),
  };
}

function hasAnyValue(series) {
  return series.values.length > 0;
}

// A series can't produce a baseline→latest change without both endpoints —
// that's what drives the "Insufficient data" recovery-path badge in the UI.
function hasComputableChange(series) {
  return series.baselineValue !== null && series.latestValue !== null;
}

async function main() {
  await mkdir(PROCESSED_DIR, { recursive: true });
  await mkdir(METADATA_DIR, { recursive: true });
  await mkdir(PUBLIC_DATA_DIR, { recursive: true });

  const rawCountries = await loadJson("wb-countries.json");
  const countryMeta = new Map();
  for (const entry of rawCountries) {
    if (!entry.region || entry.region.id === "NA" || entry.region.value === "Aggregates") continue;
    if (!entry.id) continue;
    countryMeta.set(entry.id, {
      iso3: entry.id,
      name: entry.name,
      region: entry.region.value.trim(),
      incomeGroup: (entry.incomeLevel?.value ?? "Not classified").trim(),
    });
  }

  const gdpMap = buildIndicatorMap(await loadJson("wb-gdp.json"));
  const lifeMap = buildIndicatorMap(await loadJson("wb-life.json"));
  const internetMap = buildIndicatorMap(await loadJson("wb-internet.json"));
  const populationMap = buildIndicatorMap(await loadJson("wb-population.json"));

  const happinessCsv = await readFile(path.join(RAW_DIR, "happiness-cantril-ladder.csv"), "utf-8");
  const happinessMap = new Map();
  const happinessLines = happinessCsv.trim().split("\n").slice(1);
  for (const line of happinessLines) {
    const [, code, year, value] = line.split(",");
    if (!code || !countryMeta.has(code)) continue;
    const numericValue = Number(value);
    const numericYear = Number(year);
    if (!Number.isFinite(numericValue) || !Number.isInteger(numericYear)) continue;
    if (numericYear < MIN_YEAR) continue;
    if (!happinessMap.has(code)) happinessMap.set(code, new Map());
    happinessMap.get(code).set(numericYear, numericValue);
  }

  const totalEconomies = countryMeta.size;
  let noUsableDataCount = 0;
  let insufficientSignalCount = 0;

  const countries = [];
  for (const [iso3, meta] of countryMeta) {
    const live = directIndicatorSeries(lifeMap.get(iso3), "world-bank-life", SOURCES["world-bank-life"].unit);
    const thrive = directIndicatorSeries(gdpMap.get(iso3), "world-bank-gdp", SOURCES["world-bank-gdp"].unit);
    const connect = directIndicatorSeries(internetMap.get(iso3), "world-bank-internet", SOURCES["world-bank-internet"].unit);
    const feel = feelIndicatorSeries(happinessMap.get(iso3), "world-happiness", SOURCES["world-happiness"].unit);

    if (![live, thrive, connect, feel].some(hasAnyValue)) {
      noUsableDataCount += 1;
      continue;
    }

    // Countries missing THRIVE, CONNECT or FEEL can never clear the
    // "Insufficient data" recovery-path badge, so they're dropped here
    // (before the population cut) rather than shown half-blank — the
    // population cut below then backfills with the next fully-covered
    // country so the atlas still lands on TOP_N_COUNTRIES.
    if (![thrive, connect, feel].every(hasComputableChange)) {
      insufficientSignalCount += 1;
      continue;
    }

    const populationSeries = seriesFromMap(populationMap.get(iso3));
    const latestPopulation = populationSeries.length ? populationSeries[populationSeries.length - 1] : null;

    countries.push({
      iso3,
      country: meta.name,
      region: meta.region,
      incomeGroup: meta.incomeGroup,
      population: latestPopulation ? Math.round(latestPopulation.value) : null,
      populationYear: latestPopulation ? latestPopulation.year : null,
      live,
      thrive,
      connect,
      feel,
    });
  }

  // Keep only the top N countries by population — the most defensible
  // objective proxy for global prominence available in the source data —
  // so the atlas stays focused on widely-recognized economies rather than
  // every micro-territory the World Bank tracks. Countries with no
  // population figure rank last and are excluded if the cut lands above them.
  const rankedByPopulation = [...countries].sort((a, b) => (b.population ?? -1) - (a.population ?? -1));
  const excludedByPopulationCap = Math.max(0, rankedByPopulation.length - TOP_N_COUNTRIES);
  const keptIso3 = new Set(rankedByPopulation.slice(0, TOP_N_COUNTRIES).map((c) => c.iso3));
  const topCountries = countries.filter((c) => keptIso3.has(c.iso3));
  topCountries.sort((a, b) => a.country.localeCompare(b.country));

  const now = new Date().toISOString().slice(0, 10);
  const dataset = {
    mode: "validated",
    dataAsOf: now,
    refreshDate: now,
    baselineYear: BASELINE_YEAR,
    countries: topCountries,
  };

  await writeFile(path.join(PROCESSED_DIR, "dataset.json"), JSON.stringify(dataset, null, 2));
  await writeFile(path.join(PUBLIC_DATA_DIR, "countries.json"), JSON.stringify(dataset));
  await writeFile(path.join(METADATA_DIR, "country-mapping.json"), JSON.stringify(Array.from(countryMeta.values()), null, 2));

  const metadata = {
    generatedAt: new Date().toISOString(),
    baselineYear: BASELINE_YEAR,
    baselineNote: "LIVE, THRIVE and CONNECT use the calendar year 2019 as the pre-pandemic baseline. FEEL uses a 2017–2019 survey average because life-satisfaction sampling is sparser and noisier year to year.",
    latestNote: "LIVE, THRIVE and CONNECT use each country's most recent available observation, which differs by indicator and by country. FEEL uses the average of all available survey years from 2022 onward.",
    missingDataNote: "A null value means the source has no observation for that country/year/indicator. Missing values are never estimated, interpolated or replaced — they are shown as unavailable and excluded from averages and comparisons that require them.",
    coverageScopeNote: [
      `World Bank tracks ${totalEconomies} economies.`,
      noUsableDataCount > 0
        ? `${noUsableDataCount} have no usable observation in any of LIVE, THRIVE, CONNECT or FEEL and are excluded outright.`
        : null,
      `${insufficientSignalCount} more are missing THRIVE, CONNECT or FEEL entirely — which would leave them permanently stuck on "Insufficient data" — so they're excluded too.`,
      excludedByPopulationCap > 0
        ? `That leaves ${rankedByPopulation.length} economies with all four dimensions computable, ranked by total population (most recent available, the only objective proxy for global prominence in the source data) and capped to the ${TOP_N_COUNTRIES} most populous — ${excludedByPopulationCap} smaller economies were excluded on that basis.`
        : `That leaves ${topCountries.length} economies with all four dimensions computable — fewer than the ${TOP_N_COUNTRIES}-country target, so every one of them is included and no population-based cut was needed.`,
    ]
      .filter(Boolean)
      .join(" "),
    sources: Object.values(SOURCES),
  };
  await writeFile(path.join(PUBLIC_DATA_DIR, "metadata.json"), JSON.stringify(metadata, null, 2));

  const indicatorKeys = ["live", "thrive", "connect", "feel"];
  const coverage = {
    generatedAt: new Date().toISOString(),
    totalCountries: topCountries.length,
    excludedByPopulationCap,
    byIndicator: Object.fromEntries(
      indicatorKeys.map((key) => {
        const withBaseline = topCountries.filter((c) => c[key].baselineValue !== null).length;
        const withLatest = topCountries.filter((c) => c[key].latestValue !== null).length;
        const withBoth = topCountries.filter((c) => c[key].baselineValue !== null && c[key].latestValue !== null).length;
        const years = topCountries.flatMap((c) => c[key].values.map((v) => v.year));
        return [
          key,
          {
            countriesWithBaseline: withBaseline,
            countriesWithLatest: withLatest,
            countriesWithBoth: withBoth,
            earliestYear: years.length ? Math.min(...years) : null,
            latestYear: years.length ? Math.max(...years) : null,
          },
        ];
      }),
    ),
    fullyCoveredCountries: topCountries.filter((c) =>
      indicatorKeys.every((key) => c[key].baselineValue !== null && c[key].latestValue !== null),
    ).length,
    regions: Array.from(new Set(topCountries.map((c) => c.region))).sort(),
    regionCounts: Object.fromEntries(
      Array.from(new Set(topCountries.map((c) => c.region)))
        .sort()
        .map((region) => [region, topCountries.filter((c) => c.region === region).length]),
    ),
  };
  await writeFile(path.join(PUBLIC_DATA_DIR, "coverage.json"), JSON.stringify(coverage, null, 2));

  console.log(`Transformed ${topCountries.length} countries (top ${TOP_N_COUNTRIES} by population; ${excludedByPopulationCap} smaller economies excluded).`);
  console.log(`Fully covered (all 4 dimensions, baseline+latest): ${coverage.fullyCoveredCountries}`);
  console.log("Per-indicator coverage:", coverage.byIndicator);
}

main().catch((error) => {
  console.error("transform-data failed:", error);
  process.exitCode = 1;
});
