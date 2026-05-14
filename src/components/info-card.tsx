import { ReactNode } from "react";

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 20, letterSpacing: "-0.02em" }}>{title}</h3>
      {children}
    </article>
  );
}
