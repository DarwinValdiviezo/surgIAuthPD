import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/case-service";

function escapeCsv(value: string | number) {
  const text = String(value ?? "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET() {
  const documents = await listDocuments();

  const headers = [
    "document_id",
    "case_id",
    "tipo_documento",
    "estado_documento",
    "archivo_url",
    "texto_extraido",
  ];

  const rows = documents.map((document) =>
    [
      document.documentId,
      document.caseId,
      document.documentType,
      document.documentStatus,
      document.fileUrl,
      document.extractedText,
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="documentos-surgiauth.csv"',
    },
  });
}
