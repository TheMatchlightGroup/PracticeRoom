import OpenAI from "openai";
import { repertoireCatalog, toSuggestion, type CatalogEntry } from "./repertoireCatalog";
import type { NormalizedMusicQuery, RepertoireSuggestion } from "./types";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function textBlob(normalized: NormalizedMusicQuery, rawQuery: string): string {
  return [
    rawQuery,
    normalized.canonicalTitle,
    normalized.composer,
    normalized.workTitle,
    normalized.workType,
    normalized.language,
    normalized.instrumentationOrVoice,
    ...(normalized.aliases || []),
    ...(normalized.searchIntents || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreCatalogEntry(entry: CatalogEntry, normalized: NormalizedMusicQuery, rawQuery: string): number {
  const blob = textBlob(normalized, rawQuery);
  let score = 0;

  if (normalized.composer && entry.composer.toLowerCase().includes(normalized.composer.toLowerCase())) {
    score += 5;
  }

  if (blob.includes(entry.title.toLowerCase())) {
    score += 8;
  }

  if (entry.workTitle && normalized.workTitle && entry.workTitle.toLowerCase().includes(normalized.workTitle.toLowerCase())) {
    score += 4;
  }

  if (normalized.workType !== "unknown" && entry.workType === normalized.workType) {
    score += 3;
  }

  if (
    normalized.instrumentationOrVoice &&
    entry.voiceType &&
    entry.voiceType.toLowerCase().includes(normalized.instrumentationOrVoice.toLowerCase())
  ) {
    score += 4;
  }

  if (normalized.language && entry.language?.toLowerCase() === normalized.language.toLowerCase()) {
    score += 2;
  }

  for (const tag of entry.tags) {
    if (blob.includes(tag.toLowerCase())) {
      score += 1.5;
    }
  }

  if (/beginner/.test(blob) && entry.difficulty === "beginner") score += 3;
  if (/intermediate/.test(blob) && entry.difficulty === "intermediate") score += 3;
  if (/advanced/.test(blob) && entry.difficulty === "advanced") score += 3;

  if (/baroque/.test(blob) && entry.era === "Baroque") score += 2;
  if (/classical/.test(blob) && entry.era === "Classical") score += 2;
  if (/romantic/.test(blob) && entry.era === "Romantic") score += 2;

  return score;
}

function heuristicSuggestions(
  rawQuery: string,
  normalized: NormalizedMusicQuery,
  limit = 5
): RepertoireSuggestion[] {
  const scored = repertoireCatalog
    .map((entry) => ({
      entry,
      score: scoreCatalogEntry(entry, normalized, rawQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ entry, score }) =>
    toSuggestion(
      entry,
      `Suggested because it matches the query’s likely composer, voice type, style, or repertoire intent.`,
      Math.min(0.95, 0.55 + score / 20)
    )
  );
}

export async function adviseRepertoire(
  rawQuery: string,
  normalized: NormalizedMusicQuery
): Promise<RepertoireSuggestion[]> {
  const heuristic = heuristicSuggestions(rawQuery, normalized, 8);

  if (!client) {
    return heuristic.slice(0, 5);
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are an expert vocal and classical repertoire advisor.",
                "Given a normalized search and a candidate repertoire catalog, choose the best repertoire matches.",
                "Prefer pedagogically useful, musically plausible suggestions.",
                "Return only strict JSON.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                rawQuery,
                normalized,
                candidates: heuristic,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "repertoire_advice",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    composer: { type: "string" },
                    workTitle: { type: ["string", "null"] },
                    workType: { type: "string" },
                    language: { type: ["string", "null"] },
                    voiceType: { type: ["string", "null"] },
                    era: { type: ["string", "null"] },
                    difficulty: { type: ["string", "null"] },
                    reason: { type: "string" },
                    confidence: { type: "number" },
                    searchQuery: { type: "string" },
                  },
                  required: [
                    "title",
                    "composer",
                    "workTitle",
                    "workType",
                    "language",
                    "voiceType",
                    "era",
                    "difficulty",
                    "reason",
                    "confidence",
                    "searchQuery",
                  ],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      },
    });

    const text =
      typeof response.output_text === "string" && response.output_text.trim()
        ? response.output_text
        : "";

    if (!text) {
      return heuristic.slice(0, 5);
    }

    const parsed = JSON.parse(text) as { suggestions?: RepertoireSuggestion[] };

    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      return heuristic.slice(0, 5);
    }

    return parsed.suggestions.slice(0, 5).map((item) => ({
      ...item,
      confidence: Math.max(0, Math.min(1, item.confidence ?? 0.75)),
    }));
  } catch (error) {
    console.error("Repertoire advisor failed, using heuristic suggestions:", error);
    return heuristic.slice(0, 5);
  }
}
