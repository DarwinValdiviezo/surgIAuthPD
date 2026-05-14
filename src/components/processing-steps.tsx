export function ProcessingSteps({ active }: { active: boolean }) {
  const steps = [
    "Leyendo informe medico desde Notion",
    "Consultando poliza del paciente",
    "Extrayendo datos con IA",
    "Validando cobertura",
    "Validando exclusiones",
    "Validando periodo de carencia",
    "Revisando documentos requeridos",
    "Actualizando resultado en Notion",
    "Generando decision final",
  ];

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <h3 style={{ margin: "0 0 10px" }}>Proceso del agente</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {steps.map((step, i) => (
          <div key={step} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: active ? "var(--accent)" : "#cbd5e1",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}
            >
              {active ? "*" : i + 1}
            </span>
            <span style={{ color: "var(--muted)" }}>{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
