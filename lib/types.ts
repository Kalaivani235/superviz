export type IndicatorPoint = { year: number; value: number };

export type IndicatorSeries = {
  unit: string;
  sourceId: string;
  values: IndicatorPoint[];
  baselineYear: number;
  baselineValue: number | null;
  latestYear: number | null;
  latestValue: number | null;
  baselineYears?: number[];
  latestYears?: number[];
};

export type CountryDataset = {
  iso3: string;
  country: string;
  region: string;
  incomeGroup: string;
  population: number | null;
  populationYear: number | null;
  live: IndicatorSeries;
  thrive: IndicatorSeries;
  connect: IndicatorSeries;
  feel: IndicatorSeries;
};

export type MetricKey = "live" | "thrive" | "connect" | "feel";

export type RecoveryPath =
  | "recovered-together"
  | "prosperity-without-healing"
  | "resilient-lives"
  | "still-recovering"
  | "insufficient-data";

export type CountryRecovery = CountryDataset & {
  thrivePctChange: number | null;
  liveAbsoluteChange: number | null;
  connectPointChange: number | null;
  feelAbsoluteChange: number | null;
  recoveryPath: RecoveryPath;
};

export type Dataset = {
  mode: "demo" | "validated";
  dataAsOf?: string;
  refreshDate: string;
  baselineYear: number;
  countries: CountryDataset[];
};

export type SourceDefinition = {
  id: string;
  name: string;
  publisher: string;
  url: string;
  indicatorCode: string;
  definition: string;
  unit: string;
  license: string;
};

export type DatasetMetadata = {
  generatedAt: string;
  baselineYear: number;
  baselineNote: string;
  latestNote: string;
  missingDataNote: string;
  coverageScopeNote: string;
  sources: SourceDefinition[];
};

export type CoverageIndicatorStat = {
  countriesWithBaseline: number;
  countriesWithLatest: number;
  countriesWithBoth: number;
  earliestYear: number | null;
  latestYear: number | null;
};

export type CoverageReport = {
  generatedAt: string;
  totalCountries: number;
  excludedByPopulationCap: number;
  byIndicator: Record<MetricKey, CoverageIndicatorStat>;
  fullyCoveredCountries: number;
  regions: string[];
  regionCounts: Record<string, number>;
};

export type Story = {
  id: string;
  headline: string;
  insight: string;
  countries: string[];
  years: (number | string)[];
  metrics: MetricKey[];
  lens: LensKey;
  highlightIso3: string;
  region?: string;
};

export type StoriesFile = {
  generatedAt: string;
  stories: Story[];
};

export type LensKey = "thrive-feel" | "live-thrive" | "connect-feel";

export type LensDefinition = {
  key: LensKey;
  label: string;
  xMetric: MetricKey;
  yMetric: MetricKey;
  xLabel: string;
  yLabel: string;
};

export type HeadlineMetrics = {
  averageLiveChange: number | null;
  thriveRecoveredCount: number;
  thriveCountryCount: number;
  averageConnectChange: number | null;
  averageFeelChange: number | null;
};
