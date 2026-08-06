"use client";

import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts/core";
import { LinesChart, ScatterChart } from "echarts/charts";
import { AriaComponent, GraphicComponent, GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { changeAsOfYear } from "@/lib/calculations";
import { LENS_QUADRANTS, REGION_COLORS } from "@/lib/constants";
import { formatPopulation, formatSigned, shortRegionLabel } from "@/lib/formatting";
import type { CountryDataset, LensDefinition } from "@/lib/types";

echarts.use([ScatterChart, LinesChart, GridComponent, TooltipComponent, AriaComponent, GraphicComponent, CanvasRenderer]);

/**
 * A handful of extreme outliers (e.g. a resource-boom economy growing GDP
 * several hundred percent) would otherwise stretch the axis so far that
 * every ordinary country collapses into a sliver near zero. Bounds are
 * computed from the 5th-95th percentile of the currently plotted set, then
 * widened to include whichever country is selected/hovered/compared so
 * selecting an outlier still brings it into view.
 */
function percentileBounds(values: number[], focusValues: number[]): [number, number] | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const lower = sorted[Math.floor(0.05 * (sorted.length - 1))];
  const upper = sorted[Math.ceil(0.95 * (sorted.length - 1))];
  const span = upper - lower || Math.abs(upper) || 1;
  let min = lower - span * 0.18;
  let max = upper + span * 0.18;
  for (const value of focusValues) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const finalSpan = max - min || 1;
  return [min - finalSpan * 0.06, max + finalSpan * 0.06];
}

type PlottedCountry = {
  country: CountryDataset;
  x: number;
  y: number;
  baselineX: number | null;
  baselineY: number | null;
  xExact: boolean;
  yExact: boolean;
};

type Props = {
  countries: CountryDataset[];
  lens: LensDefinition;
  year: number;
  region: string;
  selectedIso3: string | null;
  hoveredIso3: string | null;
  compareIso3?: string | null;
  onSelect: (iso3: string) => void;
  onHover: (iso3: string | null) => void;
};

