import { CaseStatus } from "@/types/domain";
import { statusColor } from "@/lib/status";

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      style={{
        background: `${statusColor(status)}1A`,
        color: statusColor(status),
        border: `1px solid ${statusColor(status)}44`,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
      }}
    >
      {status}
    </span>
  );
}
