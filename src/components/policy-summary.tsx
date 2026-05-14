import { Policy } from "@/types/domain";
import { InfoCard } from "@/components/info-card";

function Chip({ text, tone = "default" }: { text: string; tone?: "default" | "danger" }) {
  const bg = tone === "danger" ? "#fee2e2" : "#ecfeff";
  const color = tone === "danger" ? "var(--danger)" : "var(--accent)";
  return <span style={{ background: bg, color, borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>{text}</span>;
}

export function PolicySummary({ policy, policyId }: { policy?: Policy; policyId: string }) {
  if (!policy) {
    return <InfoCard title="Poliza de la Aseguradora"><p>Poliza no encontrada para {policyId}</p></InfoCard>;
  }

  return (
    <InfoCard title="Poliza de la Aseguradora">
      <p><strong>Policy ID:</strong> {policy.policyId}</p>
      <p><strong>Aseguradora:</strong> {policy.insurerName || "-"}</p>
      <p><strong>Plan:</strong> {policy.plan || "-"}</p>
      <p><strong>Fecha de inicio:</strong> {policy.policyStartDate || "-"}</p>
      <p><strong>Dias de carencia:</strong> {policy.waitingPeriodDays}</p>
      <p><strong>Reglas especiales:</strong> {policy.specialRules || "Sin reglas especiales"}</p>
      <p><strong>Procedimientos cubiertos</strong></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{policy.coveredProcedures.map((p) => <Chip key={p} text={p} />)}</div>
      <p><strong>Exclusiones</strong></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{policy.exclusions.map((p) => <Chip key={p} text={p} tone="danger" />)}</div>
      <p><strong>Documentos requeridos</strong></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{policy.requiredDocuments.map((p) => <Chip key={p} text={p} />)}</div>
    </InfoCard>
  );
}
