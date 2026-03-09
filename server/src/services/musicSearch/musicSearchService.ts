import { musicSearchResponseSchema } from "./schemas";
import { musicSearchProviders } from "./providerRegistry";
import { normalizeMusicQuery } from "./openaiMusicNormalizer";
import type { MusicLinkResult, MusicSearchResponse } from "./types";

function dedupeByUrl(items: MusicLinkResult[]): MusicLinkResult[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function sortByScore(items: MusicLinkResult[]): MusicLinkResult[] {
  return [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())).map((v) => v.trim()))];
}

export async function runMusicSearch(query: string): Promise<MusicSearchResponse> {
  const normalized = await normalizeMusicQuery(query);

  const providerResults = await Promise.all(
    musicSearchProviders.map(async (provider) => {
      try {
        const results = await provider.run(query, normalized);
        return { category: provider.category, results };
      } catch (error) {
        console.error(`Music search provider failed: ${provider.key}`, error);
        return { category: provider.category, results: [] as MusicLinkResult[] };
      }
    })
  );

  const sheetMusic = sortByScore(
    dedupeByUrl(
      providerResults
        .filter((entry) => entry.category === "sheet_music")
        .flatMap((entry) => entry.results)
    )
  );

  const recordings = sortByScore(
    dedupeByUrl(
      providerResults
        .filter((entry) => entry.category === "recording")
        .flatMap((entry) => entry.results)
    )
  );

  const videos = sortByScore(
    dedupeByUrl(
      providerResults
        .filter((entry) => entry.category === "video")
        .flatMap((entry) => entry.results)
    )
  );

  const relatedSearches = uniqueStrings([
    normalized.canonicalTitle,
    normalized.composer ? `${normalized.canonicalTitle} ${normalized.composer}` : null,
    normalized.workTitle ? `${normalized.canonicalTitle} ${normalized.workTitle}` : null,
    normalized.instrumentationOrVoice
      ? `${normalized.canonicalTitle} ${normalized.instrumentationOrVoice}`
      : null,
    ...(normalized.aliases || []),
    ...(normalized.searchIntents || []).map((intent) => `${normalized.canonicalTitle} ${intent}`),
  ]);

  return {
    query,
    normalized,
    sheetMusic,
    recordings,
    videos,
    relatedSearches,
  };
}
