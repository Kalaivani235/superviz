import type {
  CountryDataset,
  CountryRecovery,
  HeadlineMetrics,
  IndicatorPoint,
  IndicatorSeries,
  MetricKey,
  RecoveryPath,
} from "./types";

const finiteOrNull = (value: number | null): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function percentageChange(
  baseline: number | null,
  latest: number | null,
): number | null {
  const safeBaseline = finiteOrNull(baseline);
  const safeLatest = finiteOrNull(latest);
  if (safeBaseline === null || safeLatest === null || safeBaseline === 0) return null;
  return ((safeLatest - safeBaseline) / safeBaseline) * 100;
}

export function absoluteChange(
  baseline: number | null,
  latest: number | null,
): number | null {
  const safeBaseline = finiteOrNull(baseline);
  const safeLatest = finiteOrNull(latest);
  if (safeBaseline === null || safeLatest === null) return null;
  return safeLatest - safeBaseline;
}

export function classifyRecoveryPath(
  thriveChange: number | null,
  feelChange: number | null,
): RecoveryPath {
  if (thriveChange === null || feelChange === null) return "insufficient-data";
  if (thriveChange >= 0 && feelChange >= 0) return "recovered-together";
  if (thriveChange >= 0 && feelChange < 0) return "prosperity-without-healing";
  if (thriveChange < 0 && feelChange >= 0) return "resilient-lives";
  return "still-recovering";
}

export function deriveCountryRecovery(country: CountryDataset): CountryRecovery {
  const thrivePctChange = percentageChange(country.thrive.baselineValue, country.thrive.latestValue);
  const liveAbsoluteChange = absoluteChange(country.live.baselineValue, country.live.latestValue);
  const connectPointChange = absoluteChange(country.connect.baselineValue, country.connect.latestValue);
  const feelAbsoluteChange = absoluteChange(country.feel.baselineValue, country.feel.latestValue);

  return {
    ...country,
    thrivePctChange,
    liveAbsoluteChange,
    connectPointChange,
    feelAbsoluteChange,
    recoveryPath: classifyRecoveryPath(thrivePctChange, feelAbsoluteChange),
  };
}

function mean(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  return available.length
    ? available.reduce((sum, value) => sum + value, 0) / available.length
    : null;
}

export function aggregateHeadlineMetrics(recoveries: CountryRecovery[]): HeadlineMetrics {
  const gdpValues = recoveries
    .map((country) => country.thrivePctChange)
    .filter((value): value is number => value !== null);

  return {
    averageLiveChange: mean(recoveries.map((country) => country.liveAbsoluteChange)),
    thriveRecoveredCount: gdpValues.filter((value) => value >= 0).length,
    thriveCountryCount: gdpValues.length,
    averageConnectChange: mean(recoveries.map((country) => country.connectPointChange)),
    averageFeelChange: mean(recoveries.map((country) => country.feelAbsoluteChange)),
  };
}

export function hasPlottableRecovery(country: CountryRecovery): boolean {
  return country.thrivePctChange !== null && country.feelAbsoluteChange !== null;
}

export function hasIndicatorValues(indicator: IndicatorSeries): boolean {
  return indicator.baselineValue !== null || indicator.latestValue !== null;
}

/**
 * Most recent actual observation at or before `year`. Never interpolates —
 * returns null if the series has no observation on or before that year.
 * `isExact` tells the caller whether the value is genuinely from `year`
 * or carried forward from an earlier observation (must be labeled as such).
 */
export function pointAsOfYear(
  series: IndicatorSeries,
  year: number,
): (IndicatorPoint & { isExact: boolean }) | null {
  let result: IndicatorPoint | null = null;
  for (const point of series.values) {
    if (point.year > year) break;
    result = point;
  }
  if (!result) return null;
  return { ...result, isExact: result.year === year };
}

export function seriesYearRange(series: IndicatorSeries): [number, number] | null {
  if (!series.values.length) return null;
  return [series.values[0].year, series.values[series.values.length - 1].year];
}

export type YearChange = { value: number; year: number; isExact: boolean; baselineYear: number };

/**
 * Change from the series' baseline reading to its reading as-of `year`
 * (most recent actual observation at or before `year`). THRIVE is expressed
 * as percentage change; LIVE, CONNECT and FEEL as absolute change. Returns
 * null if either endpoint has no observation — never fabricated.
 */
export function changeAsOfYear(
  country: CountryDataset,
  metric: MetricKey,
  year: number,
): YearChange | null {
  const series = country[metric];
  const baseline = pointAsOfYear(series, series.baselineYear);
  const current = pointAsOfYear(series, year);
  if (!baseline || !current) return null;
  const value = metric === "thrive"
    ? percentageChange(baseline.value, current.value)
    : absoluteChange(baseline.value, current.value);
  if (value === null) return null;
  return { value, year: current.year, isExact: current.isExact, baselineYear: baseline.year };
}

export function datasetYearRange(countries: CountryDataset[], metrics: MetricKey[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const country of countries) {
    for (const metric of metrics) {
      const range = seriesYearRange(country[metric]);
      if (!range) continue;
      min = Math.min(min, range[0]);
      max = Math.max(max, range[1]);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [2019, 2019];
  return [min, max];
}
