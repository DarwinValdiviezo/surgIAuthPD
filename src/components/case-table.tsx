"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SurgicalCase } from "@/types/domain";
import { resolveCaseStatus } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { FilterBar } from "@/components/filter-bar";

export function CaseTable({ cases }: { cases: SurgicalCase[] }) {
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const rows = useMemo(() => {
    return cases.filter((item) => {
      const resolved = resolveCaseStatus(item.finalResult, item.status);
      const q = query.toLowerCase();
      const matchesQuery = [item.caseId, item.patientName, item.policyId].join(" ").toLowerCase().includes(q);
      const matchesResult = resultFilter === "Todos" ? true : resolved === resultFilter;
      const matchesStatus = statusFilter === "Todos" ? true : item.status === statusFilter;
      return matchesQuery && matchesResult && matchesStatus;
    });
  }, [cases, query, resultFilter, statusFilter]);

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 8px 22px rgba(15,23,42,0.05)" }}>
      <FilterBar
        query={query}
        setQuery={setQuery}
        resultFilter={resultFilter}
        setResultFilter={setResultFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Case ID", "Paciente", "Procedimiento", "Policy ID", "Estado", "Resultado final", "Fecha", "Accion"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              const status = resolveCaseStatus(item.finalResult, item.status);
              return (
                <tr key={item.caseId} style={{ background: index % 2 === 0 ? "white" : "#fbfdff" }}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 13 }}>{item.caseId}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>{item.patientName}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>{item.requestedProcedure}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>{item.policyId}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}><StatusBadge status={item.status} /></td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}><StatusBadge status={status} /></td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>{item.requestDate || "-"}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                    <Link href={`/cases/${item.caseId}`} style={{ color: "white", background: "var(--primary)", borderRadius: 10, padding: "6px 10px", fontWeight: 700, fontSize: 12, display: "inline-flex" }}>
                      Ver caso
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
