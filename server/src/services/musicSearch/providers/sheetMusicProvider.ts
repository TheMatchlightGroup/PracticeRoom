import type { MusicLinkResult, NormalizedMusicQuery } from "../types";

function enc(value: string): string {
  return encodeURIComponent(value);
}

function compact(parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function getSheetMusicResults(
  _rawQuery: string,
  normalized: NormalizedMusicQuery
): Promise<MusicLinkResult[]> {
  const core = compact([
    normalized.canonicalTitle,
    normalized.composer,
    normalized.workTitle,
    normalized.instrumentationOrVoice,
  ]);

  const choralBoost =
    normalized.workType === "choral" || /choral|choir|chorus/i.test(core);

  const results: MusicLinkResult[] = [
    {
      title: "IMSLP search",
      subtitle: core,
      source: "IMSLP",
      url: `https://imslp.org/index.php?search=${enc(core)}`,
      access: "free",
      category: "sheet_music",
      notes: "Public-domain and archival editions where available.",
      score: 0.99,
    },
    {
      title: "Sheet Music Plus",
      subtitle: core,
      source: "Sheet Music Plus",
      url: `https://www.sheetmusicplus.com/en/search?Ntt=${enc(core)}`,
      access: "paid",
      category: "sheet_music",
      notes: "Commercial editions and arrangements.",
      score: 0.9,
    },
    {
      title: "Musicnotes",
      subtitle: core,
      source: "Musicnotes",
      url: `https://www.musicnotes.com/search/go?w=${enc(core)}`,
      access: "paid",
      category: "sheet_music",
      notes: "Digital sheet music and transpositions when available.",
      score: 0.88,
    },
  ];

  if (choralBoost) {
    results.splice(1, 0, {
      title: "CPDL search",
      subtitle: core,
      source: "CPDL",
      url: `https://www.cpdl.org/wiki/index.php/Special:Search?search=${enc(core)}`,
      access: "free",
      category: "sheet_music",
      notes: "Especially useful for choral repertoire.",
      score: 0.95,
    });
  }

  return results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
