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
      reason: `No se encontro una poliza valida para policy_id ${surgicalCase.policyId}.`,
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks(),
    };
  }

  if (extraction.confidence < 0.75) {
    return {
      status: "Revision manual",
      reason: "La confianza de extraccion del informe medico es menor a 0.75.",
      missingDocuments: extraction.missingDocuments,
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({ policyFound: true }),
    };
  }

  const requestedProcedure = normalize(evaluatedProcedure);
  const isExcluded = policy.exclusions.some(
    (procedure) => normalize(procedure) === requestedProcedure || requestedProcedure.includes(normalize(procedure)),
  );

  if (isExcluded) {
    return {
      status: "Rechazado por exclusion",
      reason: "El procedimiento solicitado coincide con una exclusion de la poliza.",
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        excluded: true,
      }),
    };
  }

  const requiredMissingDocuments = policy.requiredDocuments.filter(
    (documentName) => !surgicalCase.submittedDocuments.some((submitted) => documentsMatch(documentName, submitted)),
  );

  const combinedMissingDocuments = Array.from(new Set([...requiredMissingDocuments, ...extraction.missingDocuments]));

  if (combinedMissingDocuments.length > 0) {
    return {
      status: "Pendiente por documentos",
      reason: "Faltan documentos requeridos para continuar con la preautorizacion.",
      missingDocuments: combinedMissingDocuments,
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        excluded: false,
      }),
    };
  }

  const isCovered = policy.coveredProcedures.some((procedure) => procedureMatchesCoverage(evaluatedProcedure, procedure));

  if (!isCovered) {
    return {
      status: "Revision manual",
      reason: "El procedimiento no aparece dentro de las coberturas configuradas para la poliza.",
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        documentsComplete: true,
      }),
    };
  }

  const elapsedDays = calculateDayDifference(policy.policyStartDate, surgicalCase.requestDate);
  const waitingPeriodMet = elapsedDays >= policy.waitingPeriodDays;

  if (!waitingPeriodMet) {
    return {
      status: "Revision manual",
      reason: `No cumple carencia: ${elapsedDays} dias de vigencia frente a ${policy.waitingPeriodDays} requeridos.`,
      missingDocuments: [],
      confidence: extraction.confidence,
      evaluatedProcedure,
      checks: createChecks({
        policyFound: true,
        confidenceAccepted: true,
        covered: true,
        documentsComplete: true,
      }),
    };
  }

  return {
    status: "Preaprobado",
    reason: `El procedimiento ${evaluatedProcedure} esta cubierto, sin exclusion, con carencia cumplida y documentos completos.`,
    missingDocuments: [],
    confidence: extraction.confidence,
    evaluatedProcedure,
    checks: createChecks({
      policyFound: true,
      confidenceAccepted: true,
      waitingPeriodMet: true,
      covered: true,
      excluded: false,
      documentsComplete: true,
    }),
  };
}
