import { DecisionResult } from "@/types/domain";
import { statusColor } from "@/lib/status";

export function DecisionPanel({ result, processedAt }: { result: DecisionResult; processedAt?: string }) {
  const color = statusColor(result.status);

  return (
    <section style={{ background: `${color}0D`, border: `1px solid ${color}55`, borderRadius: 16, padding: 18 }}>
      <h3 style={{ margin: 0 }}>Resultado del Agente</h3>
      <p style={{ margin: "8px 0", fontWeight: 800, fontSize: 24, color }}>{result.status}</p>
      <p style={{ margin: "8px 0", color: "var(--muted)" }}>{result.reason}</p>
      <p style={{ margin: "8px 0" }}><strong>Confianza IA:</strong> {Math.round(result.confidence * 100)}%</p>
      <p style={{ margin: "8px 0" }}><strong>Fecha de procesamiento:</strong> {processedAt || "No disponible"}</p>
    </section>
  );
}
