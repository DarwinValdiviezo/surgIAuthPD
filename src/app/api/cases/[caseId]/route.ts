import { NextRequest, NextResponse } from "next/server";
import { findCaseById } from "@/lib/case-service";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";

type RouteContext = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { caseId } = await context.params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    return NextResponse.json(
      { error: "No se encontro el caso solicitado." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    await evaluateSurgicalCase(surgicalCase, {
      preferAI: true,
    }),
  );
}
