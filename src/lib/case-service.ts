import { mockCases, mockPolicies } from "@/lib/mock-data";
import {
  getNotionConfigStatus,
  isNotionConfigured,
  queryCasesFromNotion,
  queryPoliciesFromNotion,
  updateCaseDecisionInNotion,
} from "@/lib/notion";
import { DecisionResult, Policy, SurgicalCase } from "@/types/domain";

export function getDataSourceMode(): "notion" | "mock" {
  return isNotionConfigured() ? "notion" : "mock";
}

export async function listCases(): Promise<SurgicalCase[]> {
  if (!isNotionConfigured()) {
    return mockCases;
  }

  try {
    return await queryCasesFromNotion();
  } catch (error) {
    console.error("Fallo al consultar casos en Notion, se usaran mocks.", error);
    return mockCases;
  }
}

export async function findCaseById(caseId: string): Promise<SurgicalCase | undefined> {
  const cases = await listCases();
  return cases.find((item) => item.caseId === caseId);
}

export async function listPolicies(): Promise<Policy[]> {
  if (!isNotionConfigured()) {
    return mockPolicies;
  }

  try {
    return await queryPoliciesFromNotion();
  } catch (error) {
    console.error("Fallo al consultar polizas en Notion, se usaran mocks.", error);
    return mockPolicies;
  }
}

export async function findPolicyById(policyId: string): Promise<Policy | undefined> {
  const policies = await listPolicies();
  return policies.find((item) => item.policyId === policyId);
}

export async function saveCaseDecision(
  surgicalCase: SurgicalCase,
  decision: DecisionResult,
): Promise<"notion" | "mock"> {
  if (!isNotionConfigured() || !surgicalCase.notionPageId) {
    return "mock";
  }

  await updateCaseDecisionInNotion(surgicalCase.notionPageId, decision);
  return "notion";
}

export function getNotionSetupStatus() {
  return getNotionConfigStatus();
}
