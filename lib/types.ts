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

export type RecoveryPath =
  | "recovered-together"
  | "prosperity-without-healing"
  | "resilient-lives"
  | "still-recovering"
  | "insufficient-data";

export type CountryRecovery = PilotCountry & {
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
  countries: PilotCountry[];
};

export type DataSource = {
  id: string;
  name: string;
  url: string;
};

export type HeadlineMetrics = {
  averageLiveChange: number | null;
  thriveRecoveredCount: number;
  thriveCountryCount: number;
  averageConnectChange: number | null;
  averageFeelChange: number | null;
};
