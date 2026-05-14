import { DecisionResult } from "@/types/domain";

export function ChecklistCard({ decision }: { decision: DecisionResult }) {
  const items = [
    ["Procedimiento cubierto", decision.checks.covered],
    ["No excluido", !decision.checks.excluded],
    ["Cumple carencia", decision.checks.waitingPeriodMet],
    ["Documentos completos", decision.checks.documentsComplete],
    ["Confianza IA suficiente", decision.checks.confidenceAccepted],
  ] as const;

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px" }}>Checklist rapido</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map(([label, ok]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: ok ? "#dcfce7" : "#fee2e2",
                color: ok ? "#15803d" : "#b91c1c",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {ok ? "OK" : "!"}
            </span>
            <span style={{ color: ok ? "#15803d" : "#b91c1c", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
