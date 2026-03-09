import type { NormalizedMusicQuery, WorkType } from "./types";

type OpenAINormalizerPayload = {
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
};

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4";

const knownPieces: Array<{
  match: RegExp;
  normalized: Partial<NormalizedMusicQuery> & { canonicalTitle: string };
}> = [
  {
    match: /\bvedrai[, ]*carino\b/i,
    normalized: {
      canonicalTitle: "Vedrai, carino",
      composer: "Wolfgang Amadeus Mozart",
      workTitle: "Don Giovanni",
      workType: "aria",
      language: "Italian",
      aliases: ["Vedrai carino"],
      confidence: 0.96,
      notes: "Likely Zerlina aria from Don Giovanni.",
    },
  },
  {
    match: /\bbatti[, ]*batti\b/i,
    normalized: {
      canonicalTitle: "Batti, batti, o bel Masetto",
      composer: "Wolfgang Amadeus Mozart",
      workTitle: "Don Giovanni",
      workType: "aria",
      language: "Italian",
      aliases: ["Batti batti"],
      confidence: 0.95,
      notes: "Likely Zerlina aria from Don Giovanni.",
    },
  },
  {
    match: /\bo mio babbino caro\b/i,
    normalized: {
      canonicalTitle: "O mio babbino caro",
      composer: "Giacomo Puccini",
      workTitle: "Gianni Schicchi",
      workType: "aria",
      language: "Italian",
      aliases: [],
      confidence: 0.97,
      notes: "Common soprano aria from Gianni Schicchi.",
    },
  },
  {
    match: /\blascia ch['’]?(io)? pianga\b/i,
    normalized: {
      canonicalTitle: "Lascia ch'io pianga",
      composer: "George Frideric Handel",
      workTitle: "Rinaldo",
      workType: "aria",
      language: "Italian",
      aliases: ["Lascia chio pianga", "Lascia ch’io pianga"],
      confidence: 0.96,
      notes: "Famous aria from Handel’s Rinaldo.",
    },
  },
  {
    match: /\bave maria\b.*\bschubert\b|\bschubert\b.*\bave maria\b/i,
    normalized: {
      canonicalTitle: "Ave Maria",
      composer: "Franz Schubert",
      workTitle: "Ellens Gesang III, D. 839",
      workType: "art_song",
      language: "German",
      aliases: ["Ellens Gesang III", "Ave Maria Schubert"],
      confidence: 0.9,
      notes: "Often searched by the popular title rather than the full catalog entry.",
      ambiguity: ["Could also refer to settings by Bach/Gounod or others if the query is incomplete."],
    },
  },
];

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function extractVoiceType(query: string): string | undefined {
  const match = query.match(
    /\b(soprano|mezzo|mezzo-soprano|alto|contralto|tenor|baritone|bass|treble|countertenor|violin|cello|flute|clarinet|piano|guitar|choir|choral)\b/i
  );
  return match?.[1];
}

function extractLanguage(query: string): string | undefined {
  const match = query.match(/\b(italian|german|french|english|latin|spanish)\b/i);
  return match?.[1] ? toTitleCase(match[1]) : undefined;
}

function inferWorkType(query: string): WorkType {
  if (/\baria\b/i.test(query)) return "aria";
  if (/\bopera\b/i.test(query)) return "opera";
  if (/\boratorio\b/i.test(query)) return "oratorio";
  if (/\bchoral|choir|chorus\b/i.test(query)) return "choral";
  if (/\bsong|lieder|lied\b/i.test(query)) return "art_song";
  if (/\bmovement\b/i.test(query)) return "movement";
  return "unknown";
}

function heuristicNormalize(rawQuery: string): NormalizedMusicQuery {
  const cleaned = rawQuery.replace(/\s+/g, " ").trim();
  const lower = cleaned.toLowerCase();

  for (const entry of knownPieces) {
    if (entry.match.test(lower)) {
      return {
        canonicalTitle: entry.normalized.canonicalTitle,
        composer: entry.normalized.composer,
        workTitle: entry.normalized.workTitle,
        workType: entry.normalized.workType ?? "unknown",
        language: entry.normalized.language,
        instrumentationOrVoice: extractVoiceType(cleaned),
        aliases: entry.normalized.aliases ?? [],
        confidence: entry.normalized.confidence ?? 0.85,
        notes: entry.normalized.notes,
        ambiguity: entry.normalized.ambiguity ?? [],
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
    confidence: 0.55,
    notes: "Heuristic normalization used because no exact canonical match was identified.",
    ambiguity: [],
  };
}

function extractResponseText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) continue;

      for (const content of item.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          return content.text;
        }
      }
    }
  }

  throw new Error("OpenAI response did not include structured text output.");
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
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return heuristicNormalize(trimmed);
  }

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
    ],
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "You are a professional music librarian and repertoire specialist.",
                  "Normalize messy user music searches into canonical structured data.",
                  "Prefer precision over creativity.",
                  "For arias, use the aria title as canonicalTitle and the opera title as workTitle.",
                  "If the query is partial or ambiguous, still provide the best likely normalization and note ambiguity.",
                  "Do not invent links, recordings, editions, or publishers.",
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI normalization failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(extractResponseText(data)) as OpenAINormalizerPayload;

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
          : 0.7,
      notes: parsed.notes || undefined,
      ambiguity: Array.isArray(parsed.ambiguity) ? parsed.ambiguity : [],
    };
  } catch (error) {
    console.error("OpenAI normalization failed, falling back to heuristic normalizer:", error);
    return heuristicNormalize(trimmed);
  }
}
