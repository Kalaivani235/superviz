# Codex Build Specification
## Project: The World Reopened. Did Life Recover?

### 1. Role and operating mode

Act as a senior product designer, data-visualization engineer, and frontend developer.

Create a polished, publicly deployable prototype for the Amazon Viz Con 2026 contest theme:

**“How the world lives, thrives, and connects.”**

The selected dataset theme is **Post-COVID recovery**.

Do not build a conventional BI dashboard. Build a premium, editorial, scroll-based data story that can be shown to a judging panel in 60–90 seconds and later extended into the full contest submission.

Work autonomously:
- If the repository is empty, initialize the project.
- Do not ask for confirmation for routine implementation decisions.
- Keep the implementation small and maintainable.
- Run the application, lint it, test the important calculations, and fix errors before stopping.
- At completion, provide a concise summary of what was built, commands to run it, and deployment steps.

---

## 2. Product objective

Build a single-page interactive prototype titled:

# THE WORLD REOPENED.
## DID LIFE RECOVER?

Subtitle:

**A visual story of how the world lived, thrived, and reconnected after COVID.**

The experience should answer:

> When countries recovered economically after COVID, did people’s lives recover at the same pace?

The core narrative is:

> The pandemic was global. The recovery was not.

The prototype must make one point memorable:

> Reopening and recovering are not the same thing.

---

## 3. Contest-aligned outcomes

The prototype must demonstrate:

1. **Data storytelling**
   - A clear beginning, discovery, and conclusion.
   - The page must guide the user instead of presenting unrelated charts.

2. **Discovery**
   - Highlight countries where economic recovery and human recovery moved in different directions.
   - Create a visible “I did not know that” moment.

3. **Visual design**
   - Editorial, cinematic, uncluttered, accessible.
   - Strong hierarchy, whitespace, typography, and restrained animation.

4. **Data quality**
   - Public sources only.
   - Display indicator definitions, baseline year, latest year, and source links.
   - Never fabricate final factual findings.

5. **Technical engagement**
   - One meaningful interactive visual.
   - One country-level exploratory component.
   - Responsive and publicly deployable.

---

## 4. Fixed scope

Build exactly one public-facing page.

Required sections:

1. Hero
2. Recovery timeline
3. Four global vital signs
4. Recovery Constellation
5. Country Recovery Fingerprint
6. What the completed experience will contain
7. Methodology and sources
8. Closing statement

Do not add:

- Authentication
- Database
- Admin screen
- Chatbot
- Runtime LLM dependency
- API backend
- User accounts
- 3D globe
- More than one application page
- More than two primary interactive visualizations
- Complex composite recovery index
- Unnecessary UI libraries
- Generic dashboard sidebars
- Dense filter panels

---

## 5. Recommended technical stack

Use:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Apache ECharts or Plotly for the scatter visualization
- Framer Motion for restrained transitions
- Static JSON or CSV data
- Vercel-compatible deployment

Use the latest stable package versions that are mutually compatible.

The application must work with:

```bash
npm install
npm run dev
npm run build
npm run lint
```

No secrets or environment variables should be required for the prototype.

---

## 6. Repository structure

Create or align to:

```text
post-covid-recovery/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Hero.tsx
│   ├── RecoveryTimeline.tsx
│   ├── VitalSigns.tsx
│   ├── RecoveryConstellation.tsx
│   ├── CountryFingerprint.tsx
│   ├── BuildPreview.tsx
│   ├── Methodology.tsx
│   └── SectionHeading.tsx
├── data/
│   ├── pilot-countries.json
│   └── sources.json
├── lib/
│   ├── calculations.ts
│   ├── formatting.ts
│   ├── types.ts
│   └── validation.ts
├── public/
│   └── assets/
├── tests/
│   └── calculations.test.ts
├── README.md
├── package.json
└── tsconfig.json
```

Keep components small and explicit. Do not over-engineer state management.

---

## 7. Data story model

Use 2019 as the pre-COVID baseline.

For life satisfaction, prefer:

- Pre-COVID average: 2017–2019
- Post-COVID average: 2022–latest available

For all other indicators, use:

- Baseline: 2019
- Latest credible available year

Use four indicators:

### LIVE
Life expectancy at birth

### THRIVE
Real GDP per capita

### CONNECT
Individuals using the internet as a percentage of population

### FEEL
Average life satisfaction or Cantril Ladder score

Public source families:

- World Bank Development Indicators
- Our World in Data
- World Happiness Report

Prefer local, preprocessed static data for the prototype.

Do not make live external API calls from the browser.

