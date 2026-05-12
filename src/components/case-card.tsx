import { StatusBadge } from "@/components/status-badge";
import { SurgicalCase } from "@/types/domain";

export function CaseCard({ surgicalCase }: { surgicalCase: SurgicalCase }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {surgicalCase.caseId}
          </p>
          <h3 className="mt-2 text-lg font-semibold">{surgicalCase.patientName}</h3>
        </div>
        <StatusBadge status={surgicalCase.status} />
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
    </article>
  );
}
