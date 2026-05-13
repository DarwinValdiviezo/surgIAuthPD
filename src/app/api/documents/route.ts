import { NextRequest, NextResponse } from "next/server";
import { createDocument } from "@/lib/case-service";
import { createEntityId } from "@/lib/input-format";
import { CaseDocument } from "@/types/domain";

function getString(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) {
    return "";
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const caseId = getString(body, "caseId");
    const documentType = getString(body, "documentType");
    const documentStatus = getString(body, "documentStatus") || "Disponible";

    if (!caseId || !documentType) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para crear el documento." },
        { status: 400 },
      );
    }

    const document: CaseDocument = {
      documentId: getString(body, "documentId") || createEntityId("DOC"),
      caseId,
      documentType,
      fileUrl: getString(body, "fileUrl"),
      documentStatus,
      extractedText: getString(body, "extractedText"),
    };

    const createdDocument = await createDocument(document);

    return NextResponse.json(
      {
        ok: true,
        document: createdDocument,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("No se pudo crear el documento.", error);
    return NextResponse.json(
      { error: "Ocurrio un error al crear el documento en Notion." },
      { status: 500 },
    );
  }
}
