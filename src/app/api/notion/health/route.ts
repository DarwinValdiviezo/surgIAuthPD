import { NextResponse } from "next/server";
import { getNotionSetupStatus } from "@/lib/case-service";
import { queryCasesFromNotion, queryDocumentsFromNotion, queryPoliciesFromNotion } from "@/lib/notion";

export async function GET() {
  const config = getNotionSetupStatus();

  if (!config.configured) {
    return NextResponse.json({
      ok: false,
      mode: "mock",
      config,
      message: "Notion aun no esta configurado. Se usaran datos mock hasta completar las variables de entorno.",
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
        message: "La configuracion existe, pero Notion no pudo responder correctamente.",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
