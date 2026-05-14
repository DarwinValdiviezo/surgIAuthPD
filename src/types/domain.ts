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
  insurerName: string;
  policyId: string;
  policyStartDate: string;
  diagnosis: string;
  requestedProcedure: string;
  requestDate: string;
  submittedDocuments: string[];
  isUrgent: boolean;
  status: CaseStatus;
}

export interface Policy {
  notionPageId?: string;
  policyId: string;
  insurerName: string;
  coveredProcedures: string[];
  exclusions: string[];
  waitingPeriodDays: number;
  requiredDocuments: string[];
}

export interface CaseDocument {
  notionPageId?: string;
  documentId: string;
  caseId: string;
  documentType: string;
  fileUrl: string;
  documentStatus: string;
  extractedText: string;
  storage?: "notion" | "external";
}

export interface ExtractionResult {
  detectedProcedure: string;
  detectedDiagnosis: string;
  missingDocuments: string[];
  confidence: number;
  source?: "gemini" | "rules";
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
