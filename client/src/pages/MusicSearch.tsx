import { useMemo, useState } from "react";
import ResultsSection from "../components/music-search/ResultsSection";
import TopMatchCard from "../components/music-search/TopMatchCard";
import { searchMusic, type MusicSearchResponse } from "../lib/api/musicSearch";

const starterQueries = [
  "Vedrai carino Mozart",
  "O mio babbino caro soprano",
  "Lascia ch'io pianga Handel",
  "Ave Maria Schubert",
];

export default function MusicSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MusicSearchResponse | null>(null);

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  async function handleSearch(submittedQuery?: string) {
    const nextQuery = (submittedQuery ?? query).trim();
    if (!nextQuery) return;

    try {
      setLoading(true);
      setError(null);
      const data = await searchMusic(nextQuery);
      setResults(data);
      setQuery(nextQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Music search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
            PracticeRoom Music Search
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Find sheet music, recordings, and videos like a music librarian.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Search by aria title, lyric fragment, composer, voice type, or partial work name.
            PracticeRoom will normalize the query and return curated discovery paths for study,
            teaching, and assignment building.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearch();
            }}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: Vedrai carino Mozart soprano"
              className="w-full flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            <button
              type="submit"
              disabled={!canSearch || loading}
              className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {starterQueries.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void handleSearch(item)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-8 space-y-6">
            <TopMatchCard normalized={results.normalized} />

            <div className="grid gap-6 xl:grid-cols-3">
              <ResultsSection
                title="Sheet Music"
                description="Public-domain and commercial score sources."
                items={results.sheetMusic}
              />
              <ResultsSection
                title="Recordings"
                description="Streaming and general discovery links for recordings."
                items={results.recordings}
              />
              <ResultsSection
                title="Videos"
                description="Performance, score-follow, and rehearsal-oriented YouTube searches."
                items={results.videos}
              />
            </div>

            {results.relatedSearches.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 text-lg font-semibold text-slate-900">Related Searches</div>
                <div className="flex flex-wrap gap-2">
                  {results.relatedSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void handleSearch(item)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
