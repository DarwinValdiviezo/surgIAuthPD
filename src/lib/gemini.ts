import { GoogleGenAI } from "@google/genai";
import { CaseDocument, ExtractionResult, SurgicalCase } from "@/types/domain";

const geminiApiKey = process.env.GEMINI_API_KEY;
const aiProvider = (process.env.AI_PROVIDER ?? "rules").trim().toLowerCase();
const geminiModel = "gemini-2.5-flash";
const GEMINI_COOLDOWN_MS = 15 * 60 * 1000;

let geminiClient: GoogleGenAI | null = null;
let geminiCooldownUntil = 0;
let lastGeminiError: string | null = null;

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
  return aiProvider === "gemini" && Boolean(geminiApiKey);
}

export function isGeminiAvailable(): boolean {
  return isGeminiConfigured() && Date.now() >= geminiCooldownUntil;
}

export function getGeminiStatus() {
  return {
    provider: aiProvider,
    configured: isGeminiConfigured(),
    available: isGeminiAvailable(),
    model: geminiModel,
    lastError: lastGeminiError,
    cooldownUntil: geminiCooldownUntil > Date.now() ? new Date(geminiCooldownUntil).toISOString() : null,
  };
}

function extractProviderErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Error desconocido al consultar Gemini.";
}

function shouldPauseGemini(error: unknown): boolean {
  const message = extractProviderErrorMessage(error).toLowerCase();

  return (
    message.includes("resource_exhausted") ||
    message.includes("\"status\":\"resource_exhausted\"") ||
    message.includes("\"code\":429") ||
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("credits are depleted")
  );
}

function registerGeminiFailure(error: unknown) {
  lastGeminiError = extractProviderErrorMessage(error);

  if (shouldPauseGemini(error)) {
    geminiCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
  }
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
  try {
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
    lastGeminiError = null;
    geminiCooldownUntil = 0;

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
  } catch (error) {
    registerGeminiFailure(error);
    throw error;
  }
}

export async function summarizeDocumentTextWithGemini(input: {
  documentType: string;
  extractedText: string;
}): Promise<string> {
  const client = getGeminiClient();

  try {
    const response = await client.models.generateContent({
      model: geminiModel,
      contents: [
        "Actua como analista documental medico para preautorizaciones quirurgicas.",
        "Resume y limpia el texto extraido sin inventar informacion nueva.",
        "Conserva hallazgos clinicos, procedimiento, fechas y datos administrativos utiles.",
        "Devuelve solo texto plano breve y estructurado, sin markdown.",
        `Tipo de documento: ${input.documentType}`,
        "",
        "Texto extraido:",
        input.extractedText,
      ].join("\n"),
      config: {
        temperature: 0.1,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error("Gemini no devolvio texto util para el documento.");
    }

    lastGeminiError = null;
    geminiCooldownUntil = 0;
    return text;
  } catch (error) {
    registerGeminiFailure(error);
    throw error;
  }
}
