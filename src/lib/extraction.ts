import { extractCaseDataWithGemini, isGeminiConfigured } from "@/lib/gemini";
import { CaseDocument, ExtractionResult, SurgicalCase } from "@/types/domain";

function extractCaseDataFromMock(
  surgicalCase: SurgicalCase,
  documents: CaseDocument[],
): ExtractionResult {
  const missingDocumentsByCase: Record<string, string[]> = {
    "CASE-002": ["orden_quirurgica", "copia_poliza"],
  };

  const confidenceByCase: Record<string, number> = {
    "CASE-001": 0.96,
    "CASE-002": 0.91,
    "CASE-003": 0.94,
    "CASE-004": 0.97,
  };

  return {
    detectedProcedure: surgicalCase.requestedProcedure,
    detectedDiagnosis: surgicalCase.diagnosis,
    missingDocuments: [
      ...(missingDocumentsByCase[surgicalCase.caseId] ?? []),
      ...documents
        .filter((document) => ["pendiente", "faltante"].includes(document.documentStatus.trim().toLowerCase()))
        .map((document) => document.documentType),
    ],
    confidence: confidenceByCase[surgicalCase.caseId] ?? 0.9,
    source: "mock",
  };
}

export async function extractCaseData(surgicalCase: SurgicalCase): Promise<ExtractionResult> {
  return extractCaseDataForMode(surgicalCase, [], { preferAI: true });
}

export async function extractCaseDataForMode(
  surgicalCase: SurgicalCase,
  documents: CaseDocument[],
  options?: {
    preferAI?: boolean;
  },
): Promise<ExtractionResult> {
  const preferAI = options?.preferAI ?? true;

  if (!preferAI || !isGeminiConfigured()) {
    return extractCaseDataFromMock(surgicalCase, documents);
  }

  try {
    return await extractCaseDataWithGemini(surgicalCase, documents);
  } catch (error) {
    console.error("Fallo la extraccion con Gemini, se usara fallback mock.", error);
    return extractCaseDataFromMock(surgicalCase, documents);
  }
}
