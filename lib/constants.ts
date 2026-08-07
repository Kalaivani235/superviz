import type { LensDefinition, LensKey, MetricKey } from "./types";

export const REGION_COLORS: Record<string, string> = {
  "East Asia & Pacific": "#1f9aab",
  "Europe & Central Asia": "#7457e0",
  "Latin America & Caribbean": "#c78a1f",
  "Middle East, North Africa, Afghanistan & Pakistan": "#d95d47",
  "North America": "#2d6fc4",
  "South Asia": "#2f9a5c",
  "Sub-Saharan Africa": "#c94f8e",
};

export const REGION_ORDER = Object.keys(REGION_COLORS);

export const METRIC_LABELS: Record<MetricKey, string> = {
  live: "LIVE",
  thrive: "THRIVE",
  connect: "CONNECT",
  feel: "FEEL",
};

export const METRIC_FULL_LABELS: Record<MetricKey, string> = {
  live: "Life expectancy",
  thrive: "Real GDP per person",
  connect: "Internet participation",
  feel: "Life satisfaction",
};

export const METRIC_COLORS: Record<MetricKey, string> = {
  live: "var(--recovery-cyan)",
  thrive: "var(--prosperity-gold)",
  connect: "var(--connection-blue)",
  feel: "var(--wellbeing-lavender)",
};

export const METRIC_UNITS_SHORT: Record<MetricKey, string> = {
  live: " yrs",
  thrive: "%",
  connect: " pp",
  feel: " pts",
};

// Rough "typical extreme" per metric, used only to position a change value
// along a -1..1 visual track (recovery-profile bars, compare rows, story
// mini-charts) — not a statistical scale, just a shared visual convention.
export const METRIC_MAGNITUDE: Record<MetricKey, number> = {
  thrive: 30,
  live: 3,
  connect: 30,
  feel: 1.5,
};

export const METRIC_CHANGE_KEY = {
  live: "liveAbsoluteChange",
  thrive: "thrivePctChange",
  connect: "connectPointChange",
  feel: "feelAbsoluteChange",
} as const satisfies Record<MetricKey, string>;

export const LENSES: LensDefinition[] = [
  {
    key: "thrive-feel",
    label: "Prosperity vs. wellbeing",
    xMetric: "thrive",
    yMetric: "feel",
    xLabel: "GDP PER PERSON · % CHANGE",
    yLabel: "LIFE SATISFACTION · POINT CHANGE",
  },
  {
    key: "live-thrive",
    label: "Health vs. prosperity",
    xMetric: "thrive",
    yMetric: "live",
    xLabel: "GDP PER PERSON · % CHANGE",
    yLabel: "LIFE EXPECTANCY · YEAR CHANGE",
  },
  {
    key: "connect-feel",
    label: "Digital access vs. wellbeing",
    xMetric: "connect",
    yMetric: "feel",
    xLabel: "INTERNET PARTICIPATION · POINT CHANGE",
    yLabel: "LIFE SATISFACTION · POINT CHANGE",
  },
];

export const LENS_QUADRANTS: Record<LensKey, { both: string; xOnly: string; yOnly: string; neither: string }> = {
  "thrive-feel": {
    both: "○  RECOVERED TOGETHER",
    xOnly: "◇  PROSPERITY WITHOUT HEALING",
    yOnly: "□  RESILIENT LIVES",
    neither: "△  STILL RECOVERING",
  },
  "live-thrive": {
    both: "○  HEALTH & PROSPERITY TOGETHER",
    xOnly: "◇  PROSPERITY WITHOUT HEALTH GAINS",
    yOnly: "□  HEALTH HELD, ECONOMY LAGGED",
    neither: "△  BOTH STILL RECOVERING",
  },
  "connect-feel": {
    both: "○  CONNECTED & CONTENT",
    xOnly: "◇  CONNECTED WITHOUT CONTENTMENT",
    yOnly: "□  CONTENT WITHOUT CONNECTION",
    neither: "△  DISCONNECTED & DISCONTENT",
  },
};

export const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "explore", label: "Explore" },
  { id: "timeline", label: "Timeline" },
  { id: "compare", label: "Compare" },
  { id: "stories", label: "Stories" },
  { id: "methodology", label: "Methodology" },
] as const;