---

## 8. Data integrity rules

Do not invent final numbers.

If the required real dataset is unavailable during implementation:

1. Create a clearly labelled `demo` dataset.
2. Display a visible banner:
   **“Prototype data — replace with validated public-source values before submission.”**
3. Never describe demo values as real findings.
4. Keep the entire data-loading layer replaceable through one JSON file.

The final code must validate:

- Country code exists
- Country name exists
- Region exists
- Population is positive
- Baseline and latest values contain years
- Numeric values are finite
- Missing indicators are handled gracefully
- A country is not plotted when the x-axis or y-axis measure is absent

---

## 9. Required data contract

Create TypeScript types matching this shape:

```ts
export type IndicatorValue = {
  baselineYear: number;
  baselineValue: number | null;
  latestYear: number;
  latestValue: number | null;
  unit: string;
  sourceId: string;
};

export type PilotCountry = {
  iso3: string;
  country: string;
  region: string;
  incomeGroup?: string;
  population: number;
  live: IndicatorValue;
  thrive: IndicatorValue;
  connect: IndicatorValue;
  feel: IndicatorValue;
  narrative?: string;
};
```

Create a derived model:

```ts
export type CountryRecovery = PilotCountry & {
  thrivePctChange: number | null;
  liveAbsoluteChange: number | null;
  connectPointChange: number | null;
  feelAbsoluteChange: number | null;
  recoveryPath:
    | "recovered-together"
    | "prosperity-without-healing"
    | "resilient-lives"
    | "still-recovering"
    | "insufficient-data";
};
```

---

## 10. Calculation rules

Implement pure, tested functions.

### GDP recovery

```text
((latest GDP per capita - 2019 GDP per capita) / 2019 GDP per capita) × 100
```

### Life expectancy recovery

```text
latest life expectancy - 2019 life expectancy
```

### Connection recovery

Use percentage-point change:

```text
latest internet-use percentage - 2019 internet-use percentage
```

### Life satisfaction recovery

```text
post-COVID average - pre-COVID average
```

### Recovery path

Use only GDP recovery and life-satisfaction recovery for quadrant classification:

```text
GDP >= 0 and FEEL >= 0:
Recovered Together

GDP >= 0 and FEEL < 0:
Prosperity Without Healing

GDP < 0 and FEEL >= 0:
Resilient Lives

GDP < 0 and FEEL < 0:
Still Recovering
```

Do not introduce weighting or hidden scoring.

---

## 11. Visual language

The page must feel like an interactive editorial feature, not a BI application.

### Palette

Use CSS variables.

Suggested direction:

```css
--bg-primary: #07111F;
--bg-secondary: #0C1929;
--text-primary: #F5F0E8;
--text-muted: #AAB6C5;
--recovery-cyan: #63D8E5;
--disruption-coral: #FF7B6B;
--wellbeing-lavender: #B8A7FF;
--baseline-grey: #667487;
--surface: rgba(255, 255, 255, 0.055);
```

The exact values may be refined for WCAG contrast.

### Typography

- Use one expressive display font and one clean sans-serif font.
- Use locally available or web-safe/open fonts.
- Avoid font files requiring manual distribution.
- Hero headline should feel bold and editorial.
- Body text should remain highly readable.

### Shape language

- Soft-radius cards
- Thin, subtle borders
- Very light glow only around key data points
- No glassmorphism overload
- No gradients behind every component
- No chart junk

### Accessibility

- WCAG AA contrast for text
- Keyboard-accessible controls
- Visible focus indicators
- Do not encode categories through colour alone
- Include labels or patterns for recovery paths
- Respect `prefers-reduced-motion`
- Add chart description for screen readers
- Tooltips must not be the only place where critical information exists

---

## 12. Section-level UX requirements

### Section 1 — Hero

Full viewport height on desktop.

Content:

```text
THE WORLD REOPENED.
DID LIFE RECOVER?

A visual story of how the world lived, thrived, and reconnected after COVID.

Using 2019 as the pre-pandemic baseline, we examine whether countries recovered economically, physically, digitally, and emotionally.

Scroll to examine the world’s vital signs.
```

Background:

- Abstract dotted world field or softly animated data particles
- Do not use stock photography
- Do not use virus, hospital, mask, or vaccine imagery
- Motion must be subtle and performant

Add a small status label:

```text
POST-COVID RECOVERY · PILOT EXPERIENCE
```

---

### Section 2 — Recovery timeline

Display:

```text
2019 → 2020 → 2021 → 2022 → Latest
```

Use one baseline line that separates into four tracks:

