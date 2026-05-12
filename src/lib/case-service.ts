import { mockCases, mockPolicies } from "@/lib/mock-data";
import {
  getNotionConfigStatus,
  isNotionConfigured,
  queryCasesFromNotion,
  queryPoliciesFromNotion,
  updateCaseDecisionInNotion,
} from "@/lib/notion";
import { DecisionResult, Policy, SurgicalCase } from "@/types/domain";

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

const CACHE_TTL_MS = 30000;

let casesCache: { expiresAt: number; data: SurgicalCase[] } | null = null;
let policiesCache: { expiresAt: number; data: Policy[] } | null = null;

function getValidCacheEntry<T>(entry: { expiresAt: number; data: T } | null): T | null {
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    return null;
  }

  return entry.data;
}

export function getDataSourceMode(): "notion" | "mock" {
  return isNotionConfigured() ? "notion" : "mock";
}

export async function listCases(): Promise<SurgicalCase[]> {
  if (!isNotionConfigured()) {
    return mockCases;
  }

  const cachedCases = getValidCacheEntry(casesCache);
  if (cachedCases) {
    return cachedCases;
  }

  try {
    const cases = await queryCasesFromNotion();
    casesCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: cases,
    };
    return cases;
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

  const cachedPolicies = getValidCacheEntry(policiesCache);
  if (cachedPolicies) {
    return cachedPolicies;
  }

  try {
    const policies = await queryPoliciesFromNotion();
    policiesCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: policies,
    };
    return policies;
  } catch (error) {
    console.error("Fallo al consultar polizas en Notion, se usaran mocks.", error);
    return mockPolicies;
  }
}

export async function findPolicyById(policyId: string): Promise<Policy | undefined> {
  const policies = await listPolicies();
  const normalizedPolicyId = normalizeIdentifier(policyId);

  return policies.find(
    (item) => normalizeIdentifier(item.policyId) === normalizedPolicyId,
  );
}

export async function saveCaseDecision(
  surgicalCase: SurgicalCase,
  decision: DecisionResult,
): Promise<"notion" | "mock" | "notion_failed"> {
  if (!isNotionConfigured() || !surgicalCase.notionPageId) {
    return "mock";
  }

  try {
    await updateCaseDecisionInNotion(surgicalCase.notionPageId, decision);
    casesCache = null;
    return "notion";
  } catch (error) {
    console.error("Fallo al persistir la decision en Notion.", error);
    return "notion_failed";
  }
}

export function getNotionSetupStatus() {
  return getNotionConfigStatus();
}
