import { extractCaseDataWithGemini, isGeminiAvailable } from "@/lib/gemini";
import { CaseDocument, ExtractionResult, SurgicalCase } from "@/types/domain";

function normalizeDocumentStatus(value: string): string {
  return value.trim().toLowerCase();
}

function buildRuleBasedExtraction(
  surgicalCase: SurgicalCase,
  documents: CaseDocument[],
): ExtractionResult {
  const pendingDocuments = documents
    .filter((document) => ["pendiente", "faltante"].includes(normalizeDocumentStatus(document.documentStatus)))
    .map((document) => document.documentType)
    .filter(Boolean);

  const hasCaseSummary = Boolean(
    surgicalCase.requestedProcedure.trim() && surgicalCase.diagnosis.trim(),
  );
  const hasSubmittedDocuments = surgicalCase.submittedDocuments.length > 0;
  const hasDocumentText = documents.some((document) => document.extractedText.trim().length > 0);

  let confidence = 0.7;

  if (hasCaseSummary) {
    confidence += 0.12;
  }

  if (hasSubmittedDocuments) {
    confidence += 0.08;
  }

  if (hasDocumentText) {
    confidence += 0.08;
  }

  if (documents.length > 0) {
    confidence += 0.04;
  }

  return {
    detectedProcedure: surgicalCase.requestedProcedure,
    detectedDiagnosis: surgicalCase.diagnosis,
    missingDocuments: Array.from(new Set(pendingDocuments)),
    confidence: Math.min(0.98, Number(confidence.toFixed(2))),
    source: "rules",
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

  if (!preferAI || !isGeminiAvailable()) {
    return buildRuleBasedExtraction(surgicalCase, documents);
  }

  try {
    return await extractCaseDataWithGemini(surgicalCase, documents);
  } catch (error) {
    console.warn("Gemini no esta disponible para este caso. Se usara extraccion basada en reglas.");
    return buildRuleBasedExtraction(surgicalCase, documents);
  }
}
