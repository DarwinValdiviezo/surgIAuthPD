import { NextRequest, NextResponse } from "next/server";
import { findCaseById, findPolicyById } from "@/lib/case-service";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { caseId } = await context.params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    return NextResponse.json({ error: "No se encontro el caso solicitado." }, { status: 404 });
  }

  const policy = await findPolicyById(surgicalCase.policyId);

  return NextResponse.json({
    case: surgicalCase,
    policy,
    message: surgicalCase.finalResult ? undefined : "Caso pendiente de procesamiento",
  });
}
