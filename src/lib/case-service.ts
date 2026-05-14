import { mockCases, mockPolicies } from "@/lib/mock-data";
import {
  getNotionConfigStatus,
  isNotionConfigured,
  queryCasesFromNotion,
  queryDocumentsFromNotion,
  queryPoliciesFromNotion,
  updateCaseDecisionInNotion,
} from "@/lib/notion";
import { DecisionResult, Policy, SurgicalCase } from "@/types/domain";

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

type PersistedMockCase = SurgicalCase;

const mockCasesStore: PersistedMockCase[] = mockCases.map((item) => ({ ...item, missingDocumentsText: [...item.missingDocumentsText], submittedDocuments: [...item.submittedDocuments] }));
const mockPoliciesStore: Policy[] = mockPolicies.map((item) => ({ ...item, coveredProcedures: [...item.coveredProcedures], exclusions: [...item.exclusions], requiredDocuments: [...item.requiredDocuments] }));

function getMockCasesSnapshot(): SurgicalCase[] {
  return mockCasesStore.map((item) => ({ ...item, missingDocumentsText: [...item.missingDocumentsText], submittedDocuments: [...item.submittedDocuments] }));
}

function getMockPoliciesSnapshot(): Policy[] {
  return mockPoliciesStore.map((item) => ({ ...item, coveredProcedures: [...item.coveredProcedures], exclusions: [...item.exclusions], requiredDocuments: [...item.requiredDocuments] }));
}

export function getDataSourceMode(): "notion" | "mock" {
  return isNotionConfigured() ? "notion" : "mock";
}

export async function listCases(): Promise<SurgicalCase[]> {
  if (!isNotionConfigured()) return getMockCasesSnapshot();
  try {
    return await queryCasesFromNotion();
  } catch (error) {
    console.error("Fallo al consultar casos en Notion, se usaran mocks.", error);
    return getMockCasesSnapshot();
  }
}

export async function findCaseById(caseId: string): Promise<SurgicalCase | undefined> {
  const cases = await listCases();
  return cases.find((item) => item.caseId === caseId);
}

export async function listPolicies(): Promise<Policy[]> {
  if (!isNotionConfigured()) return getMockPoliciesSnapshot();
  try {
    return await queryPoliciesFromNotion();
  } catch (error) {
    console.error("Fallo al consultar polizas en Notion, se usaran mocks.", error);
    return getMockPoliciesSnapshot();
  }
}

export async function listDocuments(): Promise<[]> {
  if (!isNotionConfigured()) return [];
  try {
    return await queryDocumentsFromNotion();
  } catch {
    return [];
  }
}

export async function findPolicyById(policyId: string): Promise<Policy | undefined> {
  const policies = await listPolicies();
  const normalizedPolicyId = normalizeIdentifier(policyId);
  return policies.find((item) => normalizeIdentifier(item.policyId) === normalizedPolicyId);
}

export async function saveCaseDecision(
  surgicalCase: SurgicalCase,
  decision: DecisionResult,
): Promise<"notion" | "mock" | "notion_failed"> {
  if (!isNotionConfigured()) {
    const mockCase = mockCasesStore.find((item) => item.caseId === surgicalCase.caseId);
    if (mockCase) {
      mockCase.status = decision.status;
      mockCase.finalResult = decision.status;
      mockCase.decisionReason = decision.reason;
      mockCase.missingDocumentsText = [...decision.missingDocuments];
      mockCase.extractionConfidence = decision.confidence;
      mockCase.processedAt = new Date().toISOString();
    }
    return "mock";
  }

  if (!surgicalCase.notionPageId) return "notion_failed";

  try {
    await updateCaseDecisionInNotion(surgicalCase.notionPageId, decision);
    return "notion";
  } catch (error) {
    console.error("Fallo al persistir la decision en Notion.", error);
    return "notion_failed";
  }
}

export function getNotionSetupStatus() {
  return getNotionConfigStatus();
}
