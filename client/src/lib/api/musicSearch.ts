export type WorkType =
  | "aria"
  | "art_song"
  | "opera"
  | "oratorio"
  | "choral"
  | "instrumental"
  | "musical_theatre"
  | "piece"
  | "movement"
  | "unknown";

export type AccessType = "free" | "paid" | "unknown";
export type ResultCategory = "sheet_music" | "recording" | "video";

export interface NormalizedMusicQuery {
  canonicalTitle: string;
  composer?: string;
  workTitle?: string;
  workType: WorkType;
  language?: string;
  instrumentationOrVoice?: string;
  aliases: string[];
  confidence: number;
  notes?: string;
  ambiguity?: string[];
}

export interface MusicLinkResult {
  title: string;
  subtitle?: string;
  source: string;
  url: string;
  access: AccessType;
  category: ResultCategory;
  notes?: string;
  score?: number;
}

export interface MusicSearchResponse {
  query: string;
  normalized: NormalizedMusicQuery;
  sheetMusic: MusicLinkResult[];
  recordings: MusicLinkResult[];
  videos: MusicLinkResult[];
  relatedSearches: string[];
}

export async function searchMusic(query: string): Promise<MusicSearchResponse> {
  const response = await fetch("/api/music-search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    let message = "Music search failed";
    try {
      const data = await response.json();
      if (typeof data?.error === "string") {
        message = data.error;
      }
    } catch {
      // ignore JSON parse errors and keep fallback message
    }
    throw new Error(message);
  }

  return response.json();
}
