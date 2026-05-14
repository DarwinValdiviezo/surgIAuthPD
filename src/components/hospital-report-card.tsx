import { SurgicalCase } from "@/types/domain";
import { InfoCard } from "@/components/info-card";

function Chip({ text }: { text: string }) {
  return (
    <span
      style={{
        background: "#eff6ff",
        color: "var(--primary)",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 12, padding: "8px 0", borderBottom: "1px dashed var(--border)" }}>
      <span style={{ color: "var(--muted)", fontSize: 13 }}>{label}</span>
      <strong style={{ fontSize: 15 }}>{value || "-"}</strong>
    </div>
  );
}

export function HospitalReportCard({ data }: { data: SurgicalCase }) {
  return (
    <InfoCard title="Informe del Hospital">
      <div style={{ display: "grid", gap: 4 }}>
        <Row label="Paciente" value={data.patientName} />
        <Row label="Documento de identidad" value={data.documentId} />
        <Row label="Diagnostico" value={data.diagnosis} />
        <Row label="Procedimiento solicitado" value={data.requestedProcedure} />
        <Row label="Fecha de solicitud" value={data.requestDate || "-"} />
      </div>

      <p style={{ margin: "14px 0 8px", fontWeight: 700 }}>Documentos presentados</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(data.submittedDocuments.length ? data.submittedDocuments : ["Sin documentos"]).map((doc) => (
          <Chip key={doc} text={doc} />
        ))}
      </div>
    </InfoCard>
  );
}
