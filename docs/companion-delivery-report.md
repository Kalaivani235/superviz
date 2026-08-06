# Atlas Guide — Companion Delivery Report

Date: 2026-08-07

## 1. Changed-file summary

**New files (17):**

```
lib/companion/types.ts               command/context/highlight/prediction/scene type contracts
lib/companion/companion-engine.ts    deterministic prompt + insight + explanation generation
lib/companion/scene-runner.ts        resolves guided-story scenes against the live dataset
lib/companion/prediction-engine.ts   question selection + answer validation
lib/companion/analytics.ts           trackCompanionEvent() — console-only, no third-party dep

data/companion/guided-scenes.ts      4 scene definitions, each data-resolved (never hardcoded)

scripts/generate-companion-questions.mjs   build-time question generator → public/data/companion-questions.json
public/data/companion-questions.json       14 generated questions (4 country / 4 region / 6 signal)

components/companion/DataCompanion.tsx      orchestrator: mode state machine, triggers, session gating
components/companion/CompanionCard.tsx      message + actions card ("Atlas Guide" label)
components/companion/CompanionActions.tsx   action-chip row
components/companion/CompanionMinimized.tsx collapsed pill with new-prompt pulse
components/companion/StoryPlayer.tsx        guided-story scene player (auto-advance + manual controls)
components/companion/StoryProgress.tsx      4-step progress indicator
components/companion/PredictionCard.tsx     question, lock-on-answer, reveal, follow-up actions

tests/companion-engine.test.ts       12 tests
tests/scene-runner.test.ts           7 tests
tests/prediction-engine.test.ts      5 tests
```

**Modified files (4):**

```
components/AtlasApp.tsx      + handleCompanionCommand, storySpotlight/predictionReveal state,
                                <DataCompanion> render, companion props on RecoveryOrbit
components/RecoveryOrbit.tsx + spotlightIso3s/spotlightLabel/revealHighlight props (reveal pulse,
                                correct/incorrect border tint), unchanged core Orbit behavior otherwise
app/globals.css               + ~55 lines: companion card/chip/pill/story/prediction styles,
                                mobile bottom-sheet override, reduced-motion override
package.json                  + data:companion-questions script, added to data:build pipeline
```

Nothing in the existing data pipeline (`fetch-data`, `transform-data`, `validate-data`,
`generate-stories`), calculation library (`lib/calculations.ts`), or any non-Orbit visualization
component was touched.

## 2. Architecture

```
data/companion/guided-scenes.ts ──┐
                                   ├─► lib/companion/scene-runner.ts ──┐
lib/companion/companion-engine.ts ┘                                   │
                                                                       ▼
scripts/generate-companion-questions.mjs (build time)      components/companion/DataCompanion.tsx
        │                                                    (mode state machine + session gating)
        ▼                                                             │
public/data/companion-questions.json (runtime fetch) ─► lib/companion/prediction-engine.ts
                                                                       │
                                                        CompanionCommand (one channel, one handler)
                                                                       │
                                                                       ▼
                                                        components/AtlasApp.tsx
                                                        handleCompanionCommand()
                                                        (translates into existing setLens/setRegion/
                                                         setYear/setSelectedIso3/setStorySpotlight/
                                                         scrollToSection calls — the same setters
                                                         every other control in the app already uses)
```

`DataCompanion` never imports or calls an AtlasApp setter directly. It only ever calls two props:
`onCommand(CompanionCommand)` for anything that changes the shared visualization state, and
`onReveal({iso3s, correct} | null)` for the one thing outside that contract — the brief
correct/incorrect pulse on a prediction reveal, which isn't a "view change" so much as a transient
visual accent.

Question generation follows the same pattern as `scripts/generate-stories.mjs`: a pure Node script
reads `public/data/countries.json`, derives real per-country changes, and only emits a question when
the underlying pattern is real and unambiguous (a clear count leader for region questions, a clear
signal-magnitude gap for signal questions, at least two real distractors for country questions). If
the dataset changes, running `npm run data:companion-questions` regenerates the pool from scratch —
nothing is hand-authored ahead of the data.

## 3. State and event flow

**New AtlasApp state:** `storySpotlight: string[] | null`, `predictionReveal: {iso3s, correct} | null`.
Everything else the companion reads (`activeSection`, `lens`, `region`, `year`, `selectedIso3`,
`isPlaying`) already existed — `CompanionContext` is a read-only snapshot built fresh each render,
not a duplicate store.

**Command flow (example — answering a prediction):**
1. Visitor clicks an option in `PredictionCard` → `DataCompanion.handleAnswerSelect`.
2. Answer locks immediately (options disabled); after a 550ms pacing delay:
   `onCommand({SET_VIEW, selectedIso3, spotlightIso3s})` updates the Orbit/Country Panel,
   `onReveal({iso3s, correct})` triggers the pulse, the reveal UI renders with the pre-computed
   rationale.

**Trigger flow (example — entering Explore):**
`AtlasApp`'s existing `IntersectionObserver`-driven `activeSection` changes → `DataCompanion` effect
detects the `overview → explore` transition → after a 400ms settle delay, shows the entered-explore
prompt (once per page load, gated by a ref) — unless a story or prediction is already active.

