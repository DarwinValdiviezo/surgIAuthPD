import { DecisionResult, ExtractionResult, Policy, SurgicalCase } from "@/types/domain";
import { ReactNode } from "react";

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.floor((e - s) / (1000 * 60 * 60 * 24));
}

function Flag({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 700,
        background: ok ? "#d1fae5" : "#fee2e2",
        color: ok ? "#065f46" : "#991b1b",
      }}
    >
      {ok ? "Cumple" : "No cumple"} - {text}
    </span>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
      <p style={{ margin: "0 0 10px", fontWeight: 700 }}>{title}</p>
      {children}
    </article>
  );
}

export function ValidationChecklist({
  surgicalCase,
  policy,
  extraction,
  decision,
}: {
  surgicalCase: SurgicalCase;
  policy?: Policy;
  extraction: ExtractionResult;
  decision: DecisionResult;
}) {
  const elapsedDays = policy ? daysBetween(policy.policyStartDate, surgicalCase.requestDate) : 0;

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Validacion de preautorizacion</h3>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
        <Block title="Analisis IA">
          <p style={{ margin: "0 0 6px" }}><strong>Procedimiento:</strong> {extraction.detectedProcedure || "-"}</p>
          <p style={{ margin: "0 0 6px" }}><strong>Diagnostico:</strong> {extraction.detectedDiagnosis || "-"}</p>
          <p style={{ margin: "0 0 6px" }}><strong>Confianza:</strong> {Math.round(extraction.confidence * 100)}%</p>
        </Block>

        <Block title="Cobertura y exclusiones">
          <p style={{ margin: "0 0 8px" }}><strong>Solicitado:</strong> {surgicalCase.requestedProcedure}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Flag ok={decision.checks.covered} text="Cobertura" />
            <Flag ok={!decision.checks.excluded} text="Sin exclusion" />
          </div>
        </Block>

        <Block title="Carencia y documentos">
          <p style={{ margin: "0 0 8px" }}><strong>Dias transcurridos:</strong> {elapsedDays} / {policy?.waitingPeriodDays ?? 0}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <Flag ok={decision.checks.waitingPeriodMet} text="Carencia" />
            <Flag ok={decision.checks.documentsComplete} text="Documentos" />
          </div>
          {decision.missingDocuments.length > 0 ? (
            <p style={{ margin: 0, color: "var(--danger)", fontWeight: 600 }}>
              Faltantes: {decision.missingDocuments.join(", ")}
            </p>
          ) : null}
        </Block>
      </div>
    </section>
  );
}
