import { GoogleGenAI } from "@google/genai";
import { ExtractionResult, SurgicalCase } from "@/types/domain";

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = "gemini-2.5-flash";

let geminiClient: GoogleGenAI | null = null;

const extractionSchema = {
  type: "object",
  properties: {
    detectedProcedure: { type: "string" },
    detectedDiagnosis: { type: "string" },
    missingDocuments: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["detectedProcedure", "detectedDiagnosis", "missingDocuments", "confidence"],
  additionalProperties: false,
} as const;

function getGeminiClient(): GoogleGenAI {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY no esta configurada.");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  return geminiClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(geminiApiKey);
}

function buildExtractionPrompt(surgicalCase: SurgicalCase): string {
  return [
    "Actua como extractor clinico para preautorizacion quirurgica.",
    "Solo extrae informacion del informe medico y metadatos del caso.",
    "No tomes decision de aprobacion o rechazo.",
    "Devuelve unicamente JSON valido segun el esquema.",
    "",
    `case_id: ${surgicalCase.caseId}`,
    `paciente: ${surgicalCase.patientName}`,
    `documento_identidad: ${surgicalCase.documentId}`,
    `diagnostico: ${surgicalCase.diagnosis}`,
    `procedimiento_solicitado: ${surgicalCase.requestedProcedure}`,
    `informe_medico: ${surgicalCase.medicalReport || "sin informe"}`,
    `documentos_presentados: ${surgicalCase.submittedDocuments.join(", ") || "ninguno"}`,
    `fecha_solicitud: ${surgicalCase.requestDate}`,
  ].join("\n");
}

export async function extractCaseDataWithGemini(surgicalCase: SurgicalCase): Promise<ExtractionResult> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: geminiModel,
    contents: buildExtractionPrompt(surgicalCase),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: extractionSchema,
      temperature: 0.1,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini no devolvio contenido util.");
  }

  const parsed = JSON.parse(text) as ExtractionResult;

  return {
    detectedProcedure: parsed.detectedProcedure || surgicalCase.requestedProcedure,
    detectedDiagnosis: parsed.detectedDiagnosis || surgicalCase.diagnosis,
    missingDocuments: Array.isArray(parsed.missingDocuments) ? parsed.missingDocuments : [],
    confidence:
      typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0.8,
    source: "gemini",
  };
}
