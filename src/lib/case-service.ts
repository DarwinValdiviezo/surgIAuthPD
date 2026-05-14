import {
  archivePageInNotion,
  attachFileToDocumentInNotion,
  createCaseInNotion,
  createDocumentInNotion,
  createPolicyInNotion,
  getNotionConfigStatus,
  isNotionConfigured,
  queryCasesFromNotion,
  queryDocumentsFromNotion,
  queryPoliciesFromNotion,
  updateDocumentInNotion,
  updateCaseDecisionInNotion,
} from "@/lib/notion";
import { CaseDocument, DecisionResult, Policy, SurgicalCase } from "@/types/domain";

type UploadedDocumentFile = {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
};

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

export function getDataSourceMode(): "notion" | "unconfigured" {
  return isNotionConfigured() ? "notion" : "unconfigured";
}

export async function listCases(): Promise<SurgicalCase[]> {
  if (!isNotionConfigured()) {
    return [];
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
    console.error("Fallo al consultar casos en Notion.", error);
    return [];
  }
}

export async function findCaseById(caseId: string): Promise<SurgicalCase | undefined> {
  const cases = await listCases();
  return cases.find((item) => item.caseId === caseId);
}

export async function listPolicies(): Promise<Policy[]> {
  if (!isNotionConfigured()) {
    return [];
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
    console.error("Fallo al consultar polizas en Notion.", error);
    return [];
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

export async function findDocumentById(documentId: string): Promise<CaseDocument | undefined> {
  const documents = await listDocuments();
  const normalizedDocumentId = normalizeIdentifier(documentId);

  return documents.find((item) => normalizeIdentifier(item.documentId) === normalizedDocumentId);
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
): Promise<"notion" | "notion_failed"> {
  if (!isNotionConfigured() || !surgicalCase.notionPageId) {
    return "notion_failed";
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

export async function createDocument(
  document: CaseDocument,
  uploadedFile?: UploadedDocumentFile,
): Promise<CaseDocument> {
  if (!isNotionConfigured()) {
    throw new Error("La creacion de documentos requiere una conexion activa con Notion.");
  }

  const createdDocument = await createDocumentInNotion(document);

  if (uploadedFile && createdDocument.notionPageId) {
    try {
      const attachmentUrl = await attachFileToDocumentInNotion(createdDocument.notionPageId, uploadedFile, {
        documentId: createdDocument.documentId,
        documentType: createdDocument.documentType,
      });

      createdDocument.fileUrl = attachmentUrl || createdDocument.fileUrl;
      createdDocument.storage = "notion";
    } catch (error) {
      await archivePageInNotion(createdDocument.notionPageId).catch(() => {
        console.error(`No se pudo revertir el documento parcial ${createdDocument.documentId} en Notion.`);
      });
      throw error;
    }
  }

  documentsCache = null;
  return createdDocument;
}

export async function updateDocument(
  document: CaseDocument,
  uploadedFile?: UploadedDocumentFile,
): Promise<CaseDocument> {
  if (!isNotionConfigured()) {
    throw new Error("La actualizacion de documentos requiere una conexion activa con Notion.");
  }

  const updatedDocument = await updateDocumentInNotion(document);

  if (uploadedFile && updatedDocument.notionPageId) {
    const attachmentUrl = await attachFileToDocumentInNotion(updatedDocument.notionPageId, uploadedFile, {
      documentId: updatedDocument.documentId,
      documentType: updatedDocument.documentType,
    });

    updatedDocument.fileUrl = attachmentUrl || updatedDocument.fileUrl;
    updatedDocument.storage = "notion";
    await updateDocumentInNotion(updatedDocument);
  }

  documentsCache = null;
  return updatedDocument;
}

export function getNotionSetupStatus() {
  return getNotionConfigStatus();
}
