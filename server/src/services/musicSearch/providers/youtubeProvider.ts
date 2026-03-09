import type { MusicLinkResult, NormalizedMusicQuery } from "../types";

function enc(value: string): string {
  return encodeURIComponent(value);
}

function compact(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function getYoutubeResults(
  _rawQuery: string,
  normalized: NormalizedMusicQuery
): Promise<MusicLinkResult[]> {
  const base = compact([
    normalized.canonicalTitle,
    normalized.composer,
    normalized.workTitle,
    normalized.instrumentationOrVoice,
  ]);

  const searches = [
    {
      title: "Performance videos",
      query: compact([base, "performance"]),
      notes: "Live or studio performances of the work.",
      score: 0.98,
    },
    {
      title: "Score-follow videos",
      query: compact([base, "score"]),
      notes: "Useful for following the music while listening.",
      score: 0.95,
    },
    {
      title: "Accompaniment / rehearsal videos",
      query: compact([base, "accompaniment rehearsal"]),
      notes: "Practice-oriented tracks and rehearsal resources.",
      score: 0.9,
    },
  ];

  return searches.map((item) => ({
    title: item.title,
    subtitle: item.query,
    source: "YouTube",
    url: `https://www.youtube.com/results?search_query=${enc(item.query)}`,
    access: "free",
    category: "video",
    notes: item.notes,
    score: item.score,
  }));
}
