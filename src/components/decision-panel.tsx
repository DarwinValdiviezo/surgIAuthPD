import { ExtractionSummary } from "@/components/extraction-summary";
import { ChecksGrid } from "@/components/checks-grid";
import { StatusBadge } from "@/components/status-badge";
import { CaseEvaluation } from "@/types/domain";

export function DecisionPanel({ evaluation }: { evaluation: CaseEvaluation }) {
  const { decision, extraction, documents } = evaluation;

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Resultado</p>
          <h2 className="mt-2 text-2xl font-semibold">Decision del agente</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{decision.reason}</p>
        </div>
        <StatusBadge status={decision.status} />
      </div>

      {decision.missingDocuments.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Documentos faltantes</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {decision.missingDocuments.map((item) => (
              <li
                key={item}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-900 shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <ExtractionSummary extraction={extraction} />
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Documentos relacionados: {documents.length}
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-900">Checks del flujo</p>
        <ChecksGrid checks={decision.checks} />
      </div>
    </section>
  );
}
