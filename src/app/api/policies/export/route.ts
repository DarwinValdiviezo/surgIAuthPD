import { NextResponse } from "next/server";
import { listPolicies } from "@/lib/case-service";

function escapeCsv(value: string | number) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET() {
  const policies = await listPolicies();

  const headers = [
    "policy_id",
    "aseguradora",
    "dias_carencia",
    "procedimientos_cubiertos",
    "exclusiones",
    "documentos_requeridos",
  ];

  const rows = policies.map((policy) =>
    [
      policy.policyId,
      policy.insurerName,
      policy.waitingPeriodDays,
      policy.coveredProcedures.join(" | "),
      policy.exclusions.join(" | "),
      policy.requiredDocuments.join(" | "),
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="polizas-surgiauth.csv"',
    },
  });
}
