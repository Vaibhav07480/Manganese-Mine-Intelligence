import { useEffect, useMemo, useRef, useState } from "react";
import { SITES } from "../data/mines";
import type { Site } from "../data/types";

interface SearchBarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SearchBar({ selectedId, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SITES.slice(0, 8);
    return SITES.filter((site) => matches(site, q)).slice(0, 8);
  }, [query]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const choose = (id: string) => {
    const site = SITES.find((s) => s.id === id);
    setQuery(site?.name ?? "");
    setOpen(false);
    onSelect(id);
  };

  return (
    <div className="search" ref={rootRef}>
      <div className="search-bar">
        <span className="brand">MOIL</span>
        <span className="brand-rule" />
        <input
          value={query}
          placeholder="Search mines and prospects"
          aria-label="Search mines and prospects"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter" && results[active]) {
              choose(results[active].id);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open && (
        <ul className="search-list" role="listbox">
          {results.map((site, index) => (
            <li key={site.id}>
              <button
                type="button"
                className={index === active || site.id === selectedId ? "is-active" : ""}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(site.id)}
              >
                <span className="search-name">{site.name}</span>
                <span className="search-meta">
                  {site.kind === "mine" ? site.method : "Prospect"} · {site.district}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="search-empty">No sites match that name.</li>}
        </ul>
      )}
    </div>
  );
}

function matches(site: Site, q: string): boolean {
  return [site.name, site.district, site.state, site.product, site.method ?? "prospect"]
    .join(" ")
    .toLowerCase()
    .includes(q);
}
