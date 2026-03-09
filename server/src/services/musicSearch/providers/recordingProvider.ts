import type { MusicLinkResult, NormalizedMusicQuery } from "../types";

function enc(value: string): string {
  return encodeURIComponent(value);
}

function compact(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function isVocalSearch(normalized: NormalizedMusicQuery, rawQuery: string): boolean {
  const text = `${rawQuery} ${normalized.instrumentationOrVoice ?? ""} ${normalized.workType}`;
  return (
    normalized.workType === "aria" ||
    normalized.workType === "art_song" ||
    /\bsoprano|mezzo|alto|contralto|tenor|baritone|bass|countertenor|voice|vocal\b/i.test(text)
  );
}

export async function getRecordingResults(
  rawQuery: string,
  normalized: NormalizedMusicQuery
): Promise<MusicLinkResult[]> {
  const core = compact([
    normalized.canonicalTitle,
    normalized.composer,
    normalized.workTitle,
    normalized.instrumentationOrVoice,
  ]);

  const results: MusicLinkResult[] = [
    {
      title: "Spotify search",
      subtitle: core,
      source: "Spotify",
      url: `https://open.spotify.com/search/${enc(core)}`,
      access: "unknown",
      category: "recording",
      notes: "Fast path to major-label and widely available streaming recordings.",
      score: 0.96,
      tags: ["streaming", "recordings"],
    },
    {
      title: "Apple Music search",
      subtitle: core,
      source: "Apple Music",
      url: `https://music.apple.com/us/search?term=${enc(core)}`,
      access: "unknown",
      category: "recording",
      notes: "Useful for albums, recital tracks, and alternate recordings.",
      score: 0.93,
      tags: ["streaming", "albums"],
    },
    {
      title: "General recording search",
      subtitle: compact([core, "recording"]),
      source: "Google",
      url: `https://www.google.com/search?q=${enc(compact([core, "recording"]))}`,
      access: "unknown",
      category: "recording",
      notes: "Catch-all discovery path for official, historical, and educational recordings.",
      score: 0.83,
      tags: ["discovery", "recordings"],
    },
  ];

  if (isVocalSearch(normalized, rawQuery)) {
    results.push({
      title: "Text + translation + recording search",
      subtitle: compact([core, "text translation recording"]),
      source: "Google",
      url: `https://www.google.com/search?q=${enc(compact([core, "text translation recording"]))}`,
      access: "unknown",
      category: "recording",
      notes: "Helpful for singers studying diction, meaning, and interpretation alongside recordings.",
      score: 0.87,
      tags: ["text", "translation", "vocal study"],
    });

    results.push({
      title: "Masterclass / interpretation search",
      subtitle: compact([core, "masterclass interpretation"]),
      source: "Google",
      url: `https://www.google.com/search?q=${enc(compact([core, "masterclass interpretation"]))}`,
      access: "unknown",
      category: "recording",
      notes: "Useful for pedagogical and interpretive resources tied to the repertoire.",
      score: 0.8,
      tags: ["pedagogy", "interpretation"],
    });
  }

  return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
