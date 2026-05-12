import { DecisionResult, ExtractionResult, Policy, SurgicalCase } from "@/types/domain";
import {
  documentsMatch,
  normalizeMedicalText,
  procedureMatchesCoverage,
} from "@/lib/medical-taxonomy";

function normalize(value: string): string {
  return normalizeMedicalText(value);
}

function createChecks(overrides?: Partial<DecisionResult["checks"]>): DecisionResult["checks"] {
  return {
    policyFound: false,
    confidenceAccepted: false,
    waitingPeriodMet: false,
    covered: false,
    excluded: false,
    documentsComplete: false,
    ...overrides,
  };
}

function calculateDayDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);
}

export function evaluateCoverage(
  surgicalCase: SurgicalCase,
  policy: Policy | undefined,
  extraction: ExtractionResult,
): DecisionResult {
  const evaluatedProcedure = extraction.detectedProcedure || surgicalCase.requestedProcedure;

  if (!policy) {
    return {
      status: "Revision manual",
      reason: `No se encontro una poliza valida para el caso. Se busco policy_id ${surgicalCase.policyId}.`,
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks(),
    };
  }

  if (extraction.confidence < 0.75) {
    return {
      status: "Revision manual",
      reason: "La confianza de extraccion del informe medico es insuficiente para decidir automaticamente.",
      missingDocuments: extraction.missingDocuments,
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
      }),
    };
  }

  const requestedProcedure = normalize(evaluatedProcedure);
  const elapsedDays = calculateDayDifference(surgicalCase.policyStartDate, surgicalCase.requestDate);

  const isExcluded = policy.exclusions.some(
    (procedure) =>
      normalize(procedure) === requestedProcedure ||
      requestedProcedure.includes(normalize(procedure)),
  );

  const isCovered = policy.coveredProcedures.some(
    (procedure) => procedureMatchesCoverage(evaluatedProcedure, procedure),
  );

  const waitingPeriodMet = surgicalCase.isUrgent || elapsedDays >= policy.waitingPeriodDays;

  const requiredDocuments = policy.requiredDocuments.filter(
    (documentName) =>
      !surgicalCase.submittedDocuments.some((submittedDocument) =>
        documentsMatch(documentName, submittedDocument),
      ),
  );

  const combinedMissingDocuments = Array.from(
    new Set([...requiredDocuments, ...extraction.missingDocuments]),
  );

  if (combinedMissingDocuments.length > 0) {
    return {
      status: "Pendiente por documentos",
      reason: "El caso requiere documentos adicionales antes de emitir una preaprobacion.",
      missingDocuments: combinedMissingDocuments,
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        waitingPeriodMet,
        covered: isCovered,
        excluded: isExcluded,
      }),
    };
  }

  if (isExcluded) {
    return {
      status: "Rechazado por exclusion",
      reason: "El procedimiento solicitado esta dentro de las exclusiones registradas en la poliza.",
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        documentsComplete: true,
        waitingPeriodMet,
        covered: isCovered,
        excluded: true,
      }),
    };
  }

  if (!isCovered) {
    return {
      status: "Revision manual",
      reason: "El procedimiento no aparece en la lista de coberturas directas ni coincide con una categoria quirurgica cubierta por la poliza.",
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        documentsComplete: true,
        waitingPeriodMet,
      }),
    };
  }

  if (!waitingPeriodMet) {
    return {
      status: "Revision manual",
      reason: `La poliza aun no cumple el periodo de carencia requerido. Se registran ${elapsedDays} dias de vigencia frente a ${policy.waitingPeriodDays} dias exigidos.`,
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        documentsComplete: true,
        covered: true,
      }),
    };
  }

  return {
    status: "Preaprobado",
    reason: `El procedimiento ${evaluatedProcedure} cumple las reglas basicas de cobertura, carencia y documentacion para esta poliza.`,
    missingDocuments: [],
    confidence: extraction.confidence,
    evaluatedProcedure,
    checks: createChecks({
      policyFound: true,
      confidenceAccepted: true,
      waitingPeriodMet: true,
      covered: true,
      documentsComplete: true,
    }),
  };
}
