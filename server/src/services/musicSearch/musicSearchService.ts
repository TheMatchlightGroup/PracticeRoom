import { normalizeMusicQuery } from "./openaiMusicNormalizer";
import { getRecordingResults } from "./providers/recordingProvider";
import { getSheetMusicResults } from "./providers/sheetMusicProvider";
import { getYoutubeResults } from "./providers/youtubeProvider";
import type { MusicLinkResult, MusicSearchResponse } from "./types";

function dedupeByUrl(items: MusicLinkResult[]): MusicLinkResult[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())).map((v) => v.trim()))];
}

export async function runMusicSearch(query: string): Promise<MusicSearchResponse> {
  const normalized = await normalizeMusicQuery(query);

  const [sheetMusic, recordings, videos] = await Promise.all([
    getSheetMusicResults(query, normalized),
    getRecordingResults(query, normalized),
    getYoutubeResults(query, normalized),
  ]);

  const relatedSearches = uniqueStrings([
    normalized.canonicalTitle,
    normalized.composer ? `${normalized.canonicalTitle} ${normalized.composer}` : null,
    normalized.workTitle ? `${normalized.canonicalTitle} ${normalized.workTitle}` : null,
    normalized.instrumentationOrVoice
      ? `${normalized.canonicalTitle} ${normalized.instrumentationOrVoice}`
      : null,
    ...(normalized.aliases || []),
  ]);

  return {
    query,
    normalized,
    sheetMusic: dedupeByUrl(sheetMusic).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    recordings: dedupeByUrl(recordings).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    videos: dedupeByUrl(videos).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    relatedSearches,
  };
}
