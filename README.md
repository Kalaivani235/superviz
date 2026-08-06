# Recovery Atlas

An interactive global atlas exploring how economies recovered — economically, physically, digitally and emotionally — after COVID-19. Built on public World Bank and World Happiness Report data across 217 economies.

> **The world reopened. Did life truly recover?** Economic activity returned quickly in many places. Health, connection and wellbeing followed very different paths.

## What it is

Four independent signals, each compared against its 2019 pre-pandemic baseline:

- **LIVE** — life expectancy at birth
- **THRIVE** — real GDP per person (constant 2015 US$)
- **CONNECT** — internet participation
- **FEEL** — self-reported life satisfaction (World Happiness Report / Cantril ladder)

The product deliberately avoids a single composite "recovery score." Each dimension stays visible on its own terms, so a country can be shown recovering economically while still below its 2019 wellbeing level, or the reverse.

## Experience

- **Overview** — hero with live coverage stats (country/region/year counts) and a four-signal preview
- **Explore** — the Recovery Orbit: every country's path from its 2019 baseline to the selected year, switchable between three analytical lenses (prosperity vs. wellbeing, health vs. prosperity, digital access vs. wellbeing), with region filtering, hover/keyboard exploration, and a linked Country Panel with a deterministic (non-LLM) narrative
- **Timeline** — year slider with play/pause, wired to the Orbit and Country Panel simultaneously
- **Compare** — two countries, all four dimensions, aligned baseline/latest/difference
- **Stories** — 3–5 findings generated directly from the transformed dataset, each with a "View in visualization" action that sets the Orbit's lens, region and selection
- **Methodology** — formulas, per-indicator coverage, and full source provenance

## Data pipeline

All data is fetched and transformed at development/build time — the app never calls a data API at runtime, only static files under `public/data/`.

```bash
npm run data:fetch      # pulls raw World Bank + World Happiness Report (via Our World in Data) sources into data/raw/
npm run data:transform  # builds public/data/countries.json, metadata.json, coverage.json + data/processed/, data/metadata/
npm run data:validate   # structural validation -> data/metadata/validation-report.json
npm run data:stories    # derives public/data/stories.json from the final dataset
npm run data:build      # runs all four in sequence
```

See [`docs/data-methodology.md`](docs/data-methodology.md) for the full source list, baseline/latest-year convention, and missing-data policy. Missing observations are never estimated or interpolated — they are shown as unavailable and excluded from any calculation that needs them.

## Local setup

Requirements: Node.js 20.9+ (LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test    # vitest — calculation and validation logic
npm run lint
npm run build
npm start
```

The repository includes a pnpm lockfile because the reference build environment uses pnpm; the npm scripts above are fully supported as an alternative.

## Calculation methodology

- **THRIVE**: `((latest − 2019) / 2019) × 100`
- **LIVE**: `latest − 2019`, in years
- **CONNECT**: `latest − 2019`, in percentage points
- **FEEL**: `(average of 2022–latest) − (average of 2017–2019)`, in Cantril ladder points

"Latest" is per-indicator and per-country — coverage differs by source, and the UI always labels the actual year a value comes from. The Recovery Orbit's quadrant classification (Recovered Together / Prosperity Without Healing / Resilient Lives / Still Recovering) uses THRIVE and FEEL only; the Country Panel says so explicitly next to the badge, since its narrative paragraph considers all four signals.

Full detail: [`docs/data-methodology.md`](docs/data-methodology.md).

## Accessibility

- Semantic landmarks, heading order, and native `<button>`/`<input>`/`<select>` controls throughout (no clickable `<div>`s)
- Skip link and visible `:focus-visible` rings
- 44px minimum interactive targets
- `prefers-reduced-motion` respected (chart transitions, hero particles, spinners)
- Recovery paths and lens quadrants use shape/label, not color alone
- Every chart has a parallel keyboard-operable country list, since canvas charts are not natively keyboard-navigable
- Missing values are always labeled "Not available," never blank or zero

## GenAI usage

GenAI was used to support code generation, the data pipeline, interface development, and narrative template design. It is not called at runtime — the Country Panel's narrative is produced by deterministic rules in `lib/narrative.ts` evaluated against the values already computed, not by a model invented at request time.

## Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, **Add New → Project**, import the repository, keep the framework as Next.js.
3. Default build command (`next build`), default root directory. No environment variables are required.
4. Deploy.

```bash
npm install -g vercel
vercel
vercel --prod
```

## Repository layout

```
app/            Next.js App Router: layout, single page route, global styles
components/     AtlasApp (orchestrator) + Header, Hero, RecoveryOrbit, TimelineControl,
                CountryPanel, RecoveryProfile, ComparePanel, StoriesSection, Methodology
lib/            types, calculations, validation, narrative, formatting, constants,
                the client-side data-loading hook
data/           raw/ (committed source payloads), processed/, metadata/ — pipeline artifacts
scripts/        fetch-data, transform-data, validate-data, generate-stories
public/data/    frontend-ready static JSON (countries, metadata, coverage, stories)
tests/          Vitest coverage for calculations and validation
docs/           revamp-audit, data-methodology, interaction-model, final-qa-report
```