**Session persistence (sessionStorage, never cookies):** `atlas-guide-dismissed`,
`atlas-guide-started`, `atlas-guide-completed-story`, `atlas-guide-last-prediction` (asked question
ids, so "show another" never repeats until every question has been seen), `atlas-guide-mode`
(doubles as the one-shot inactivity-prompt gate).

## 4. Test results

```
npm test
 Test Files  5 passed (5)
      Tests  45 passed (45)
```

New: 24 tests across the three companion lib modules (12 companion-engine, 7 scene-runner,
5 prediction-engine) — deterministic question/insight generation, causal-language exclusion,
acronym-casing correctness, incomplete-data skip behavior, question cycling, answer validation.
Existing 21 tests (calculations + validation) untouched and still passing.

Interaction behaviors verified live against the running dev server (browser screenshots were not
obtainable this session — see §6 — so verification was DOM/state-level via the browser's JS console,
which is stronger evidence of correctness than a screenshot for logic, weaker for visual polish):
starting a guided story, manual Next/Previous/Pause/Resume/Restart, exiting a story (now returns to
"minimized," not fully hidden — see §7), answering a prediction (lock → command issued → Country
Panel updated to the revealed country → reveal shown with real values), cycling to a new prediction
question without repeats, manual country selection correctly clearing an active story spotlight,
mobile bottom-sheet sizing (confirmed exactly 55vh max-height, full width, no horizontal overflow at
390px), zero console errors across the entire test session.

## 5. Build results

```
npm run lint    0 errors, 0 warnings
npm run build   Compiled successfully, TypeScript checks passed, static generation succeeded
```

No new dependencies were added — the companion uses only React state/effects, `fetch` for the
static question JSON, and `sessionStorage`. No runtime AI API, no additional blocking requests.

## 6. Screenshots

Not obtained. The Browser pane's screenshot compositing was unavailable for most of this session
("the Browser pane is not displayed, so the page is not compositing frames") — a tooling issue, not
an application one. In its place, every interactive claim above was verified via direct DOM
inspection and computed-style checks in the live browser (element existence, text content, CSS
class state, `getComputedStyle` for sizing) rather than visual screenshots. I'd rather report this
gap plainly than claim a visual check that didn't happen — if you can get screenshots working on
your end, `npm run dev` and the flows in §4 are straightforward to re-check visually.

## 7. Assumptions made

- **Scene auto-advance pacing**: the brief didn't specify a duration, only that it must not outpace
  the reader and the chart transition must finish first. Used 8s per scene (disabled entirely under
  `prefers-reduced-motion`, matching the treatment of every other animation in this app).
- **`CompanionHighlight` vs. `storySpotlight`**: the brief's §1 example code sets `storySpotlight`
  from a plain `string[]`, while §9 describes a richer `{iso3s, mode, label, correct}` object. Kept
  `storySpotlight: string[] | null` exactly as the example shows (driven by the command channel), and
  added a *second, narrower* prop (`revealHighlight: {iso3s, correct} | null`) specifically for the
  prediction-reveal pulse/tint, rather than replacing the simple array with a rich object everywhere.
  This was a deliberate choice to honor "reuse the existing mechanism, don't build a parallel one" —
  one mechanism, fed by two independent inputs, rather than one bigger, always-rich type used
  everywhere it wasn't needed.
- **`data/companion/prediction-questions.ts`** (listed in §1's architecture sketch) was not created
  as a separate file. §6 explicitly recommends the build-time-generated
  `public/data/companion-questions.json` as the artifact, and the generation logic that would have
  lived in that `.ts` file lives in `scripts/generate-companion-questions.mjs` instead, mirroring
  exactly how `scripts/generate-stories.mjs` already works in this codebase. Introducing a third
  parallel location for the same logic seemed like duplication rather than fidelity to the brief.
- **Exiting a story or prediction returns to "minimized," not "hidden."** The brief doesn't specify
  the post-exit state; hiding entirely would strand the visitor with no way back short of a reload
  (see §8 — this was in fact a real bug I found and fixed mid-session).
- **"Give me a challenge"** is offered from the welcome prompt and the story-completion prompt, per
  the brief's explicit hero and Explore-entry examples; it isn't exposed as its own top-level trigger
  beyond those two entry points.
- Region-choice questions are generated once per quadrant pattern (4 patterns × regions with ≥3
  candidates and no count-tie for first place) rather than one fixed question — whichever patterns
  the current dataset actually supports unambiguously produce a question; ties are skipped rather
  than arbitrarily broken.

## 8. Issues discovered but not otherwise in scope

- **(Fixed during this work, not left open)**: `exitStory` originally set the companion to fully
  "hidden," which — combined with `sessionStorage`-gated triggers — could leave a visitor with no way
  to reopen the companion for the rest of the session after exiting a story early. Fixed to minimize
  instead.
- **Not fixed, flagging for awareness**: the Browser-pane screenshot tooling in this environment was
  unreliable for the entire session (intermittent both before and during this feature). This is a
  session/tooling issue unrelated to the application and outside what I can fix from the codebase.
- **Not fixed, pre-existing and out of scope**: `docs/final-qa-report.md` and `docs/revamp-audit.md`
  are dated snapshots from earlier phases of this project and were not updated to reflect the
  companion feature or the current 150-country/2015–2025 dataset scope — they remain accurate
  historical records of the phases they describe, not a live "current state" document.
