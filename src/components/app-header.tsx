import Link from "next/link";

export function AppHeader() {
  return (
    <header
      style={{
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "linear-gradient(135deg,var(--primary-dark),var(--primary))",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            SA
          </span>
          <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.03em" }}>SurgiAuth</h1>
        </div>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontWeight: 600, fontSize: 14 }}>
          Agente de preautorizacion quirurgica en tiempo real
        </p>
        <p style={{ margin: "6px 0 0", maxWidth: 760, color: "var(--muted)", fontSize: 13 }}>
          Analiza informes medicos y polizas desde Notion para emitir decisiones inmediatas y trazables.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span
          style={{
            border: "1px solid #bae6fd",
            borderRadius: 999,
            padding: "7px 12px",
            color: "#0369a1",
            background: "#f0f9ff",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          Conectado a Notion
        </span>
        <Link
          href="/"
          style={{
            background: "var(--primary)",
            color: "white",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 700,
            fontSize: 13,
            boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
          }}
        >
          Actualizar
        </Link>
      </div>
    </header>
  );
}
