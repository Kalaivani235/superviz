# Revamp Audit — Recovery Atlas (formerly "The World Reopened")

Date: 2026-08-06
Scope: Phase 1 of the SuperViz competition revamp. Read-only audit of the repository as committed at `ae5a117`.

## 1. Stack summary

- Next.js 16.3 (App Router, single route), React 19.2, TypeScript, Tailwind CSS 4 (used only for `@import "tailwindcss"` reset — all real styling is hand-written CSS in `app/globals.css`).
- Charting: Apache ECharts 6 (`echarts/core` tree-shaken build), used for one scatter chart.
- Motion: Framer Motion 12, used sparingly (hero fade-in, fingerprint panel transitions).
- Testing: Vitest 4, two suites covering `lib/calculations.ts` and `lib/validation.ts` only — no component/interaction tests.
- Package manager: pnpm (hoisted node-linker), npm scripts also work. Node >=20.9.
- Deployment target: Vercel, static data, no backend, no env vars required.

**Verdict:** stack is healthy and appropriate for the brief (section 25 recommends exactly this combination). Retained as-is. No new chart library needed — ECharts can carry the Recovery Orbit; Framer Motion covers transitions.

## 2. Current structure

```
app/            layout.tsx, page.tsx (single route), globals.css, icon.tsx
components/     Hero, RecoveryTimeline, DataStory, VitalSigns, RecoveryConstellation,
                CountryFingerprint, BuildPreview, Methodology, SectionHeading
lib/            types.ts, calculations.ts, formatting.ts, validation.ts
data/           pilot-countries.json (20 countries), sources.json (4 source families)
tests/          calculations.test.ts, validation.test.ts
```

Everything renders on one route (`app/page.tsx`) as a vertical scroll: Hero → Timeline (decorative CSS only, not interactive) → data warning banner → Vital Signs → Recovery Constellation (scatter) → Country Fingerprint → "Build Preview" (a stated-intentions card, not a real feature) → Methodology → closing statement → footer.

## 3. What is reusable and strong

- **Data contract** (`lib/types.ts`): `IndicatorValue` (baseline/latest year+value+unit+sourceId) and `PilotCountry` (four indicators + region/population/incomeGroup) is a clean, source-traceable shape. Keep it as the foundation for the real dataset; it already satisfies most of section 15–18's provenance requirements structurally.
- **Calculation logic** (`lib/calculations.ts`): pure functions, `null`-safe, no imputation, no hidden composite score, covered by unit tests. Directly matches section 17's "no black-box score" requirement. Reusable almost unchanged — extend with LIVE/CONNECT quadrant options and multi-year lookups for the timeline.
- **Validation** (`lib/validation.ts`): structural dataset validation, good pattern to extend into the build-time pipeline (`scripts/validate-data`).
- **Visual language**: dark editorial palette (`--bg-deep`, `--recovery-cyan`, `--prosperity-gold`, `--connection-blue`, `--wellbeing-lavender`), condensed display typography, restrained motion, region-color legend, 44px touch targets, skip link, `:focus-visible` ring, `prefers-reduced-motion` handling in the chart. This is a genuinely good foundation — retain the token system and typographic voice rather than starting over.
- **ECharts scatter chart mechanics**: canvas renderer, resize observer, aria description, keyboard-operable country list as a non-chart fallback — this pattern (chart + parallel keyboard list) is the right accessibility approach and should carry into the Recovery Orbit.
- **Deterministic narrative sentence** in `CountryFingerprint.tsx` — rule-based, no runtime LLM call, matches section 10's requirement. Needs to become a richer rule table (more than one template) but the mechanism is correct.

## 4. Critical deficiencies (drive the revamp)

### 4.1 Data is fabricated, and says so
`data/pilot-countries.json` is hand-authored demo data for 20 countries (`"mode": "demo"`). The README explicitly instructs replacing it before submission. User-visible strings expose this directly:
- `Hero.tsx:27` — "POST-COVID RECOVERY · PILOT EXPERIENCE"
- `DataStory.tsx:23` — "Prototype data" / "Replace with validated public-source values before submission"
- `VitalSigns.tsx:66` — "Demonstration values are not factual findings"
- `Methodology.tsx:10,37` — repeated prototype banners and "Prototype limitation" paragraph
- `BuildPreview.tsx:12` — "From pilot to full experience" (an entire section admitting the product is unfinished)
- `page.tsx:43` — footer: "Public prototype · Demonstration data"
- `README.md` — "demonstration" data status banner, "Known prototype limitations" section

All of this must be removed and replaced by a real, validated dataset (Phase 2) with genuine provenance metadata — never silently swapped for synthetic numbers.

### 4.2 Interaction is shallow
Only two real controls exist: a region `<select>` and a country `<select>`, both driving the same one scatter chart + one profile panel. There is no timeline scrubbing (the "timeline" is a static CSS diagram), no play/pause, no compare mode, no stories, no search. Section 3.2/3.4's bar ("interact → observe change → discover a pattern → receive explanation") is not met — the current flow is read-scroll-select-read, a report, not an atlas.

