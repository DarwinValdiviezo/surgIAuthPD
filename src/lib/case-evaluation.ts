import { findPolicyById } from "@/lib/case-service";
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
  const extraction = await extractCaseDataForMode(surgicalCase, {
    preferAI: options?.preferAI ?? false,
  });
  const decision = evaluateCoverage(surgicalCase, policy, extraction);

  return {
    case: surgicalCase,
    policy,
    extraction,
    decision,
  };
}
