import { NextRequest, NextResponse } from "next/server";
import { createCase } from "@/lib/case-service";
import { createEntityId, splitListInput } from "@/lib/input-format";
import { SurgicalCase } from "@/types/domain";

function getString(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) {
    return "";
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) {
    return false;
  }

  return Boolean((body as Record<string, unknown>)[key]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const patientName = getString(body, "patientName");
    const insurerName = getString(body, "insurerName");
    const policyId = getString(body, "policyId");
    const policyStartDate = getString(body, "policyStartDate");
    const diagnosis = getString(body, "diagnosis");
    const requestedProcedure = getString(body, "requestedProcedure");
    const requestDate = getString(body, "requestDate");

    if (!patientName || !insurerName || !policyId || !policyStartDate || !diagnosis || !requestedProcedure || !requestDate) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para crear el caso." },
        { status: 400 },
      );
    }

    const surgicalCase: SurgicalCase = {
      caseId: getString(body, "caseId") || createEntityId("CASE"),
      patientName,
      insurerName,
      policyId,
      policyStartDate,
      diagnosis,
      requestedProcedure,
      requestDate,
      submittedDocuments: splitListInput(getString(body, "submittedDocuments")),
      isUrgent: getBoolean(body, "isUrgent"),
      status: "Nuevo",
    };

    const createdCase = await createCase(surgicalCase);

    return NextResponse.json(
      {
        ok: true,
        case: createdCase,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("No se pudo crear el caso.", error);
    return NextResponse.json(
      { error: "Ocurrio un error al crear el caso en Notion." },
      { status: 500 },
    );
  }
}
