import { FlowStepCard } from "@/components/flow-step-card";
import { SectionTitle } from "@/components/section-title";

export function AgentFlow() {
  const steps = [
    ["Notion", "Casos quirurgicos y polizas"],
    ["IA medica", "Extrae procedimiento, diagnostico y documentos"],
    ["Motor de reglas", "Valida cobertura, carencia y exclusiones"],
    ["Decision", "Emite preaprobacion o solicitud de documentos"],
  ];

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle title="Flujo del agente" />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {steps.map((step, idx) => (
          <FlowStepCard key={step[0]} index={idx + 1} title={step[0]} description={step[1]} />
        ))}
      </div>
    </section>
  );
}
