import { NextRequest, NextResponse } from "next/server";
import {
  findCaseById,
  findPolicyById,
  getDataSourceMode,
  saveCaseDecision,
} from "@/lib/case-service";
import { extractCaseData } from "@/lib/extraction";
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
  const extraction = extractCaseData(surgicalCase);
  const decision = evaluateCoverage(surgicalCase, policy, extraction);
  const persistence = await saveCaseDecision(surgicalCase, decision);

  return NextResponse.json({
    source: getDataSourceMode(),
    persistence,
    case: surgicalCase,
    policy,
    extraction,
    decision,
  });
}
