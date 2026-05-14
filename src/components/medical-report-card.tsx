import { InfoCard } from "@/components/info-card";

export function MedicalReportCard({ report }: { report: string }) {
  return (
    <InfoCard title="Informe medico">
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#f8fafc", padding: 12 }}>
        <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--muted)" }}>{report || "Informe medico vacio"}</p>
      </div>
    </InfoCard>
  );
}
