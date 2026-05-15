import { NextRequest, NextResponse } from "next/server";
import { createPolicy } from "@/lib/case-service";
import { createEntityId, splitListInput } from "@/lib/input-format";
import { Policy } from "@/types/domain";

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

    const insurerName = getString(body, "insurerName");
    const coveredProcedures = splitListInput(getString(body, "coveredProcedures"));
    const requiredDocuments = splitListInput(getString(body, "requiredDocuments"));
    const waitingPeriodDays = Number.parseInt(getString(body, "waitingPeriodDays"), 10);

    if (!insurerName || coveredProcedures.length === 0 || requiredDocuments.length === 0 || Number.isNaN(waitingPeriodDays)) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para crear la poliza." },
        { status: 400 },
      );
    }

    const policy: Policy = {
      policyId: getString(body, "policyId") || createEntityId("POL"),
      insurerName,
      coveredProcedures,
      exclusions: splitListInput(getString(body, "exclusions")),
      waitingPeriodDays,
      requiredDocuments,
    };

    const createdPolicy = await createPolicy(policy);

    return NextResponse.json(
      {
        ok: true,
        policy: createdPolicy,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("No se pudo crear la poliza.", error);
    return NextResponse.json(
      { error: "Ocurrio un error al crear la poliza en Notion." },
      { status: 500 },
    );
  }
}