### 4.3 No navigation / weak first impression
`layout.tsx` has no header at all — the page starts directly at the hero `<section>`. There is no sticky nav, no section structure (Overview/Explore/Timeline/Compare/Stories/Methodology per section 6), and the hero's status pill announces "PILOT EXPERIENCE" instead of coverage/time-period facts.

### 4.4 Signature visual is a plain scatter, not an Orbit
`RecoveryConstellation.tsx` plots one static point per country per the *currently loaded* baseline/latest pair — there is no trail/movement encoding, no year scrubbing, no lens switching (it's hard-coded to THRIVE×FEEL). The brief's "Recovery Orbit" (baseline→selected-year movement, switchable lenses, play/pause) does not exist yet.

### 4.5 Single-year model blocks the timeline requirement
`IndicatorValue` only stores one baseline and one latest value, not a year-indexed series. A real timeline (slider across 2019→latest with per-year positions) requires extending the data model to a value-per-year series (see Phase 2 plan below) while preserving the existing baseline/latest fields for backward-compatible display.

### 4.6 No compare mode, no stories
Both are entirely absent; `BuildPreview.tsx` is a placeholder card describing them as future work ("The next chapter... The contest entry will deepen the evidence") rather than shipping them.

### 4.7 Missing-data handling is present but under-surfaced
`hasIndicatorValues`/`hasPlottableRecovery` exist and are used to exclude countries from the scatter, and the fingerprint shows "Not available" — this logic is sound and should be extended, not rebuilt, but coverage/availability needs its own explicit UI (per section 12/29) rather than only silent exclusion.

## 5. Data gaps to close in Phase 2

- Need real World Bank series (GDP per capita constant 2015 US$ `NY.GDP.PCAP.KD`, life expectancy `SP.DYN.LE00.IN`, individuals using internet `IT.NET.USER.ZS`) pulled via the public World Bank API (no auth, `https://api.worldbank.org/v2/country/all/indicator/<code>?format=json&per_page=20000`), for a broad country set, all years 2015–latest, not just baseline/latest.
- Need World Happiness Report life-evaluation ("Cantril ladder") scores per country/year — WHR publishes a data appendix (xlsx/csv) rather than a live API; must be fetched once and committed to `/data/raw` with a citation, and years reconciled against the 2019 pre-COVID / latest post-COVID convention already documented in the README.
- Latest available year differs per indicator (WHR often lags WB by a year) — must preserve per-indicator `latestYear`, never force a shared year.
- Region/income group/ISO3 mapping must switch from the hand-typed 20-country list to the full World Bank country metadata endpoint (`/v2/country?format=json&per_page=400`), filtered to actual countries (excluding aggregates like "World", "OECD members").

## 6. Design gaps

- No sticky header/nav (section 6, 21).
- Hero status pill and copy expose internal/unfinished language (section 7).
- No compare or story UI at all (sections 13–14).
- Radar/fingerprint exists but is single-country only, no small-multiples baseline-to-latest framing beyond the current bar-position track (kept, will extend).
- No responsive strategy documented or tested beyond CSS `clamp()`; no mobile bottom-sheet pattern for detail panels (section 22).

## 7. Technical risks

- Extending `IndicatorValue` to a year series is a breaking change to the data contract — mitigate by keeping `baselineValue`/`latestValue` as derived accessors (first/last of the series) so `lib/calculations.ts` and existing tests keep working while the timeline reads the full series.
- ECharts scatter → Orbit (trail lines + animated position) needs custom series or `graphic` layer for trails; feasible within ECharts (avoids adding D3 solely for this), keeping "one main visualization strategy" (section 25).
- World Happiness Report has no stable JSON API; the fetch script must degrade gracefully (documented manual step) if the network fetch fails, but must not fabricate replacement numbers.
- `node_modules` is not yet installed in this environment — must run install before any dev/build/test verification.

## 8. Implementation sequence (adopted)

1. Install deps, confirm baseline `lint`/`test`/`build` pass before changing anything.
2. Data pipeline: fetch real WB + WHR data, build country/region/ISO3 metadata, transform into an extended dataset contract with per-year series, validate, generate `/public/data/*.json`, write `docs/data-methodology.md`.
3. Design tokens + header/nav (Overview/Explore/Timeline/Compare/Stories/Methodology), remove all prototype copy.
4. Hero rebuild with real coverage/time-period stats.
5. Recovery Orbit (replaces Recovery Constellation): baseline→year trail, lens switch, region filter, search, play/pause, reset.
6. Timeline control wired to Orbit + all panels.
7. Country detail panel + four-dimension profile (extends Fingerprint).
8. Compare mode (new).
9. Stories mode (new, generated from final dataset).
10. Methodology/provenance section (extends existing Methodology component).
11. Responsive + accessibility + states pass.
12. Quality gate (lint/typecheck/test/build + visual QA at required breakpoints).
13. `docs/interaction-model.md`, `docs/final-qa-report.md`, README update.

Proceeding directly into implementation per the operating brief.
