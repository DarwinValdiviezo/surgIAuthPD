import { CaseStatus } from "@/types/domain";

const statusStyles: Record<CaseStatus, string> = {
  Nuevo: "bg-slate-100 text-slate-700",
  "En analisis": "bg-cyan-100 text-cyan-800",
  Preaprobado: "bg-emerald-100 text-emerald-800",
  "Pendiente por documentos": "bg-amber-100 text-amber-800",
  "Rechazado por exclusion": "bg-rose-100 text-rose-800",
  "Revision manual": "bg-orange-100 text-orange-800",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
