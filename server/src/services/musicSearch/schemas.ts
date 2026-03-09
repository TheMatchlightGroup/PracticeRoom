import { z } from "zod";

export const workTypeSchema = z.enum([
  "aria",
  "art_song",
  "opera",
  "oratorio",
  "choral",
  "instrumental",
  "musical_theatre",
  "piece",
  "movement",
  "unknown",
]);

export const accessTypeSchema = z.enum(["free", "paid", "unknown"]);
export const resultCategorySchema = z.enum(["sheet_music", "recording", "video"]);

export const normalizedMusicQuerySchema = z.object({
  canonicalTitle: z.string(),
  composer: z.string().optional(),
  workTitle: z.string().optional(),
  workType: workTypeSchema,
  language: z.string().optional(),
  instrumentationOrVoice: z.string().optional(),
  aliases: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
  ambiguity: z.array(z.string()).optional(),
  searchIntents: z.array(z.string()).optional(),
});

export const musicLinkResultSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  source: z.string(),
  url: z.string().url(),
  access: accessTypeSchema,
  category: resultCategorySchema,
  notes: z.string().optional(),
  score: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const repertoireSuggestionSchema = z.object({
  title: z.string(),
  composer: z.string(),
  workTitle: z.string().optional(),
  workType: workTypeSchema,
  language: z.string().optional(),
  voiceType: z.string().optional(),
  era: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  searchQuery: z.string(),
});

export const musicSearchResponseSchema = z.object({
  query: z.string(),
  normalized: normalizedMusicQuerySchema,
  suggestions: z.array(repertoireSuggestionSchema),
  sheetMusic: z.array(musicLinkResultSchema),
  recordings: z.array(musicLinkResultSchema),
  videos: z.array(musicLinkResultSchema),
  relatedSearches: z.array(z.string()),
});
