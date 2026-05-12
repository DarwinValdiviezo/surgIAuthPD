import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionPanel } from "@/components/decision-panel";
import { ProcessCaseButton } from "@/components/process-case-button";
import { findCaseById } from "@/lib/case-service";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    notFound();
  }

  const evaluation = await evaluateSurgicalCase(surgicalCase);
  const { case: caseData, policy, extraction } = evaluation;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-[var(--foreground)] px-8 py-10 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-200">{caseData.caseId}</p>
            <h1 className="mt-3 text-4xl font-semibold">{caseData.patientName}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
              Diagnostico: {caseData.diagnosis}. Procedimiento solicitado: {caseData.requestedProcedure}.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
            >
              Volver al dashboard
            </Link>
            <ProcessCaseButton caseId={caseData.caseId} />
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Caso</p>
          <dl className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Aseguradora</dt>
              <dd>{caseData.insurerName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Policy ID</dt>
              <dd>{caseData.policyId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Inicio de poliza</dt>
              <dd>{caseData.policyStartDate}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Fecha de solicitud</dt>
              <dd>{caseData.requestDate}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Urgencia</dt>
              <dd>{caseData.isUrgent ? "Urgente" : "Programada"}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Poliza aplicada</p>
          <dl className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Aseguradora</dt>
              <dd>{policy?.insurerName ?? "No encontrada"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Carencia</dt>
              <dd>{policy ? `${policy.waitingPeriodDays} dias` : "No disponible"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Coberturas</dt>
              <dd>{policy?.coveredProcedures.join(", ") || "No disponible"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Exclusiones</dt>
              <dd>{policy?.exclusions.join(", ") || "No disponible"}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Extraccion actual</p>
          <dl className="mt-4 space-y-4 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Procedimiento detectado</dt>
              <dd>{extraction.detectedProcedure}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Diagnostico detectado</dt>
              <dd>{extraction.detectedDiagnosis}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Confianza</dt>
              <dd>{Math.round(extraction.confidence * 100)}%</dd>
            </div>
          </dl>
        </article>
      </section>

      <div className="mt-8">
        <DecisionPanel evaluation={evaluation} />
      </div>
    </main>
  );
}
