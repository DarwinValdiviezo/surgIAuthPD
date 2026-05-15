import { ExtractionSummary } from "@/components/extraction-summary";
import Link from "next/link";
import { ProcessCaseButton } from "@/components/process-case-button";
import { StatusBadge } from "@/components/status-badge";
import { CaseEvaluation } from "@/types/domain";

export function CaseCard({ evaluation }: { evaluation: CaseEvaluation }) {
  const { case: surgicalCase, decision, extraction } = evaluation;

  return (
    <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {surgicalCase.caseId}
          </p>
          <h3 className="mt-2 text-lg font-semibold">{surgicalCase.patientName}</h3>
        </div>
        <StatusBadge status={decision.status} />
      </div>

      <dl className="space-y-3 text-sm text-slate-700">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Procedimiento</dt>
          <dd>{surgicalCase.requestedProcedure}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Diagnostico</dt>
          <dd>{surgicalCase.diagnosis}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Aseguradora</dt>
          <dd>{surgicalCase.insurerName}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Decision actual</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{decision.status}</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{decision.reason}</p>
      </div>

      <div className="mt-5">
        <ExtractionSummary extraction={extraction} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/dashboard/${surgicalCase.caseId}`}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Ver detalle
        </Link>
        <ProcessCaseButton caseId={surgicalCase.caseId} />
      </div>
    </article>
  );
}
