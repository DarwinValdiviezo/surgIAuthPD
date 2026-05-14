export function FlowStepCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <article
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 12,
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: -10,
          left: 12,
          background: "linear-gradient(135deg,var(--primary-dark),var(--primary))",
          color: "white",
          borderRadius: 999,
          padding: "2px 8px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {index}
      </span>
      <p style={{ margin: "8px 0 0", color: "var(--text)", fontWeight: 700, fontSize: 14 }}>{title}</p>
      <p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>{description}</p>
    </article>
  );
}
