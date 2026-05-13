import { mockCases, mockPolicies } from "@/lib/mock-data";
import {
  createCaseInNotion,
  createDocumentInNotion,
  createPolicyInNotion,
  getNotionConfigStatus,
  isNotionConfigured,
  queryCasesFromNotion,
  queryDocumentsFromNotion,
  queryPoliciesFromNotion,
  updateCaseDecisionInNotion,
} from "@/lib/notion";
import { CaseDocument, DecisionResult, Policy, SurgicalCase } from "@/types/domain";

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

const CACHE_TTL_MS = 30000;

let casesCache: { expiresAt: number; data: SurgicalCase[] } | null = null;
let policiesCache: { expiresAt: number; data: Policy[] } | null = null;
let documentsCache: { expiresAt: number; data: CaseDocument[] } | null = null;

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

export async function listDocuments(): Promise<CaseDocument[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  const cachedDocuments = getValidCacheEntry(documentsCache);
  if (cachedDocuments) {
    return cachedDocuments;
  }

  try {
    const documents = await queryDocumentsFromNotion();
    documentsCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      data: documents,
    };
    return documents;
  } catch (error) {
    console.error("Fallo al consultar documentos en Notion, se devolvera lista vacia.", error);
    return [];
  }
}

export async function findDocumentsByCaseId(caseId: string): Promise<CaseDocument[]> {
  const documents = await listDocuments();
  const normalizedCaseId = normalizeIdentifier(caseId);

  return documents.filter(
    (item) => normalizeIdentifier(item.caseId) === normalizedCaseId,
  );
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
    documentsCache = null;
    return "notion";
  } catch (error) {
    console.error("Fallo al persistir la decision en Notion.", error);
    return "notion_failed";
  }
}

export async function createCase(surgicalCase: SurgicalCase): Promise<SurgicalCase> {
  if (!isNotionConfigured()) {
    throw new Error("La creacion de casos requiere una conexion activa con Notion.");
  }

  const createdCase = await createCaseInNotion(surgicalCase);
  casesCache = null;
  return createdCase;
}

export async function createPolicy(policy: Policy): Promise<Policy> {
  if (!isNotionConfigured()) {
    throw new Error("La creacion de polizas requiere una conexion activa con Notion.");
  }

  const createdPolicy = await createPolicyInNotion(policy);
  policiesCache = null;
  return createdPolicy;
}

export async function createDocument(document: CaseDocument): Promise<CaseDocument> {
  if (!isNotionConfigured()) {
    throw new Error("La creacion de documentos requiere una conexion activa con Notion.");
  }

  const createdDocument = await createDocumentInNotion(document);
  documentsCache = null;
  return createdDocument;
}

export function getNotionSetupStatus() {
  return getNotionConfigStatus();
}
