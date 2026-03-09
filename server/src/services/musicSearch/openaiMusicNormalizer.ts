import OpenAI from "openai";
import type { NormalizedMusicQuery, WorkType } from "./types";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type NormalizerPayload = {
  canonicalTitle: string;
  composer: string | null;
  workTitle: string | null;
  workType: WorkType;
  language: string | null;
  instrumentationOrVoice: string | null;
  aliases: string[];
  confidence: number;
  notes: string | null;
  ambiguity: string[];
  searchIntents: string[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    canonicalTitle: { type: "string" },
    composer: { type: ["string", "null"] },
    workTitle: { type: ["string", "null"] },
    workType: {
      type: "string",
      enum: [
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
      ],
    },
    language: { type: ["string", "null"] },
    instrumentationOrVoice: { type: ["string", "null"] },
    aliases: {
      type: "array",
      items: { type: "string" },
    },
    confidence: { type: "number" },
    notes: { type: ["string", "null"] },
    ambiguity: {
      type: "array",
      items: { type: "string" },
    },
    searchIntents: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "canonicalTitle",
    "composer",
    "workTitle",
    "workType",
    "language",
    "instrumentationOrVoice",
    "aliases",
    "confidence",
    "notes",
    "ambiguity",
    "searchIntents",
  ],
} as const;

const knownWorks: Array<{
  match: RegExp;
  value: Partial<NormalizedMusicQuery> & { canonicalTitle: string };
}> = [
  {
    match: /\bvedrai[, ]*carino\b/i,
    value: {
      canonicalTitle: "Vedrai, carino",
      composer: "Wolfgang Amadeus Mozart",
      workTitle: "Don Giovanni",
      workType: "aria",
      language: "Italian",
      aliases: ["Vedrai carino"],
      confidence: 0.97,
      notes: "Likely Zerlina aria from Don Giovanni.",
      searchIntents: ["sheet music", "recordings", "youtube performance", "score video"],
    },
  },
  {
    match: /\bbatti[, ]*batti\b/i,
    value: {
      canonicalTitle: "Batti, batti, o bel Masetto",
      composer: "Wolfgang Amadeus Mozart",
      workTitle: "Don Giovanni",
      workType: "aria",
      language: "Italian",
      aliases: ["Batti batti"],
      confidence: 0.96,
      notes: "Likely Zerlina aria from Don Giovanni.",
      searchIntents: ["sheet music", "recordings", "youtube performance"],
    },
  },
  {
    match: /\bo mio babbino caro\b/i,
    value: {
      canonicalTitle: "O mio babbino caro",
      composer: "Giacomo Puccini",
      workTitle: "Gianni Schicchi",
      workType: "aria",
      language: "Italian",
      aliases: [],
      confidence: 0.98,
      notes: "Common soprano aria from Gianni Schicchi.",
      searchIntents: ["sheet music", "recordings", "youtube performance", "accompaniment"],
    },
  },
  {
    match: /\blascia ch['’]?(io)? pianga\b/i,
    value: {
      canonicalTitle: "Lascia ch'io pianga",
      composer: "George Frideric Handel",
      workTitle: "Rinaldo",
      workType: "aria",
      language: "Italian",
      aliases: ["Lascia chio pianga", "Lascia ch’io pianga"],
      confidence: 0.97,
      notes: "Famous aria from Handel’s Rinaldo.",
      searchIntents: ["sheet music", "recordings", "youtube performance", "baroque interpretation"],
    },
  },
  {
    match: /\bave maria\b.*\bschubert\b|\bschubert\b.*\bave maria\b/i,
    value: {
      canonicalTitle: "Ave Maria",
      composer: "Franz Schubert",
      workTitle: "Ellens Gesang III, D. 839",
      workType: "art_song",
      language: "German",
      aliases: ["Ellens Gesang III", "Ave Maria Schubert"],
      confidence: 0.9,
      notes: "Often searched by the popular title rather than the full catalog entry.",
      ambiguity: ["Could also refer to settings by Bach/Gounod or others if the query is incomplete."],
      searchIntents: ["sheet music", "recordings", "youtube performance", "text and translation"],
    },
  },
];

function toTitleCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractVoiceType(query: string): string | undefined {
  return query.match(
    /\b(soprano|mezzo|mezzo-soprano|alto|contralto|tenor|baritone|bass|countertenor|treble|violin|viola|cello|flute|clarinet|oboe|piano|guitar|choir|choral)\b/i
  )?.[1];
}

function extractLanguage(query: string): string | undefined {
  const match = query.match(/\b(italian|german|french|english|latin|spanish)\b/i)?.[1];
  return match ? toTitleCase(match) : undefined;
}

function inferWorkType(query: string): WorkType {
  if (/\baria\b/i.test(query)) return "aria";
  if (/\bopera\b/i.test(query)) return "opera";
  if (/\boratorio\b/i.test(query)) return "oratorio";
  if (/\bchoral|choir|chorus\b/i.test(query)) return "choral";
  if (/\blied|lieder|art song|song\b/i.test(query)) return "art_song";
  if (/\bmovement\b/i.test(query)) return "movement";
  if (/\bconcerto|sonata|suite|prelude|fugue|étude|etude|nocturne\b/i.test(query)) return "instrumental";
  return "unknown";
}

function fallbackNormalize(rawQuery: string): NormalizedMusicQuery {
  const cleaned = rawQuery.replace(/\s+/g, " ").trim();

  for (const entry of knownWorks) {
    if (entry.match.test(cleaned)) {
      return {
        canonicalTitle: entry.value.canonicalTitle,
        composer: entry.value.composer,
        workTitle: entry.value.workTitle,
        workType: entry.value.workType ?? "unknown",
        language: entry.value.language,
        instrumentationOrVoice: extractVoiceType(cleaned),
        aliases: entry.value.aliases ?? [],
        confidence: entry.value.confidence ?? 0.8,
        notes: entry.value.notes,
        ambiguity: entry.value.ambiguity ?? [],
        searchIntents: entry.value.searchIntents ?? [],
      };
    }
  }

  return {
    canonicalTitle: toTitleCase(cleaned),
    composer: undefined,
    workTitle: undefined,
    workType: inferWorkType(cleaned),
    language: extractLanguage(cleaned),
    instrumentationOrVoice: extractVoiceType(cleaned),
    aliases: [],
    confidence: 0.58,
    notes: "Fallback normalization used. Query may need a composer, work title, or voice type for sharper results.",
    ambiguity: [],
    searchIntents: ["sheet music", "recordings", "youtube performance"],
  };
}

function extractTextOutput(response: any): string {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  if (Array.isArray(response?.output)) {
    for (const item of response.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const content of item.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          return content.text;
        }
      }
    }
  }

  throw new Error("No structured output text found in OpenAI response.");
}

