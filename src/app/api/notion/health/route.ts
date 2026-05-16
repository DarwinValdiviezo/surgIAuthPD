import { NextResponse } from "next/server";
import { getNotionSetupStatus } from "@/lib/case-service";
import { getGeminiStatus } from "@/lib/gemini";
import { queryCasesFromNotion, queryDocumentsFromNotion, queryPoliciesFromNotion } from "@/lib/notion";

export async function GET() {
  const config = getNotionSetupStatus();
  const gemini = getGeminiStatus();

  if (!config.configured) {
    return NextResponse.json({
      ok: false,
      mode: "unconfigured",
      config,
      gemini,
      message: "Notion aun no esta configurado.",
    });
  }

  try {
    const [cases, policies, documents] = await Promise.all([
      queryCasesFromNotion(),
      queryPoliciesFromNotion(),
      queryDocumentsFromNotion(),
    ]);

    return NextResponse.json({
      ok: true,
      mode: "notion",
      config,
      gemini,
      message: "La conexion con Notion esta lista.",
      counts: {
        cases: cases.length,
        policies: policies.length,
        documents: documents.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mode: "notion",
        config,
        gemini,
        message: "La configuracion existe, pero Notion no pudo responder correctamente.",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
