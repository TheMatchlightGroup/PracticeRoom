import type { RepertoireSuggestion } from "../../lib/api/musicSearch";

type Props = {
  suggestions: RepertoireSuggestion[];
  onSelectSuggestion: (query: string) => void;
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return "High confidence";
  if (confidence >= 0.75) return "Good match";
  return "Possible match";
}

function difficultyLabel(
  difficulty?: RepertoireSuggestion["difficulty"]
): string | null {
  if (!difficulty) return null;
  if (difficulty === "beginner") return "Beginner";
  if (difficulty === "intermediate") return "Intermediate";
  return "Advanced";
}

export default function RepertoireSuggestions({
  suggestions,
  onSelectSuggestion,
}: Props) {
  if (!suggestions.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900">
          Suggested repertoire
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          These are likely repertoire matches based on composer, voice type,
          language, style, and pedagogical intent.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {suggestions.map((item) => (
          <button
            key={`${item.title}-${item.composer}-${item.voiceType ?? ""}`}
            type="button"
            onClick={() => onSelectSuggestion(item.searchQuery)}
            className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {item.title}
                </div>

                <div className="mt-1 text-sm text-slate-700">
                  {item.composer}
                  {item.workTitle ? ` · ${item.workTitle}` : ""}
                </div>
              </div>

              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {confidenceLabel(item.confidence)}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {item.voiceType && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                  {item.voiceType}
                </span>
              )}

              {item.language && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                  {item.language}
                </span>
              )}

              {item.era && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                  {item.era}
                </span>
              )}

              {difficultyLabel(item.difficulty) && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                  {difficultyLabel(item.difficulty)}
                </span>
              )}

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                {item.workType.replace(/_/g, " ")}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.reason}
            </p>

            <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search this suggestion
            </div>
            <div className="mt-1 text-sm text-slate-800">{item.searchQuery}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
