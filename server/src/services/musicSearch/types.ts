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
  searchIntents?: string[];
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
  tags?: string[];
}

export interface MusicSearchResponse {
  query: string;
  normalized: NormalizedMusicQuery;
  sheetMusic: MusicLinkResult[];
  recordings: MusicLinkResult[];
  videos: MusicLinkResult[];
  relatedSearches: string[];
}
