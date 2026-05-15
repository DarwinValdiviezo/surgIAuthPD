import { GoogleGenAI } from "@google/genai";
import { CaseDocument, ExtractionResult, SurgicalCase } from "@/types/domain";

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = "gemini-2.5-flash";

let geminiClient: GoogleGenAI | null = null;

const extractionSchema = {
  type: "object",
  properties: {
    detectedProcedure: {
      type: "string",
      description: "Procedimiento quirurgico identificado en el caso.",
    },
    detectedDiagnosis: {
      type: "string",
      description: "Diagnostico principal identificado en el caso.",
    },
    missingDocuments: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Lista de documentos que se infiere que aun faltan segun el caso clinico.",
    },
    confidence: {
      type: "number",
      description: "Confianza de la extraccion entre 0 y 1.",
      minimum: 0,
      maximum: 1,
    },
  },
  required: ["detectedProcedure", "detectedDiagnosis", "missingDocuments", "confidence"],
  additionalProperties: false,
} as const;

function getGeminiClient(): GoogleGenAI {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY no esta configurada.");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
    });
  }

  return geminiClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(geminiApiKey);
}

function buildExtractionPrompt(surgicalCase: SurgicalCase, documents: CaseDocument[]): string {
  const documentsBlock =
    documents.length > 0
      ? documents
          .map(
            (document) =>
              [
                `document_id: ${document.documentId}`,
                `case_id: ${document.caseId}`,
                `tipo_documento: ${document.documentType}`,
                `estado_documento: ${document.documentStatus}`,
                `texto_extraido: ${document.extractedText || "sin texto"}`,
              ].join("\n"),
          )
          .join("\n\n")
      : "Sin documentos relacionados disponibles.";

  return [
    "Actua como un analista de pre-autorizacion quirurgica.",
    "Debes extraer informacion estructurada del caso clinico entregado.",
    "No inventes datos. Si algo no aparece, devuelve un valor prudente y conservador.",
    "Si un documento esta marcado como Pendiente o Faltante, consideralo como faltante en tu evaluacion.",
    "La confianza debe estar entre 0 y 1.",
    "",
    "Caso clinico:",
    `case_id: ${surgicalCase.caseId}`,
    `paciente: ${surgicalCase.patientName}`,
    `aseguradora: ${surgicalCase.insurerName}`,
    `policy_id: ${surgicalCase.policyId}`,
    `diagnostico: ${surgicalCase.diagnosis}`,
    `procedimiento_solicitado: ${surgicalCase.requestedProcedure}`,
    `fecha_solicitud: ${surgicalCase.requestDate}`,
    `urgente: ${surgicalCase.isUrgent ? "si" : "no"}`,
    `documentos_presentados: ${surgicalCase.submittedDocuments.join(", ") || "ninguno"}`,
    "",
    "Documentos relacionados:",
    documentsBlock,
    "",
    "Devuelve exclusivamente un JSON valido con el esquema solicitado.",
  ].join("\n");
}

export async function extractCaseDataWithGemini(
  surgicalCase: SurgicalCase,
  documents: CaseDocument[],
): Promise<ExtractionResult> {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: geminiModel,
    contents: buildExtractionPrompt(surgicalCase, documents),
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
