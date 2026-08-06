"use client";

import { useState } from "react";
import { NAV_SECTIONS } from "@/lib/constants";
import type { CountryDataset } from "@/lib/types";
import CountrySearch from "./CountrySearch";

type Props = {
  activeSection: string;
  onNavigate: (id: string) => void;
  countries: CountryDataset[];
  onSelectCountry: (iso3: string) => void;
};

export default function Header({ activeSection, onNavigate, countries, onSelectCountry }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navigate = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="site-header">
      <div className="site-header-bar section-shell">
        <a className="brand" href="#overview" onClick={(e) => { e.preventDefault(); navigate("overview"); }}>
          Recovery Atlas
        </a>
        <nav className="primary-nav" aria-label="Primary">
          {NAV_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? "is-active" : ""}
              aria-current={activeSection === section.id ? "true" : undefined}
              onClick={() => navigate(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="header-icon-button"
            aria-expanded={searchOpen}
            aria-controls="header-search-panel"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <span aria-hidden="true">⌕</span> Search
          </button>
          <button
            type="button"
            className="header-mobile-toggle"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span>
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div id="header-search-panel" className="header-search-panel section-shell">
          <CountrySearch
            countries={countries}
            label="Jump to a country"
            placeholder="Try “Japan” or “BRA”…"
            onSelect={(iso3) => {
              onSelectCountry(iso3);
              navigate("explore");
              setSearchOpen(false);
            }}
          />
        </div>
      )}

      {mobileOpen && (
        <nav id="mobile-nav-panel" className="mobile-nav" aria-label="Mobile">
          {NAV_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? "is-active" : ""}
              onClick={() => navigate(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
