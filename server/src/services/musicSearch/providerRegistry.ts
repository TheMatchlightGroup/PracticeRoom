import { getRecordingResults } from "./providers/recordingProvider";
import { getSheetMusicResults } from "./providers/sheetMusicProvider";
import { getYoutubeResults } from "./providers/youtubeProvider";
import type { MusicLinkResult, NormalizedMusicQuery, ResultCategory } from "./types";

export type ProviderFn = (
  rawQuery: string,
  normalized: NormalizedMusicQuery
) => Promise<MusicLinkResult[]>;

export interface ProviderDefinition {
  key: string;
  category: ResultCategory;
  run: ProviderFn;
}

export const musicSearchProviders: ProviderDefinition[] = [
  {
    key: "sheet-music-default",
    category: "sheet_music",
    run: getSheetMusicResults,
  },
  {
    key: "recordings-default",
    category: "recording",
    run: getRecordingResults,
  },
  {
    key: "youtube-default",
    category: "video",
    run: getYoutubeResults,
  },
];