export default function RecoveryOrbit({
  countries,
  lens,
  year,
  region,
  selectedIso3,
  hoveredIso3,
  compareIso3,
  onSelect,
  onHover,
}: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  const plotted: PlottedCountry[] = useMemo(() => {
    const results: PlottedCountry[] = [];
    for (const country of countries) {
      if (region !== "All regions" && country.region !== region) continue;
      const xChange = changeAsOfYear(country, lens.xMetric, year);
      const yChange = changeAsOfYear(country, lens.yMetric, year);
      const xBaseline = changeAsOfYear(country, lens.xMetric, country[lens.xMetric].baselineYear);
      const yBaseline = changeAsOfYear(country, lens.yMetric, country[lens.yMetric].baselineYear);
      if (!xChange || !yChange) continue;
      results.push({
        country,
        x: xChange.value,
        y: yChange.value,
        baselineX: xBaseline ? xBaseline.value : null,
        baselineY: yBaseline ? yBaseline.value : null,
        xExact: xChange.isExact,
        yExact: yChange.isExact,
      });
    }
    return results;
  }, [countries, lens, year, region]);

  const quadrant = LENS_QUADRANTS[lens.key];
  const activeIso3 = hoveredIso3 ?? selectedIso3;
  const activeCountry = plotted.find((p) => p.country.iso3 === activeIso3);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });

    const populations = plotted.map((p) => p.country.population ?? 0).filter((v) => v > 0);
    const minPop = populations.length ? Math.min(...populations) : 0;
    const maxPop = populations.length ? Math.max(...populations) : 1;
    const bubbleSize = (population: number | null) => {
      if (!population || maxPop === minPop) return 22;
      const ratio = (Math.sqrt(population) - Math.sqrt(minPop)) / (Math.sqrt(maxPop) - Math.sqrt(minPop));
      return 14 + ratio * 40;
    };

    const isDimmed = (iso3: string) => {
      if (!activeIso3 && !compareIso3) return false;
      return iso3 !== activeIso3 && iso3 !== compareIso3;
    };

    const focusPoints = plotted.filter((p) => [activeIso3, compareIso3].includes(p.country.iso3));
    const xBounds = percentileBounds(
      plotted.map((p) => p.x),
      focusPoints.map((p) => p.x),
    );
    const yBounds = percentileBounds(
      plotted.map((p) => p.y),
      focusPoints.map((p) => p.y),
    );

    const withBaseline = plotted.filter(
      (p): p is PlottedCountry & { baselineX: number; baselineY: number } => p.baselineX !== null && p.baselineY !== null,
    );

    const trailData = withBaseline
      .filter((p) => p.x !== p.baselineX || p.y !== p.baselineY)
      .map((p) => ({
        coords: [
          [p.baselineX, p.baselineY],
          [p.x, p.y],
        ],
        iso3: p.country.iso3,
        lineStyle: {
          color: REGION_COLORS[p.country.region] ?? "#aab6c5",
          opacity: isDimmed(p.country.iso3) ? 0.06 : p.country.iso3 === activeIso3 ? 0.75 : 0.22,
          width: p.country.iso3 === activeIso3 ? 2.4 : 1.2,
          curveness: 0.08,
        },
      }));

    const baselineDots = withBaseline.map((p) => ({
      value: [p.baselineX, p.baselineY],
      iso3: p.country.iso3,
      itemStyle: {
        color: "transparent",
        borderColor: REGION_COLORS[p.country.region] ?? "#aab6c5",
        borderWidth: 1.2,
        opacity: isDimmed(p.country.iso3) ? 0.08 : 0.45,
      },
      symbolSize: 6,
      silent: true,
    }));

    const currentDots = plotted.map((p) => {
      const isSelected = p.country.iso3 === selectedIso3;
      const isHovered = p.country.iso3 === hoveredIso3;
      const isCompare = p.country.iso3 === compareIso3;
      return {
        value: [p.x, p.y, p.country.population ?? 0],
        iso3: p.country.iso3,
        country: p.country,
        symbolSize: bubbleSize(p.country.population),
        itemStyle: {
          color: REGION_COLORS[p.country.region] ?? "#aab6c5",
          borderColor: isSelected || isCompare ? "#ffffff" : "#1b212b",
          borderWidth: isSelected || isCompare ? 3.5 : 1.5,
          opacity: isDimmed(p.country.iso3) ? 0.18 : 0.9,
          shadowBlur: isSelected || isHovered ? 20 : 0,
          shadowColor: REGION_COLORS[p.country.region],
        },
        label:
          isSelected || isHovered || isCompare
            ? {
                show: true,
                formatter: p.country.country,
                position: "top" as const,
                distance: 10,
                color: "#f5f0e8",
                fontWeight: 700,
                fontSize: 12,
              }
            : { show: false },
      };
    });

    chart.setOption({
      animationDuration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
      animationEasing: "cubicOut",
      aria: {
        enabled: true,
        description: `Recovery Orbit scatter chart. ${lens.xLabel} on the horizontal axis, ${lens.yLabel} on the vertical axis. Use the country list below the chart for keyboard exploration.`,
      },
      grid: { left: 64, right: 34, top: 54, bottom: 62, containLabel: false },
      tooltip: {
        trigger: "item",
        backgroundColor: "#242c39",
        borderColor: "#3d4757",
        textStyle: { color: "#f5f0e8", fontFamily: "sans-serif" },
        extraCssText: "border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:14px 16px;max-width:300px",
        formatter: (params: unknown) => {
          const datum = (params as { data?: { country?: CountryDataset; value: number[] } }).data;
          if (!datum?.country) return "";
          const c = datum.country;
          return `<strong style="font-size:15px">${c.country}</strong><br/><span style="color:#aab6c5">${shortRegionLabel(c.region)}</span><br/><br/>${lens.xLabel.split(" ·")[0]}&nbsp; ${formatSigned(datum.value[0], 1, lens.xMetric === "thrive" ? "%" : "")}<br/>${lens.yLabel.split(" ·")[0]}&nbsp; ${formatSigned(datum.value[1], 1, "")}<br/>Population&nbsp; ${formatPopulation(c.population ?? 0)}`;
        },
      },
      xAxis: {
        type: "value",
        name: lens.xLabel,
        nameLocation: "middle",
        nameGap: 39,
        nameTextStyle: { color: "#aab6c5", fontSize: 11, fontWeight: 700, letterSpacing: 1.4 },
        axisLine: { lineStyle: { color: "#667487" } },
        axisLabel: { color: "#aab6c5" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,.07)" } },
        min: xBounds?.[0],
        max: xBounds?.[1],
      },
      yAxis: {
        type: "value",
        name: lens.yLabel,
        nameLocation: "middle",
        nameGap: 48,
        nameTextStyle: { color: "#aab6c5", fontSize: 11, fontWeight: 700, letterSpacing: 1.2 },
        axisLine: { lineStyle: { color: "#667487" } },
        axisLabel: { color: "#aab6c5" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,.07)" } },
        min: yBounds?.[0],
        max: yBounds?.[1],
      },
      graphic: [
        { type: "text", right: "7%", top: 18, silent: true, style: { text: quadrant.both, fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
        { type: "text", left: 72, top: 18, silent: true, style: { text: quadrant.yOnly, fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
        { type: "text", right: "7%", bottom: 18, silent: true, style: { text: quadrant.xOnly, fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
        { type: "text", left: 72, bottom: 18, silent: true, style: { text: quadrant.neither, fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
      ],
      series: [
        {
          type: "lines",
          coordinateSystem: "cartesian2d",
          data: trailData,
          silent: true,
          effect: { show: false },
          zlevel: 1,
        },
        {
          type: "scatter",
          data: baselineDots,
          symbol: "circle",
          zlevel: 1,
          markLine: {
            silent: true,
            symbol: "none",
            label: { show: false },
            lineStyle: { color: "rgba(245,240,232,.35)", width: 1.3 },
            data: [{ xAxis: 0 }, { yAxis: 0 }],
          },
        },
        {
          type: "scatter",
          data: currentDots,
          zlevel: 2,
          emphasis: { focus: "self", scale: 1.15 },
        },
      ],
    });

    chart.on("click", { seriesIndex: 2 }, (params: unknown) => {
      const datum = (params as { data?: { iso3?: string } }).data;
      if (datum?.iso3) onSelect(datum.iso3);
    });
    chart.on("mouseover", { seriesIndex: 2 }, (params: unknown) => {
      const datum = (params as { data?: { iso3?: string } }).data;
      if (datum?.iso3) onHover(datum.iso3);
    });
    chart.on("globalout", () => onHover(null));

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotted, lens, selectedIso3, hoveredIso3, compareIso3, activeIso3]);

  const legendRegions = Array.from(new Set(countries.map((c) => c.region))).sort();

  return (
    <div className="orbit-wrap">
      <div className="region-legend" aria-label="Region color legend">
        {legendRegions.map((name) => (
          <span key={name}>
            <i style={{ background: REGION_COLORS[name] }} />
            {shortRegionLabel(name)}
          </span>
        ))}
      </div>
      {plotted.length ? (
        <>
          <div
            ref={chartRef}
            className="orbit-chart"
            role="img"
            aria-label={`Recovery Orbit. ${lens.xLabel} versus ${lens.yLabel}, year ${year}. Use the country list below for keyboard exploration.`}
          />
          <div className="chart-readout" aria-live="polite">
            {activeCountry && (
              <>
                <strong>{activeCountry.country.country}</strong>
                <span>
                  {lens.xLabel.split(" ·")[0]} {formatSigned(activeCountry.x, 1, lens.xMetric === "thrive" ? "%" : "")}
                </span>
                <span>
                  {lens.yLabel.split(" ·")[0]} {formatSigned(activeCountry.y, 1, "")}
                </span>
                {(!activeCountry.xExact || !activeCountry.yExact) && (
                  <span className="chart-readout-note">Carried forward from the most recent available year.</span>
                )}
              </>
            )}
          </div>
          <div className="country-keyboard-list" aria-label="Keyboard country exploration">
            {plotted
              .slice()
              .sort((a, b) => a.country.country.localeCompare(b.country.country))
              .map((p) => (
                <button
                  key={p.country.iso3}
                  type="button"
                  className={p.country.iso3 === selectedIso3 ? "is-selected" : ""}
                  onFocus={() => onHover(p.country.iso3)}
                  onBlur={() => onHover(null)}
                  onMouseEnter={() => onHover(p.country.iso3)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelect(p.country.iso3)}
                  aria-pressed={p.country.iso3 === selectedIso3}
                >
                  <i style={{ background: REGION_COLORS[p.country.region] }} />
                  {p.country.country}
                </button>
              ))}
          </div>
        </>
      ) : (
        <div className="chart-empty">
          No countries in this region have both {lens.xLabel.split(" ·")[0].toLowerCase()} and{" "}
          {lens.yLabel.split(" ·")[0].toLowerCase()} data for {year}.
        </div>
      )}
      <p className="chart-caption">
        <span>Bubble area represents population. Faint ring marks each country&apos;s {countries[0]?.thrive.baselineYear ?? 2019} baseline; the line traces its path to {year}.</span>
        <span>Axes are scaled to the typical range so extreme outliers don&apos;t compress every other country — select or search a country to bring it into view.</span>
      </p>
    </div>
  );
}
