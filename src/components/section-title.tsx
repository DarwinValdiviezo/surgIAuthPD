export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
      {subtitle ? <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>{subtitle}</p> : null}
    </div>
  );
}
