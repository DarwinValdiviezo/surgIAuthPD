import { NextRequest, NextResponse } from "next/server";
import {
  findCaseById,
  findDocumentsByCaseId,
  findPolicyById,
  getDataSourceMode,
  saveCaseDecision,
} from "@/lib/case-service";
import { extractCaseDataForMode } from "@/lib/extraction";
import { evaluateCoverage } from "@/rules/coverage";

export async function GET() {
  return NextResponse.json({
    message: "Usa POST con un body JSON que incluya caseId para procesar un caso.",
    source: getDataSourceMode(),
    example: {
      caseId: "CASE-001",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const caseId = body?.caseId as string | undefined;

    if (!caseId) {
      return NextResponse.json(
        { error: "caseId es obligatorio." },
        { status: 400 },
      );
    }

    const surgicalCase = await findCaseById(caseId);

    if (!surgicalCase) {
      return NextResponse.json(
        { error: "No se encontro el caso solicitado." },
        { status: 404 },
      );
    }

    const policy = await findPolicyById(surgicalCase.policyId);
    const documents = await findDocumentsByCaseId(surgicalCase.caseId);
    const extraction = await extractCaseDataForMode(surgicalCase, documents, { preferAI: true });
    const decision = evaluateCoverage(surgicalCase, policy, extraction);
    const persistence = await saveCaseDecision(surgicalCase, decision);

    return NextResponse.json({
      source: getDataSourceMode(),
      persistence,
      case: surgicalCase,
      policy,
      documents,
      extraction,
      decision,
    });
  } catch (error) {
    console.error("Fallo al procesar el caso.", error);
    return NextResponse.json(
      {
        error: "Ocurrio un error al procesar el caso.",
      },
      { status: 500 },
    );
  }
}
