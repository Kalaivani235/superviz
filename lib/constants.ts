import type { LensDefinition, LensKey, MetricKey } from "./types";

export const REGION_COLORS: Record<string, string> = {
  "East Asia & Pacific": "#5fd3e0",
  "Europe & Central Asia": "#9c8cff",
  "Latin America & Caribbean": "#ffc85c",
  "Middle East, North Africa, Afghanistan & Pakistan": "#ff8b7a",
  "North America": "#6fb4ff",
  "South Asia": "#7be39a",
  "Sub-Saharan Africa": "#ff8fc4",
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
