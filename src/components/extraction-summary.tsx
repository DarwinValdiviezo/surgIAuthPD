import { ExtractionResult } from "@/types/domain";

const sourceStyles = {
  gemini: "bg-teal-100 text-teal-900",
  mock: "bg-slate-100 text-slate-700",
} as const;

export function ExtractionSummary({ extraction }: { extraction: ExtractionResult }) {
  const source = extraction.source ?? "mock";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Extraccion
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sourceStyles[source]}`}>
          {source === "gemini" ? "Gemini 2.5 Flash" : "Fallback mock"}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          Confianza {Math.round(extraction.confidence * 100)}%
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Procedimiento detectado</dt>
          <dd className="mt-1">{extraction.detectedProcedure}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Diagnostico detectado</dt>
          <dd className="mt-1">{extraction.detectedDiagnosis}</dd>
        </div>
      </dl>
    </div>
  );
}
