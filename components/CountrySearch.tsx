"use client";

import { useId, useState } from "react";
import type { CountryDataset } from "@/lib/types";

type Props = {
  countries: CountryDataset[];
  onSelect: (iso3: string) => void;
  label: string;
  placeholder?: string;
  compact?: boolean;
};

export default function CountrySearch({ countries, onSelect, label, placeholder, compact }: Props) {
  const listId = useId();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [notFound, setNotFound] = useState(false);

  const resolve = (raw: string) => {
    const query = raw.trim().toLowerCase();
    if (!query) return null;
    return (
      countries.find((c) => c.country.toLowerCase() === query || c.iso3.toLowerCase() === query) ??
      countries.find((c) => c.country.toLowerCase().startsWith(query)) ??
      null
    );
  };

  const commit = (raw: string) => {
    const match = resolve(raw);
    if (match) {
      onSelect(match.iso3);
      setValue("");
      setNotFound(false);
    } else if (raw.trim()) {
      setNotFound(true);
    }
  };

  return (
    <form
      className={`country-search${compact ? " country-search--compact" : ""}`}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        commit(value);
      }}
    >
      <label htmlFor={inputId}>{label}</label>
      <div className="country-search-row">
        <input
          id={inputId}
          type="text"
          value={value}
          list={listId}
          placeholder={placeholder ?? "Search a country…"}
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
            setNotFound(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(value);
            }
          }}
          aria-describedby={notFound ? `${inputId}-error` : undefined}
        />
        <datalist id={listId}>
          {countries.map((country) => (
            <option key={country.iso3} value={country.country} />
          ))}
        </datalist>
        <button type="submit">Go</button>
      </div>
      {notFound && (
        <p id={`${inputId}-error`} className="country-search-empty" role="status">
          No country matches “{value}”. Try a different name.
        </p>
      )}
    </form>
  );
}
