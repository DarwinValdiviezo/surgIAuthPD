import { NextResponse } from "next/server";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { listCases } from "@/lib/case-service";

function escapeCsv(value: string | number) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET() {
  const cases = await listCases();
  const evaluations = await Promise.all(cases.map((item) => evaluateSurgicalCase(item)));

  const headers = [
    "case_id",
    "paciente",
    "aseguradora",
    "policy_id",
    "procedimiento",
    "diagnostico",
    "estado",
    "confianza",
    "fuente",
    "faltantes",
  ];

  const rows = evaluations.map((item) =>
    [
      item.case.caseId,
      item.case.patientName,
      item.case.insurerName,
      item.case.policyId,
      item.case.requestedProcedure,
      item.case.diagnosis,
      item.decision.status,
      Math.round(item.extraction.confidence * 100),
      item.extraction.source ?? "rules",
      item.decision.missingDocuments.join(" | "),
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="casos-surgiauth.csv"',
    },
  });
}
