export type CaseStatus =
  | "Nuevo"
  | "En analisis"
  | "Preaprobado"
  | "Pendiente por documentos"
  | "Rechazado por exclusion"
  | "Revision manual";

export interface SurgicalCase {
  notionPageId?: string;
  caseId: string;
  patientName: string;
  documentId: string;
  policyId: string;
  diagnosis: string;
  requestedProcedure: string;
  requestDate: string;
  medicalReport: string;
  submittedDocuments: string[];
  status: CaseStatus;
  finalResult: string;
  decisionReason: string;
  missingDocumentsText: string[];
  extractionConfidence: number;
  processedAt: string;
}

export interface Policy {
  notionPageId?: string;
  policyId: string;
  insurerName: string;
  plan: string;
  policyStartDate: string;
  coveredProcedures: string[];
  exclusions: string[];
  waitingPeriodDays: number;
  requiredDocuments: string[];
  specialRules: string;
}

export interface CaseDocument {
  notionPageId?: string;
  documentId: string;
  caseId: string;
  documentType: string;
  fileUrl: string;
  documentStatus: string;
  extractedText: string;
}

export interface ExtractionResult {
  detectedProcedure: string;
  detectedDiagnosis: string;
  missingDocuments: string[];
  confidence: number;
  source?: "gemini" | "mock";
}

export interface DecisionResult {
  status: Extract<CaseStatus, "Preaprobado" | "Pendiente por documentos" | "Rechazado por exclusion" | "Revision manual">;
  reason: string;
  missingDocuments: string[];
  confidence: number;
  evaluatedProcedure: string;
  checks: {
    policyFound: boolean;
    confidenceAccepted: boolean;
    waitingPeriodMet: boolean;
    covered: boolean;
    excluded: boolean;
    documentsComplete: boolean;
  };
}

export interface CaseEvaluation {
  case: SurgicalCase;
  policy?: Policy;
  documents: CaseDocument[];
  extraction: ExtractionResult;
  decision: DecisionResult;
}
