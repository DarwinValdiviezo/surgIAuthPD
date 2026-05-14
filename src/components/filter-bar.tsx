"use client";

export function FilterBar({
  query,
  setQuery,
  resultFilter,
  setResultFilter,
  statusFilter,
  setStatusFilter,
}: {
  query: string;
  setQuery: (v: string) => void;
  resultFilter: string;
  setResultFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}) {
  const statusOptions = ["Todos", "Nuevo", "En analisis", "Preaprobado", "Pendiente por documentos", "Rechazado por exclusion", "Revision manual"];

  return (
    <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar paciente, Case ID o Policy ID"
        style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "9px 10px", background: "#f8fafc", fontSize: 13 }}
      />
      <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "9px 10px", background: "#f8fafc", fontSize: 13 }}>
        {statusOptions.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "9px 10px", background: "#f8fafc", fontSize: 13 }}>
        {statusOptions.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
  );
}
