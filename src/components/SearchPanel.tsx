"use client";

import Link from "next/link";
import { useState } from "react";
import { search } from "@/lib/search";

const SUGGESTIONS = ["tee", "noir", "beige", "côte d'azur", "parrainage", "précommande"];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const results = search(query);
  const hasQuery = query.trim().length > 0;

  return (
    <div>
      <label htmlFor="site-search" className="sr-only">
        Rechercher sur le site
      </label>
      <input
        id="site-search"
        type="search"
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Un coloris, une page, un mot..."
        className="w-full border-b border-ink/40 bg-transparent py-4 font-display text-3xl outline-none placeholder:text-ink/25 focus:border-accent sm:text-5xl"
      />

      {!hasQuery && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:border-accent hover:text-ink"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {hasQuery && (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted" aria-live="polite">
          {results.length === 0
            ? "Aucun résultat"
            : `${results.length} résultat${results.length > 1 ? "s" : ""}`}
        </p>
      )}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {results.map((entry) => (
          <li key={`${entry.href}-${entry.title}`}>
            <Link href={entry.href} className="group flex items-center justify-between gap-6 py-5 transition-colors">
              <span className="min-w-0">
                <span className="block font-display text-xl group-hover:text-accent sm:text-2xl">{entry.title}</span>
                <span className="mt-1 block truncate text-sm text-muted">{entry.subtitle}</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{entry.type}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
