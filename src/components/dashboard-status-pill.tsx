import { CaseStatus } from "@/types/domain";

const statusStyles: Record<CaseStatus, { background: string; color: string; label: string }> = {
  Nuevo: {
    background: "#e4e2e2",
    color: "#43474e",
    label: "Nuevo",
  },
  "En analisis": {
    background: "#d4e3ff",
    color: "#2f486a",
    label: "En analisis",
  },
  Preaprobado: {
    background: "#b1f0ce",
    color: "#002114",
    label: "Preaprobado",
  },
  "Pendiente por documentos": {
    background: "#fef3c7",
    color: "#92400e",
    label: "Pendiente docs",
  },
  "Rechazado por exclusion": {
    background: "#ffdad6",
    color: "#93000a",
    label: "Rechazado",
  },
  "Revision manual": {
    background: "#fef3c7",
    color: "#92400e",
    label: "Revision manual",
  },
};

export function DashboardStatusPill({ status, className }: { status: CaseStatus; className?: string }) {
  const style = statusStyles[status];

  return (
    <span
      className={className}
      style={{
        background: style.background,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
}
