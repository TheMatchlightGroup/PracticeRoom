import type { MusicLinkResult } from "../../lib/api/musicSearch";

type Props = {
  title: string;
  description: string;
  items: MusicLinkResult[];
};

function accessLabel(access: MusicLinkResult["access"]): string {
  if (access === "free") return "Free";
  if (access === "paid") return "Paid";
  return "Varies";
}

export default function ResultsSection({ title, description, items }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No results yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <a
              key={`${item.source}-${item.url}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  {item.subtitle && (
                    <div className="mt-1 text-sm text-slate-600">{item.subtitle}</div>
                  )}
                  {item.notes && (
                    <div className="mt-2 text-xs leading-5 text-slate-500">{item.notes}</div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.source}
                  </div>
                  <div className="mt-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {accessLabel(item.access)}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
