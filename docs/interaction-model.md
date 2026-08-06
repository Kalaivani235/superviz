# Interaction Model

Recovery Atlas is one continuously scrolling page (`components/AtlasApp.tsx`) rather than a set of routed pages. Navigation items (Overview, Explore, Timeline, Compare, Stories, Methodology) are anchors into that page, kept in sync by an `IntersectionObserver`-driven scrollspy. This keeps a single shared state tree in scope everywhere, which is what makes cross-component coordination possible.

## Shared state

All of it lives in `AtlasApp`, one level above every visible component:

| State | Drives |
| --- | --- |
| `selectedIso3` | Recovery Orbit highlight, Country Panel, keyboard country list, header search |
| `hoveredIso3` | Recovery Orbit highlight/dim, chart readout |
| `year` | Recovery Orbit positions/trails, Timeline label, Recovery Profile "as of" column, Compare readouts |
| `lens` | Recovery Orbit axes, quadrant labels, chart readout |
| `region` | Recovery Orbit filtering, keyboard country list, Compare/Stories region context |
| `compareA` / `compareB` | Compare panel, Recovery Orbit's compare highlight |
| `isPlaying` | Timeline auto-advance |
| `activeSection` | Header nav active state |

No component owns private copies of this data — everything reads from `AtlasApp` and calls back up through setters. That is what satisfies the "every action updates at least two components" requirement (brief §9) without prop-drilling hacks or duplicated state.

## Coordinated flows

**Selecting a country** (via the Orbit, its keyboard list, header search, a story, or Compare) updates:
1. Recovery Orbit — halo, label, dimmed peers, its trail highlighted
2. Chart readout strip below the Orbit
3. Country Panel — identity, four-dimension profile, regional rank, most positive/negative movement, narrative, sources
4. Header search closes and the page scrolls to Explore

**Changing the year** (slider, play/pause, or reset) updates:
1. Recovery Orbit — every country's current-year position and trail endpoint (`changeAsOfYear`)
2. Timeline year readout
3. Recovery Profile's "as of {year}" column and computed change, inside the Country Panel
4. Compare panel's per-metric readouts, if two countries are selected

Years without an exact observation are never fabricated: `pointAsOfYear` carries the most recent prior observation forward and the UI labels it "(carried forward)" — see `lib/calculations.ts`.

**Changing region** filters the Orbit's plotted set and its keyboard-accessible country list to that region; it does not affect Compare or the Country Panel (a user comparing two countries from different regions should not lose that comparison because they filtered the map).

**Switching lens** changes the Orbit's x/y metrics, axis labels, and quadrant labels (`lib/constants.ts: LENS_QUADRANTS`) — each lens has its own quadrant semantics, not a generic relabeling.

**Activating a story** (`components/StoriesSection.tsx` → `AtlasApp.handleViewStory`) sets `lens`, `region`, and `selectedIso3` from the story's own derived data (`public/data/stories.json`), then scrolls to Explore — the story becomes a live filter state, not a static screenshot.

## Deterministic narrative

`lib/narrative.ts` generates the Country Panel's descriptive paragraph from the sign of each already-computed change value (no runtime model call). The rule order is: prosperity-without-wellbeing → wellbeing-without-prosperity → digital-without-wellbeing → broad recovery → mostly-missing-data → mixed pattern. The recovery-path badge above it (Recovered Together / Prosperity Without Healing / Resilient Lives / Still Recovering) is a *different*, narrower classification based on THRIVE and FEEL only (`classifyRecoveryPath`); the panel says so explicitly (`.path-badge-note`) so the two summaries are never read as contradictory.

## Empty and partial states

- **No plottable countries for a region+lens combination**: Orbit shows `.chart-empty` with a specific explanation naming the two metrics involved, not a blank canvas.
- **Country missing one indicator**: still selectable (via search or a story), still shown in the Country Panel; the missing row reads "Not available" with em-dash years rather than being hidden or zero-filled.
- **No compare countries chosen**: Compare shows a one-line prompt instead of an empty grid.
- **Search with no match**: inline "No country matches…" message, not a silent no-op.
- **Dataset fetch failure**: `lib/useAtlasData.ts` surfaces a dedicated error screen (`StatusScreen`) with a retry action, instead of a blank or partially-hydrated page.
