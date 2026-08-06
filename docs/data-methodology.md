# Data Methodology

Recovery Atlas uses exactly four public data series. Nothing is estimated, interpolated, or generated at runtime. This document is the canonical reference for what each number means, where it comes from, and how it is calculated — the in-app Methodology section is a shorter, user-facing version of the same facts.

## 1. Source families

| Dimension | Indicator | Publisher | Indicator code | License |
| --- | --- | --- | --- | --- |
| LIVE | Life expectancy at birth | World Bank / World Development Indicators (UN Population Division) | `SP.DYN.LE00.IN` | CC BY-4.0 |
| THRIVE | GDP per capita, constant 2015 US$ | World Bank / World Development Indicators | `NY.GDP.PCAP.KD` | CC BY-4.0 |
| CONNECT | Individuals using the internet, % of population | World Bank / World Development Indicators (ITU) | `IT.NET.USER.ZS` | CC BY-4.0 |
| FEEL | Life evaluation (Cantril ladder, 0–10) | Wellbeing Research Centre / World Happiness Report, redistributed by Our World in Data | `happiness-cantril-ladder` | CC BY-4.0 |
| (support) | Population, total | World Bank / World Development Indicators | `SP.POP.TOTL` | CC BY-4.0 |

Constant-price GDP is used deliberately instead of current-price GDP so that THRIVE reflects real output growth, not inflation. The World Happiness Report does not expose a stable JSON API; Our World in Data republishes the same underlying survey values with a citable, machine-readable CSV endpoint, which is what `scripts/fetch-data.mjs` downloads.

## 2. Pipeline

```
npm run data:fetch      scripts/fetch-data.mjs      → data/raw/*.json, data/raw/*.csv
npm run data:transform  scripts/transform-data.mjs  → public/data/countries.json
                                                       public/data/metadata.json
                                                       public/data/coverage.json
                                                       data/processed/dataset.json
                                                       data/metadata/country-mapping.json
npm run data:validate   scripts/validate-data.mjs   → data/metadata/validation-report.json
npm run data:stories    scripts/generate-stories.mjs → public/data/stories.json
npm run data:build                                   runs all four in sequence
```

Nothing in the Next.js app calls a data API at request time. All four scripts run at development/build time; the frontend only ever reads the static files under `public/data/`.

1. **fetch-data** calls the public World Bank API (`api.worldbank.org/v2/...`, no key required) for country metadata and each indicator across 2010–2025, and downloads the Our World in Data happiness CSV. Raw responses are committed under `data/raw/` unmodified, so the exact source payload is always reproducible and auditable.
2. **transform-data** filters World Bank's country list down to actual economies (`region.id !== "NA"`, which excludes aggregates like "World" or "OECD members"), builds a year-indexed series per country per indicator, and computes the baseline/latest figures described below. Output is rounded to 3 decimal places to keep the static bundle small; raw, unrounded source values remain in `data/raw/`.
3. **validate-data** checks structural integrity (ascending years, valid ISO3 codes, numeric-or-null values, no duplicate countries) and writes a pass/fail report.
4. **generate-stories** re-derives the curated Stories mode directly from the transformed dataset (see `docs/interaction-model.md`) — no story content is written before this step runs against real numbers.

## 3. Baseline and latest-year convention

- **Baseline year is 2019** for every dimension — the last complete pre-pandemic calendar year.
- **LIVE, THRIVE, CONNECT**: baseline value is the observation at exactly 2019 (`null` if the source has no 2019 observation for that country — never substituted). Latest value is the most recent year the source actually reports for that country; this year is stored per indicator per country and displayed wherever the value appears, because coverage is not simultaneous across indicators or countries.
- **FEEL**: life-satisfaction survey coverage is sparser and noisier year to year than the other three indicators, so — consistent with the original project's calculation design — the baseline is the average of whichever of 2017, 2018 and 2019 the source reports, and the "latest" value is the average of all reported years from 2022 onward. The specific years that fed each average are retained in `baselineYears`/`latestYears` on every country record for full transparency.
- No indicator is ever forced onto a shared "latest year." A country can show THRIVE through 2025, LIVE through 2024, and FEEL through 2025 simultaneously — each is labeled with its own year in the UI.

## 4. Missing data

A `null` baseline or latest value means the source has no observation for that country in that window — full stop. The pipeline never imputes, interpolates, or estimates a replacement number. Countries with partial coverage (e.g., FEEL missing but LIVE/THRIVE/CONNECT present) remain in the dataset; the UI shows "Not available" for the missing dimension and excludes it from any calculation that requires it (regional averages, quadrant classification, comparisons).

## 5. Derived calculations

Defined once in `lib/calculations.ts` and reused everywhere in the UI — there is no separate "for display" formula.

- **THRIVE % change** = `((latest − 2019) / 2019) × 100`
- **LIVE change** = `latest − 2019`, in years
- **CONNECT change** = `latest − 2019`, in percentage points
- **FEEL change** = `post-2022 average − 2017–2019 average`, in Cantril ladder points

There is no weighted composite "recovery score." Each dimension is shown independently; the only cross-dimension read is the THRIVE-vs-FEEL quadrant classification (`lib/calculations.ts: classifyRecoveryPath`) used for the Recovery Orbit's four labeled quadrants, and that classification is descriptive (which direction each axis moved), not a weighting or ranking.

## 6. Coverage (as of the last pipeline run)

See `public/data/coverage.json` for the live numbers, regenerated on every `npm run data:transform`. As of this dataset build: 217 economies included, 143 with complete baseline-and-latest data on all four dimensions. Per-indicator coverage and observed year ranges are in the same file, and summarized in the in-app Methodology section.

## 7. Re-running the pipeline

```bash
npm run data:build
```

This is safe to re-run at any time — it always re-fetches from source and re-derives everything downstream, so the dataset never drifts from what the cited sources currently report. `dataAsOf`/`refreshDate` in `public/data/countries.json` record when the data was last pulled.
