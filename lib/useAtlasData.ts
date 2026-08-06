"use client";

import { useEffect, useState } from "react";
import type { CoverageReport, Dataset, DatasetMetadata, StoriesFile } from "./types";

export type AtlasData = {
  dataset: Dataset;
  metadata: DatasetMetadata;
  coverage: CoverageReport;
  stories: StoriesFile;
};

export type AtlasDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AtlasData };

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json() as Promise<T>;
}

export function useAtlasData(): AtlasDataState {
  const [state, setState] = useState<AtlasDataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [dataset, metadata, coverage, stories] = await Promise.all([
          fetchJson<Dataset>("/data/countries.json"),
          fetchJson<DatasetMetadata>("/data/metadata.json"),
          fetchJson<CoverageReport>("/data/coverage.json"),
          fetchJson<StoriesFile>("/data/stories.json"),
        ]);
        if (cancelled) return;
        setState({ status: "ready", data: { dataset, metadata, coverage, stories } });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load the dataset.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
