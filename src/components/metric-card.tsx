export function MetricCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <article
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 11, fontWeight: 700 }}>{label}</p>
        <span style={{ color, fontSize: 14, fontWeight: 800 }}>{icon}</span>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
    </article>
  );
}
