// Downloads raw source data for the Recovery Atlas dataset.
// All sources are public and require no authentication.
// Run with: node scripts/fetch-data.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const RAW_DIR = path.resolve(import.meta.dirname, "../data/raw");

const WB_INDICATORS = {
  gdp: "NY.GDP.PCAP.KD",
  life: "SP.DYN.LE00.IN",
  internet: "IT.NET.USER.ZS",
  population: "SP.POP.TOTL",
};

const YEAR_RANGE = "2015:2025";

async function fetchJson(url, attempt = 1) {
  const res = await fetch(url, { headers: { "user-agent": "recovery-atlas-data-pipeline" } });
  if (!res.ok) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }
  return res.json();
}

async function fetchText(url, attempt = 1) {
  const res = await fetch(url, { headers: { "user-agent": "recovery-atlas-data-pipeline" } });
  if (!res.ok) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      return fetchText(url, attempt + 1);
    }
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }
  return res.text();
}

async function fetchWorldBankIndicatorAllPages(indicatorCode) {
  const first = await fetchJson(
    `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?format=json&per_page=20000&date=${YEAR_RANGE}`,
  );
  const [meta, rows] = first;
  const pages = meta?.pages ?? 1;
  let allRows = rows ?? [];
  for (let page = 2; page <= pages; page += 1) {
    const [, moreRows] = await fetchJson(
      `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?format=json&per_page=20000&date=${YEAR_RANGE}&page=${page}`,
    );
    allRows = allRows.concat(moreRows ?? []);
  }
  return allRows;
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });

  console.log("Fetching World Bank country metadata...");
  const [, countries] = await fetchJson("https://api.worldbank.org/v2/country?format=json&per_page=400");
  await writeFile(path.join(RAW_DIR, "wb-countries.json"), JSON.stringify(countries, null, 2));
  console.log(`  saved ${countries.length} entries`);

  for (const [key, code] of Object.entries(WB_INDICATORS)) {
    console.log(`Fetching World Bank indicator ${code} (${key})...`);
    const rows = await fetchWorldBankIndicatorAllPages(code);
    await writeFile(path.join(RAW_DIR, `wb-${key}.json`), JSON.stringify(rows, null, 2));
    console.log(`  saved ${rows.length} records`);
  }

  console.log("Fetching World Happiness Report life-evaluation series (via Our World in Data)...");
  const happinessCsv = await fetchText("https://ourworldindata.org/grapher/happiness-cantril-ladder.csv");
  await writeFile(path.join(RAW_DIR, "happiness-cantril-ladder.csv"), happinessCsv);
  let happinessMeta = null;
  try {
    happinessMeta = await fetchText("https://ourworldindata.org/grapher/happiness-cantril-ladder.metadata.json");
    await writeFile(path.join(RAW_DIR, "happiness-cantril-ladder.metadata.json"), happinessMeta);
  } catch (error) {
    console.warn("  could not fetch OWID metadata json (non-fatal):", error.message);
  }
  console.log(`  saved ${happinessCsv.split("\n").length - 1} rows`);

  console.log("\nDone. Raw sources saved to data/raw/.");
}

main().catch((error) => {
  console.error("fetch-data failed:", error);
  process.exitCode = 1;
});
