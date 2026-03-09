import type { NormalizedMusicQuery } from "../../lib/api/musicSearch";

type Props = {
  normalized: NormalizedMusicQuery;
};

function badgeClass(confidence: number): string {
  if (confidence >= 0.9) return "bg-emerald-100 text-emerald-800";
  if (confidence >= 0.75) return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-800";
}

export default function TopMatchCard({ normalized }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Top Match
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {normalized.canonicalTitle}
          </h2>

          <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            {normalized.composer && (
              <div>
                <span className="font-semibold text-slate-900">Composer:</span>{" "}
                {normalized.composer}
              </div>
            )}

            {normalized.workTitle && (
              <div>
                <span className="font-semibold text-slate-900">Parent work:</span>{" "}
                {normalized.workTitle}
              </div>
            )}

            <div>
              <span className="font-semibold text-slate-900">Type:</span>{" "}
              {normalized.workType.replace(/_/g, " ")}
            </div>

            {normalized.language && (
              <div>
                <span className="font-semibold text-slate-900">Language:</span>{" "}
                {normalized.language}
              </div>
            )}

            {normalized.instrumentationOrVoice && (
              <div>
                <span className="font-semibold text-slate-900">Voice / Instrument:</span>{" "}
                {normalized.instrumentationOrVoice}
              </div>
            )}
          </div>
        </div>

        <div
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${badgeClass(
            normalized.confidence
          )}`}
        >
          {Math.round(normalized.confidence * 100)}% confidence
        </div>
      </div>

      {normalized.notes && (
        <p className="mt-5 text-sm leading-6 text-slate-600">{normalized.notes}</p>
      )}

      {normalized.aliases.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Alternate titles / spellings
          </div>
          <div className="flex flex-wrap gap-2">
            {normalized.aliases.map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {alias}
              </span>
            ))}
          </div>
        </div>
      )}

      {normalized.ambiguity && normalized.ambiguity.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">Ambiguity to watch</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {normalized.ambiguity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
