import type {
  CountryRecovery,
  HeadlineMetrics,
  IndicatorValue,
  PilotCountry,
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
  gdpChange: number | null,
  feelChange: number | null,
): RecoveryPath {
  if (gdpChange === null || feelChange === null) return "insufficient-data";
  if (gdpChange >= 0 && feelChange >= 0) return "recovered-together";
  if (gdpChange >= 0 && feelChange < 0) return "prosperity-without-healing";
  if (gdpChange < 0 && feelChange >= 0) return "resilient-lives";
  return "still-recovering";
}

export function deriveCountryRecovery(country: PilotCountry): CountryRecovery {
  const thrivePctChange = percentageChange(
    country.thrive.baselineValue,
    country.thrive.latestValue,
  );
  const liveAbsoluteChange = absoluteChange(
    country.live.baselineValue,
    country.live.latestValue,
  );
  const connectPointChange = absoluteChange(
    country.connect.baselineValue,
    country.connect.latestValue,
  );
  const feelAbsoluteChange = absoluteChange(
    country.feel.baselineValue,
    country.feel.latestValue,
  );

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

export function aggregateHeadlineMetrics(
  recoveries: CountryRecovery[],
): HeadlineMetrics {
  const gdpValues = recoveries
    .map((country) => country.thrivePctChange)
    .filter((value): value is number => value !== null);

  return {
    averageLiveChange: mean(recoveries.map((country) => country.liveAbsoluteChange)),
    thriveRecoveredCount: gdpValues.filter((value) => value >= 0).length,
    thriveCountryCount: gdpValues.length,
    averageConnectChange: mean(
      recoveries.map((country) => country.connectPointChange),
    ),
    averageFeelChange: mean(recoveries.map((country) => country.feelAbsoluteChange)),
  };
}

export function hasPlottableRecovery(country: CountryRecovery): boolean {
  return country.thrivePctChange !== null && country.feelAbsoluteChange !== null;
}

export function hasIndicatorValues(indicator: IndicatorValue): boolean {
  return absoluteChange(indicator.baselineValue, indicator.latestValue) !== null;
}