- LIVE
- THRIVE
- CONNECT
- FEEL

Supporting copy:

```text
The pandemic was global.
The recovery was not.
```

This may be an SVG or CSS visualization. Keep it lightweight.

---

### Section 3 — Four global vital signs

Create four large cards.

Each card contains:

- Signal name
- Primary metric
- One-sentence interpretation
- Baseline/latest context
- Small directional graphic

Cards:

1. LIVE
2. THRIVE
3. CONNECT
4. FEEL

Example labels:

```text
LIVE
Average change in life expectancy since 2019

THRIVE
Countries above their 2019 real GDP-per-person level

CONNECT
Average change in internet participation since 2019

FEEL
Average change in reported life satisfaction
```

Calculate values from the loaded dataset.

Do not hardcode headline metrics.

---

### Section 4 — Recovery Constellation

This is the signature component.

Heading:

```text
One shock. Many recoveries.
```

Subheading:

```text
Economic recovery did not always bring human recovery with it.
```

Chart:

- X-axis: GDP per capita percentage change
- Y-axis: life-satisfaction absolute change
- Bubble size: population, using a bounded square-root scale
- Region represented through colour
- Recovery path also communicated by quadrant labels and point outline/icon
- Zero reference lines on both axes
- Four visible narrative quadrant labels

Quadrant names:

- Recovered Together
- Prosperity Without Healing
- Resilient Lives
- Still Recovering

Interaction:

- Hover or keyboard focus reveals:
  - Country
  - Region
  - GDP recovery
  - Life-satisfaction change
  - Life-expectancy change
  - Internet-use change
  - Source years

- Clicking a country updates the Country Recovery Fingerprint.
- Add a region selector with:
  - All regions
  - Individual regions
- Add a country-search field only if it remains visually clean.
- Avoid a permanent sidebar.

Optional motion:

- On first entry, animate points outward from the 2019 origin.
- Run once only.
- Disable under reduced-motion preference.

Do not use a geographic map in the pilot.

---

### Section 5 — Country Recovery Fingerprint

Heading:

```text
One country. Four recoveries.
```

Default to one carefully selected country from the pilot data.

Provide a searchable country selector or use the selected scatter point.

Display:

- Country name
- Region
- Recovery-path label
- Four horizontal recovery tracks:
  - LIVE
  - THRIVE
  - CONNECT
  - FEEL
- Baseline at the centre or a clearly marked zero point
- Latest value shown relative to baseline
- Units and source years

Narrative:

Use a deterministic template generated from real values.

Example logic:

```text
{Country}’s economy is {above/below} its 2019 position, while reported life satisfaction is {above/below} its pre-COVID level. Life expectancy has changed by {value}, and internet participation has changed by {value}. Its recovery path is classified as {path}.
```

Do not call an LLM at runtime.

A prewritten, human-reviewed narrative may override the template through the JSON file.

---

### Section 6 — What will be built next

Heading:

```text
From pilot to full experience
```

Show three concise cards:

1. Global recovery paths
2. Country comparison
3. Transparent methodology

Copy must explain that the completed contest entry will:

- Expand country coverage
- Add regional comparison
- Allow two-country comparison
- Provide source-level methodology
- Document GenAI usage in data preparation and code generation

Keep this section brief.

---

### Section 7 — Methodology and sources

Include:

- Why 2019 is the baseline
- How different latest years are handled
- Life-satisfaction averaging method
- Missing-data policy
- Calculation formulas
- Dataset source links
- Data refresh date
- Prototype-data warning when applicable
- GenAI usage note

GenAI note:

```text
GenAI was used to support code generation, data-cleaning logic, interface development, and narrative drafting. All calculations and displayed factual statements must be validated against the cited public data.
```

---

### Section 8 — Closing statement

Use a quiet full-width closing section.

Text:

```text
RECOVERY IS NOT A DATE.

It is the distance between what returned
and what did not.

LIVE · THRIVE · CONNECT · FEEL
```

Add a small footer with:

- Project title
- Data-source links
- Built with Next.js
- Public prototype label

---

## 13. Copy rules

Tone:

- Human
- Intelligent
- Calm
- Evidence-led
- Memorable
- Non-alarmist
- Globally inclusive

Avoid:

- “Winners” and “losers”
- Blaming countries
- Claims of causation
- “Back to normal” as a factual conclusion
- Overuse of pandemic trauma imagery
- Technical jargon on the main page
- Unsupported interpretations

Use “associated with,” “moved together,” or “diverged” instead of causal language.

---

## 14. Responsive behaviour

