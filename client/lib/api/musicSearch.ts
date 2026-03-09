export interface NormalizedMusicQuery {
  title?: string;
  composer?: string;
  voiceType?: string;
  workType?: string;
  originalQuery: string;
}

export interface SearchItem {
  title: string;
  url: string;
  source: string;
}

export interface MusicSearchResponse {
  normalized: NormalizedMusicQuery;
  sheetMusic: SearchItem[];
  recordings: SearchItem[];
  videos: SearchItem[];
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
    const message = await response.text();
    throw new Error(message || "Music search request failed");
  }

  return response.json();
}
