import { ExtractionResult, SurgicalCase } from "@/types/domain";

export function extractCaseData(surgicalCase: SurgicalCase): ExtractionResult {
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
    missingDocuments: missingDocumentsByCase[surgicalCase.caseId] ?? [],
    confidence: confidenceByCase[surgicalCase.caseId] ?? 0.9,
  };
}
