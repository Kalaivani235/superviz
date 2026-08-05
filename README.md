# The World Reopened. Did Life Recover?

A premium, single-page editorial data story for an Amazon Viz Con 2026 post-COVID recovery prototype. The experience asks whether economic recovery and human recovery moved together by looking at four signals: **LIVE**, **THRIVE**, **CONNECT**, and **FEEL**.

> Data status: **demonstration**. The committed values exercise the interface, data contract, calculations, quadrants, missing-data handling, and narrative templates. They must be replaced with validated public-source observations before the prototype is presented as evidence.

## Narrative concept

The page moves through a deliberate story rather than a dashboard:

1. **Opening:** “THE WORLD REOPENED. DID LIFE RECOVER?”
2. **Rupture:** a 2019 baseline separates into four recovery tracks.
3. **Vital signs:** calculated pilot summaries for physical, economic, digital, and emotional recovery.
4. **Discovery:** the Recovery Constellation reveals where GDP per person and life satisfaction moved together or diverged.
5. **Country detail:** the linked Country Recovery Fingerprint keeps the four signals distinct.
6. **Trust:** formulas, missing-data rules, source families, data status, and GenAI use are explicit.
7. **Close:** “Recovery is not a date. It is the distance between what returned and what did not.”

## Included components

- Full-viewport editorial hero with reduced-motion support
- CSS recovery timeline
- Four calculated global vital-sign cards
- Apache ECharts Recovery Constellation with:
  - GDP percentage change on the x-axis
  - life-satisfaction change on the y-axis
  - population-scaled bubbles
  - region colors and recovery-path shapes
  - zero lines and labeled quadrants
  - region filtering, hover, click, and keyboard country controls
- Clickable/searchable Country Recovery Fingerprint
- Deterministic narrative generation with optional JSON overrides
- Methodology, public sources, prototype warning, limitations, and GenAI disclosure
- Responsive layouts for presentation screens, tablets, and phones

## Data model

All replaceable observations live in [`data/pilot-countries.json`](data/pilot-countries.json). The file contains a dataset envelope and an array of countries. Each country follows the `PilotCountry` contract in [`lib/types.ts`](lib/types.ts), with baseline/latest year, value, unit, and source ID for each signal.

`mode` must be either:

```json
{ "mode": "demo" }
```

or:

```json
{ "mode": "validated", "dataAsOf": "YYYY-MM-DD" }
```

Source definitions live in [`data/sources.json`](data/sources.json). No browser-time API calls, secrets, database, or backend are required.

## Local setup

Requirements: Node.js 20.9 or newer (Node 22 recommended) and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available checks:

```bash
npm test
npm run lint
npm run build
npm start
```

The repository includes a pnpm lockfile because the local build environment uses pnpm; npm commands remain supported by the package scripts.

## Replacing the demonstration data

1. Download or extract the four indicators from the source families in `data/sources.json`.
2. Preserve 2019 as the baseline for LIVE, THRIVE, and CONNECT.
3. For FEEL, calculate a 2017–2019 pre-COVID country average and a 2022–latest post-COVID average before writing the two values into the JSON contract.
4. Use real GDP per capita in constant prices, not current-price GDP.
5. Preserve `null` for missing observations; do not impute values for the prototype.
6. Confirm units, years, country codes, population, regions, and source IDs.
7. Change the envelope to `"mode": "validated"`, add `dataAsOf`, and update `refreshDate` only after every observation has been reviewed.
8. Run all tests, lint, and the production build.

The page derives all visible headline metrics from this one file. Countries missing either THRIVE or FEEL are not plotted, but available signals still appear in their fingerprint.

## Calculation methodology

- **THRIVE:** `((latest real GDP per capita − 2019) / 2019) × 100`
- **LIVE:** `latest life expectancy − 2019 life expectancy`
- **CONNECT:** `latest internet-use share − 2019 share`, in percentage points
- **FEEL:** `post-COVID life-satisfaction average − pre-COVID average`

The quadrant classification uses only THRIVE and FEEL:

| GDP change | FEEL change | Recovery path |
| --- | --- | --- |
| ≥ 0 | ≥ 0 | Recovered Together |
| ≥ 0 | < 0 | Prosperity Without Healing |
| < 0 | ≥ 0 | Resilient Lives |
| < 0 | < 0 | Still Recovering |

There is no weighting, imputation, or hidden composite index. Calculation and validation logic is pure and covered by Vitest.

## Accessibility

- WCAG AA-oriented palette and readable typography
- Semantic landmarks and heading order
- Skip link and visible keyboard focus states
- 44px minimum interactive controls
- Reduced animation under `prefers-reduced-motion`
- ECharts ARIA description plus an equivalent keyboard-operable country strip
- Recovery paths use labels and point shapes, not color alone
- Persistent selected-country readout means tooltips are not the only source of detail
- Missing values are explicitly labeled
- External links announce that they open in a new tab

## GenAI usage

GenAI was used to support code generation, data-cleaning and validation logic, interface development, test generation, and narrative drafting. It is not used at runtime. The narrative is deterministic, and optional human-reviewed country copy can be supplied through the JSON `narrative` field.

All calculations and factual statements must be independently validated against the cited public data before submission.

## Deploying to Vercel

### Git integration

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected framework as **Next.js**.
4. Leave the root directory at the repository root and use the default build command (`next build`).
5. No environment variables are needed.
6. Deploy, then add the production URL to the project metadata if desired.

### Vercel CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

The app uses static local data and standard Next.js metadata, so it is ready for Vercel’s default Node runtime.

## Known prototype limitations

- The committed country values are demonstration data and cannot be presented as findings.
- The pilot includes 20 countries, one of which intentionally has a missing FEEL value to verify graceful handling.
- Latest years differ by indicator and will require a frozen, cited extraction manifest.
- Regional summaries and two-country comparison are described but intentionally outside the prototype scope.
- The chart’s editorial conclusions must be rewritten after validated data replaces the demo file.
# superViz