export async function normalizeMusicQuery(rawQuery: string): Promise<NormalizedMusicQuery> {
  const trimmed = rawQuery.trim();

  if (!trimmed) {
    return {
      canonicalTitle: "",
      workType: "unknown",
      aliases: [],
      confidence: 0,
      ambiguity: [],
      searchIntents: [],
    };
  }

  if (!client) {
    return fallbackNormalize(trimmed);
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
                "You are a professional music librarian and repertoire specialist.",
                "Normalize messy music searches into canonical structured data.",
                "Identify likely aria titles, parent works, composers, language, work type, and voice/instrument intent.",
                "Prefer precision over creativity.",
                "If ambiguous, provide the best likely answer and explain ambiguity.",
                "Do not invent editions, URLs, recordings, or publishers.",
                "For arias, use the aria title as canonicalTitle and the opera title as workTitle.",
                "Also generate searchIntents that would help a musician, teacher, or student find useful materials.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: trimmed }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "music_query_normalization",
          strict: true,
          schema,
        },
      },
    });

    const parsed = JSON.parse(extractTextOutput(response)) as NormalizerPayload;

    return {
      canonicalTitle: parsed.canonicalTitle?.trim() || toTitleCase(trimmed),
      composer: parsed.composer || undefined,
      workTitle: parsed.workTitle || undefined,
      workType: parsed.workType || "unknown",
      language: parsed.language || undefined,
      instrumentationOrVoice: parsed.instrumentationOrVoice || extractVoiceType(trimmed),
      aliases: Array.isArray(parsed.aliases) ? parsed.aliases : [],
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.75,
      notes: parsed.notes || undefined,
      ambiguity: Array.isArray(parsed.ambiguity) ? parsed.ambiguity : [],
      searchIntents: Array.isArray(parsed.searchIntents) ? parsed.searchIntents : [],
    };
  } catch (error) {
    console.error("OpenAI music normalization failed, using fallback:", error);
    return fallbackNormalize(trimmed);
  }
}