### Desktop

- Designed primarily for a presentation screen
- Max content width around 1280–1440px
- Hero and signature chart should feel immersive

### Tablet

- Preserve chart interactivity
- Stack cards two by two

### Mobile

- Stack all cards
- Use a horizontally scrollable or simplified chart only if necessary
- Country Fingerprint must remain usable
- No clipped labels
- Minimum touch target of 44px

---

## 15. Performance requirements

Target:

- No heavy video
- No 3D rendering
- Lazy-load noncritical visualizations
- Avoid large client-side dependencies
- Static data file under a reasonable size
- No layout shift in the hero
- Smooth scrolling without scroll-jacking
- Production build must complete without errors

---

## 16. Testing

Add tests for:

- Percentage-change calculation
- Absolute-change calculation
- Missing baseline
- Missing latest value
- Zero baseline protection
- Recovery-path classification
- Headline aggregation
- Dataset validation

Also manually verify:

- Keyboard navigation
- Reduced-motion mode
- Empty-state messaging
- Long country names
- Small and large populations
- Countries with partially missing data
- Mobile layout

---

## 17. Seed dataset requirements

Create a pilot dataset with approximately 15–25 countries across multiple regions.

The set should include:

- Asia
- Africa
- Europe
- North America
- South America
- Oceania where data is available
- Different income groups
- Different recovery paths

Do not cherry-pick only countries that support one conclusion.

If using demonstration values, set:

```json
{
  "mode": "demo"
}
```

If using validated values, set:

```json
{
  "mode": "validated",
  "dataAsOf": "YYYY-MM-DD"
}
```

The UI must display the corresponding status.

---

## 18. Source configuration

Create `data/sources.json` similar to:

```json
[
  {
    "id": "world-bank-gdp",
    "name": "World Bank — GDP per capita",
    "url": "https://data.worldbank.org/indicator/NY.GDP.PCAP.KD"
  },
  {
    "id": "world-bank-life",
    "name": "World Bank — Life expectancy at birth",
    "url": "https://data.worldbank.org/indicator/SP.DYN.LE00.IN"
  },
  {
    "id": "world-bank-internet",
    "name": "World Bank — Individuals using the Internet",
    "url": "https://data.worldbank.org/indicator/IT.NET.USER.ZS"
  },
  {
    "id": "world-happiness",
    "name": "World Happiness Report",
    "url": "https://www.worldhappiness.report/data-sharing/"
  }
]
```

Open links in a new tab and include accessible link labels.

---

## 19. README requirements

The README must include:

1. Project overview
2. Narrative concept
3. Screens or components included
4. Data model
5. Local setup
6. Development commands
7. Data replacement instructions
8. Calculation methodology
9. Accessibility decisions
10. Deployment to Vercel
11. GenAI usage documentation
12. Known prototype limitations

---

## 20. Deployment

Prepare for Vercel.

Requirements:

- No server-only secrets
- Build succeeds in production mode
- Static data committed to the repository
- Correct metadata title and description
- Social preview metadata
- Favicon or simple generated mark
- Public URL-ready
- No console errors

Use metadata:

```text
Title:
The World Reopened. Did Life Recover?

Description:
An interactive data story exploring how economic prosperity, life expectancy, digital connection, and life satisfaction changed after COVID.
```

---

## 21. Completion checklist

Do not stop until all applicable items pass.

### Functional

- [ ] Page loads without errors
- [ ] Vital-sign cards calculate from data
- [ ] Scatter chart renders
- [ ] Region filter works
- [ ] Country selection updates the fingerprint
- [ ] Missing data is handled
- [ ] Methodology links work
- [ ] Production build succeeds

### Visual

- [ ] Hero is panel-ready
- [ ] Clear hierarchy
- [ ] No dashboard look
- [ ] Consistent spacing
- [ ] Restrained motion
- [ ] Quadrants are immediately understandable
- [ ] Country fingerprint is memorable
- [ ] Mobile layout works

### Trust

- [ ] Dataset status is visible
- [ ] No fabricated claims
- [ ] Baseline/latest years are visible
- [ ] Sources are linked
- [ ] GenAI usage is documented
- [ ] Limitations are stated

---

## 22. Expected Codex final response

At completion, report:

1. What was created
2. Key UX decisions
3. Data mode: demo or validated
4. Files added or changed
5. Commands executed
6. Test and build results
7. How to run locally
8. How to deploy to Vercel
9. Remaining data tasks before panel presentation
10. Public URL, if deployment access is available

Do not return only code snippets. Complete the working repository.
