import { CaseStatus } from "@/types/domain";

export const FINAL_STATUSES: CaseStatus[] = [
  "Nuevo",
  "En analisis",
  "Preaprobado",
  "Pendiente por documentos",
  "Rechazado por exclusion",
  "Revision manual",
];

export function resolveCaseStatus(result?: string, status?: string): CaseStatus {
  const candidate = (result && result.trim()) || (status && status.trim()) || "Nuevo";
  return (FINAL_STATUSES.includes(candidate as CaseStatus) ? candidate : "Nuevo") as CaseStatus;
}

export function statusColor(status: CaseStatus) {
  if (status === "Preaprobado") return "var(--success)";
  if (status === "Pendiente por documentos") return "var(--warning)";
  if (status === "Rechazado por exclusion") return "var(--danger)";
  if (status === "Revision manual") return "var(--manual)";
  if (status === "En analisis") return "var(--accent)";
  return "var(--primary)";
}
