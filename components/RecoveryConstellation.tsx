"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { ScatterChart } from "echarts/charts";
import { AriaComponent, GraphicComponent, GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { CountryRecovery } from "@/lib/types";
import { formatPopulation, formatSigned, PATH_LABELS } from "@/lib/formatting";
import { hasPlottableRecovery } from "@/lib/calculations";

echarts.use([ScatterChart, GridComponent, TooltipComponent, AriaComponent, GraphicComponent, CanvasRenderer]);

const REGION_COLORS: Record<string, string> = {
  Africa: "#ff8f7f",
  Asia: "#63d8e5",
  Europe: "#b8a7ff",
  "North America": "#ffd178",
  "South America": "#7ce2a6",
  Oceania: "#79a9ff",
};

const PATH_SYMBOLS: Record<string, string> = {
  "recovered-together": "circle",
  "prosperity-without-healing": "diamond",
  "resilient-lives": "rect",
  "still-recovering": "triangle",
};

type Props = {
  recoveries: CountryRecovery[];
  selectedIso3: string;
  onSelect: (iso3: string) => void;
};

type ChartDatum = {
  value: [number, number, number];
  iso3: string;
  country: CountryRecovery;
  symbol: string;
  itemStyle: { color: string; borderColor: string; borderWidth: number; opacity: number; shadowBlur?: number; shadowColor?: string };
};

export default function RecoveryConstellation({ recoveries, selectedIso3, onSelect }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState("All regions");
  const [hoveredIso3, setHoveredIso3] = useState<string | null>(null);

  const regions = useMemo(
    () => ["All regions", ...Array.from(new Set(recoveries.map((country) => country.region))).sort()],
    [recoveries],
  );

  const filtered = useMemo(
    () => recoveries.filter(hasPlottableRecovery).filter((country) => region === "All regions" || country.region === region),
    [recoveries, region],
  );

  const activeCountry = recoveries.find((country) => country.iso3 === (hoveredIso3 ?? selectedIso3));

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    const populations = filtered.map((country) => country.population);
    const minPopulation = Math.min(...populations);
    const maxPopulation = Math.max(...populations);
    const bubbleSize = (population: number) => {
      if (maxPopulation === minPopulation) return 28;
      const ratio = (Math.sqrt(population) - Math.sqrt(minPopulation)) / (Math.sqrt(maxPopulation) - Math.sqrt(minPopulation));
      return 16 + ratio * 38;
    };

    const data: ChartDatum[] = filtered.map((country) => ({
      value: [country.thrivePctChange as number, country.feelAbsoluteChange as number, country.population],
      iso3: country.iso3,
      country,
      symbol: PATH_SYMBOLS[country.recoveryPath] ?? "circle",
      itemStyle: {
        color: REGION_COLORS[country.region] ?? "#aab6c5",
        borderColor: country.iso3 === selectedIso3 ? "#ffffff" : "#07111f",
        borderWidth: country.iso3 === selectedIso3 ? 4 : 2,
        opacity: 0.88,
        ...(country.iso3 === selectedIso3 ? { shadowBlur: 18, shadowColor: REGION_COLORS[country.region] } : {}),
      },
    }));

    chart.setOption({
      animationDuration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850,
      animationEasing: "cubicOut",
      aria: { enabled: true, decal: { show: true }, description: "Scatter chart comparing GDP per capita percentage change on the horizontal axis with life satisfaction change on the vertical axis." },
      grid: { left: 64, right: 34, top: 54, bottom: 62, containLabel: false },
      tooltip: {
        trigger: "item",
        backgroundColor: "#102236",
        borderColor: "#31455c",
        textStyle: { color: "#f5f0e8", fontFamily: "sans-serif" },
        extraCssText: "border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:14px 16px;max-width:280px",
        formatter: (params: unknown) => {
          const datum = (params as { data: ChartDatum }).data;
          const country = datum.country;
          return `<strong style="font-size:15px">${country.country}</strong><br/><span style="color:#aab6c5">${country.region} · ${PATH_LABELS[country.recoveryPath]}</span><br/><br/>THRIVE&nbsp; ${formatSigned(country.thrivePctChange, 1, "%")}<br/>FEEL&nbsp;&nbsp;&nbsp;&nbsp; ${formatSigned(country.feelAbsoluteChange, 2)} pts<br/>LIVE&nbsp;&nbsp;&nbsp;&nbsp; ${formatSigned(country.liveAbsoluteChange, 1)} yrs<br/>CONNECT&nbsp; ${formatSigned(country.connectPointChange, 1)} pp`;
        },
      },
      xAxis: {
        type: "value",
        name: "GDP PER PERSON · % CHANGE",
        nameLocation: "middle",
        nameGap: 39,
        nameTextStyle: { color: "#aab6c5", fontSize: 11, fontWeight: 700, letterSpacing: 1.4 },
        axisLine: { lineStyle: { color: "#667487" } },
        axisLabel: { color: "#aab6c5", formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,.07)" } },
      },
      yAxis: {
        type: "value",
        name: "LIFE SATISFACTION · POINT CHANGE",
        nameLocation: "middle",
        nameGap: 48,
        nameTextStyle: { color: "#aab6c5", fontSize: 11, fontWeight: 700, letterSpacing: 1.2 },
        axisLine: { lineStyle: { color: "#667487" } },
        axisLabel: { color: "#aab6c5" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,.07)" } },
      },
      graphic: [
        { type: "text", right: "7%", top: 18, silent: true, style: { text: "○  RECOVERED TOGETHER", fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
        { type: "text", left: 72, top: 18, silent: true, style: { text: "□  RESILIENT LIVES", fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
        { type: "text", right: "7%", bottom: 18, silent: true, style: { text: "◇  PROSPERITY WITHOUT HEALING", fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
        { type: "text", left: 72, bottom: 18, silent: true, style: { text: "△  STILL RECOVERING", fill: "rgba(245,240,232,.58)", font: "700 10px sans-serif" } },
      ],
      series: [{
        type: "scatter",
        data,
        symbolSize: (value: number[]) => bubbleSize(value[2]),
        emphasis: { focus: "self", scale: 1.18 },
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          lineStyle: { color: "rgba(245,240,232,.35)", width: 1.3 },
          data: [{ xAxis: 0 }, { yAxis: 0 }],
        },
      }],
    });

    chart.on("click", (params: unknown) => {
      const datum = (params as { data?: ChartDatum }).data;
      if (datum?.iso3) onSelect(datum.iso3);
    });
    chart.on("mouseover", (params: unknown) => {
      const datum = (params as { data?: ChartDatum }).data;
      if (datum?.iso3) setHoveredIso3(datum.iso3);
    });
    chart.on("globalout", () => setHoveredIso3(null));

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);
    return () => { resizeObserver.disconnect(); chart.dispose(); };
  }, [filtered, selectedIso3, onSelect]);

  return (
    <div className="constellation-wrap">
      <div className="chart-toolbar">
        <div>
          <label htmlFor="region-filter">View region</label>
          <select id="region-filter" value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div className="region-legend" aria-label="Region color legend">
          {Object.entries(REGION_COLORS).map(([name, color]) => <span key={name}><i style={{ background: color }} />{name}</span>)}
        </div>
      </div>
      {filtered.length ? (
        <>
          <div ref={chartRef} className="constellation-chart" role="img" aria-label="Recovery Constellation scatter chart. Use the country controls below for keyboard exploration." />
          <div className="chart-readout" aria-live="polite">
            {activeCountry && <><strong>{activeCountry.country}</strong><span>{PATH_LABELS[activeCountry.recoveryPath]}</span><span>GDP {formatSigned(activeCountry.thrivePctChange, 1, "%")}</span><span>Feel {formatSigned(activeCountry.feelAbsoluteChange, 2)}</span><span>Population {formatPopulation(activeCountry.population)}</span></>}
          </div>
          <div className="country-keyboard-list" aria-label="Keyboard country exploration">
            {filtered.map((country) => (
              <button key={country.iso3} type="button" className={country.iso3 === selectedIso3 ? "is-selected" : ""} onFocus={() => setHoveredIso3(country.iso3)} onBlur={() => setHoveredIso3(null)} onMouseEnter={() => setHoveredIso3(country.iso3)} onMouseLeave={() => setHoveredIso3(null)} onClick={() => onSelect(country.iso3)} aria-pressed={country.iso3 === selectedIso3}>
                <i style={{ background: REGION_COLORS[country.region] }} />{country.country}
              </button>
            ))}
          </div>
        </>
      ) : <div className="chart-empty">No countries in this region have both GDP and life-satisfaction values.</div>}
      <p className="chart-caption"><span>Bubble area represents population.</span><span>Shape represents recovery path: ○ together · ◇ prosperity without healing · □ resilient lives · △ still recovering.</span></p>
    </div>
  );
}
