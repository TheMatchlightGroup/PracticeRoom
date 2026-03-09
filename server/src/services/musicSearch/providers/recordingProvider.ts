import type { MusicLinkResult, NormalizedMusicQuery } from "../types";

function enc(value: string): string {
  return encodeURIComponent(value);
}

function compact(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function getRecordingResults(
  _rawQuery: string,
  normalized: NormalizedMusicQuery
): Promise<MusicLinkResult[]> {
  const core = compact([
    normalized.canonicalTitle,
    normalized.composer,
    normalized.workTitle,
    normalized.instrumentationOrVoice,
  ]);

  return [
    {
      title: "Spotify search",
      subtitle: core,
      source: "Spotify",
      url: `https://open.spotify.com/search/${enc(core)}`,
      access: "unknown",
      category: "recording",
      notes: "Streaming recordings if available in the user’s region.",
      score: 0.95,
    },
    {
      title: "Apple Music search",
      subtitle: core,
      source: "Apple Music",
      url: `https://music.apple.com/us/search?term=${enc(core)}`,
      access: "unknown",
      category: "recording",
      notes: "Streaming recordings and albums.",
      score: 0.92,
    },
    {
      title: "General recording search",
      subtitle: `${core} recording`,
      source: "Google",
      url: `https://www.google.com/search?q=${enc(`${core} recording`)}`,
      access: "unknown",
      category: "recording",
      notes: "Catch-all search for official, historical, and educational recordings.",
      score: 0.82,
    },
  ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
