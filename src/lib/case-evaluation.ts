import { findDocumentsByCaseId, findPolicyById } from "@/lib/case-service";
import { extractCaseDataForMode } from "@/lib/extraction";
import { evaluateCoverage } from "@/rules/coverage";
import { CaseEvaluation, SurgicalCase } from "@/types/domain";

export async function evaluateSurgicalCase(
  surgicalCase: SurgicalCase,
  options?: {
    preferAI?: boolean;
  },
): Promise<CaseEvaluation> {
  const policy = await findPolicyById(surgicalCase.policyId);
  const documents = await findDocumentsByCaseId(surgicalCase.caseId);
  const extraction = await extractCaseDataForMode(surgicalCase, documents, {
    preferAI: options?.preferAI ?? false,
  });
  const decision = evaluateCoverage(surgicalCase, policy, extraction);

  return {
    case: surgicalCase,
    policy,
    documents,
    extraction,
    decision,
  };
}
