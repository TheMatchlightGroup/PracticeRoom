import type { MusicLinkResult, NormalizedMusicQuery } from "../types";

function enc(value: string): string {
  return encodeURIComponent(value);
}

function compact(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function hasChoralIntent(normalized: NormalizedMusicQuery, query: string): boolean {
  const text = `${query} ${normalized.canonicalTitle} ${normalized.workTitle ?? ""} ${normalized.instrumentationOrVoice ?? ""}`;
  return normalized.workType === "choral" || /\bchoral|choir|chorus|satb|ssa|ttbb\b/i.test(text);
}

function hasPianoVoiceIntent(normalized: NormalizedMusicQuery, query: string): boolean {
  const text = `${query} ${normalized.instrumentationOrVoice ?? ""}`;
  return /\bvoice|vocal|soprano|mezzo|alto|contralto|tenor|baritone|bass|countertenor\b/i.test(text);
}

export async function getSheetMusicResults(
  rawQuery: string,
  normalized: NormalizedMusicQuery
): Promise<MusicLinkResult[]> {
  const core = compact([
    normalized.canonicalTitle,
    normalized.composer,
    normalized.workTitle,
    normalized.instrumentationOrVoice,
  ]);

  const results: MusicLinkResult[] = [];

  results.push({
    title: "IMSLP search",
    subtitle: core,
    source: "IMSLP",
    url: `https://imslp.org/index.php?search=${enc(core)}`,
    access: "free",
    category: "sheet_music",
    notes: "Best first stop for public-domain editions, scans, and archival score materials.",
    score: 0.99,
    tags: ["public domain", "score", "classical"],
  });

  if (hasChoralIntent(normalized, rawQuery)) {
    results.push({
      title: "CPDL search",
      subtitle: core,
      source: "CPDL",
      url: `https://www.cpdl.org/wiki/index.php/Special:Search?search=${enc(core)}`,
      access: "free",
      category: "sheet_music",
      notes: "Especially strong for choral literature and public-domain choral editions.",
      score: 0.96,
      tags: ["choral", "public domain"],
    });
  }

  results.push({
    title: "Sheet Music Plus",
    subtitle: core,
    source: "Sheet Music Plus",
    url: `https://www.sheetmusicplus.com/en/search?Ntt=${enc(core)}`,
    access: "paid",
    category: "sheet_music",
    notes: "Commercial editions, arrangements, and teaching editions.",
    score: 0.91,
    tags: ["commercial", "editions"],
  });

  results.push({
    title: "Musicnotes",
    subtitle: core,
    source: "Musicnotes",
    url: `https://www.musicnotes.com/search/go?w=${enc(core)}`,
    access: "paid",
    category: "sheet_music",
    notes: "Digital scores and transposable editions when available.",
    score: 0.89,
    tags: ["digital score", "commercial"],
  });

  if (hasPianoVoiceIntent(normalized, rawQuery)) {
    results.push({
      title: "Piano-vocal search",
      subtitle: compact([core, "piano vocal"]),
      source: "Google",
      url: `https://www.google.com/search?q=${enc(compact([core, "piano vocal score"]))}`,
      access: "unknown",
      category: "sheet_music",
      notes: "Useful when looking specifically for singer-friendly piano-vocal editions.",
      score: 0.84,
      tags: ["piano-vocal", "vocal study"],
    });
  }

  return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
