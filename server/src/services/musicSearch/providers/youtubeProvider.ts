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

  return [
    {
      title: "Performance videos",
      subtitle: compact([base, "performance"]),
      source: "YouTube",
      url: `https://www.youtube.com/results?search_query=${enc(compact([base, "performance"]))}`,
      access: "free",
      category: "video",
      notes: "Live and studio performances of the work.",
      score: 0.98,
      tags: ["performance", "study"],
    },
    {
      title: "Score-follow videos",
      subtitle: compact([base, "score"]),
      source: "YouTube",
      url: `https://www.youtube.com/results?search_query=${enc(compact([base, "score"]))}`,
      access: "free",
      category: "video",
      notes: "Useful for score study while listening.",
      score: 0.95,
      tags: ["score", "study"],
    },
    {
      title: "Accompaniment / rehearsal videos",
      subtitle: compact([base, "accompaniment rehearsal"]),
      source: "YouTube",
      url: `https://www.youtube.com/results?search_query=${enc(compact([base, "accompaniment rehearsal"]))}`,
      access: "free",
      category: "video",
      notes: "Practice-oriented tracks and rehearsal help.",
      score: 0.91,
      tags: ["accompaniment", "practice"],
    },
  ];
}
