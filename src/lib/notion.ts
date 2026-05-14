import { Client } from "@notionhq/client";
import type {
  GetDatabaseResponse,
  PageObjectResponse,
  QueryDataSourceResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { DecisionResult, Policy, SurgicalCase } from "@/types/domain";

const notionToken = process.env.NOTION_TOKEN;
const casesDataSourceId = process.env.NOTION_CASES_DATA_SOURCE_ID;
const policiesDataSourceId = process.env.NOTION_POLICIES_DATA_SOURCE_ID;
const documentsDataSourceId = process.env.NOTION_DOCUMENTS_DATA_SOURCE_ID;

let notionClient: Client | null = null;
const resolvedDataSourceIds = new Map<string, string>();

function getNotionClient(): Client {
  if (!notionToken) {
    throw new Error("NOTION_TOKEN no esta configurado.");
  }

  if (!notionClient) {
    notionClient = new Client({ auth: notionToken, timeoutMs: 120000 });
  }

  return notionClient;
}

export function isNotionConfigured(): boolean {
  return Boolean(notionToken && casesDataSourceId && policiesDataSourceId);
}

export function getNotionConfigStatus() {
  return {
    configured: isNotionConfigured(),
    hasToken: Boolean(notionToken),
    hasCasesDataSource: Boolean(casesDataSourceId),
    hasPoliciesDataSource: Boolean(policiesDataSourceId),
    hasDocumentsDataSource: Boolean(documentsDataSourceId),
  };
}

function isPageObject(result: QueryDataSourceResponse["results"][number]): result is PageObjectResponse {
  return result.object === "page";
}

function isObjectNotFoundError(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as { code?: string }).code === "object_not_found";
}

function extractDataSourceIdFromDatabase(database: GetDatabaseResponse): string {
  if (!("data_sources" in database) || !Array.isArray(database.data_sources) || database.data_sources.length === 0) {
    throw new Error("La base de datos de Notion no expone data sources disponibles.");
  }

  return database.data_sources[0].id;
}

async function resolveDataSourceId(databaseId: string): Promise<string> {
  const cachedId = resolvedDataSourceIds.get(databaseId);
  if (cachedId) {
    return cachedId;
  }

  const notion = getNotionClient();

  try {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const dataSourceId = extractDataSourceIdFromDatabase(database);
    resolvedDataSourceIds.set(databaseId, dataSourceId);
    return dataSourceId;
  } catch (error) {
    if (!isObjectNotFoundError(error)) {
      throw error;
    }

    await notion.dataSources.retrieve({ data_source_id: databaseId });
    resolvedDataSourceIds.set(databaseId, databaseId);
    return databaseId;
  }
}

async function queryNotionCollection(databaseOrDataSourceId: string, sorts?: Array<{ property: string; direction: "ascending" | "descending" }>) {
  const notion = getNotionClient();
  const dataSourceId = await resolveDataSourceId(databaseOrDataSourceId);

  return notion.dataSources.query({ data_source_id: dataSourceId, sorts });
}

function getProperty(page: PageObjectResponse, propertyName: string) {
  return page.properties[propertyName];
}

function getTitle(page: PageObjectResponse, propertyName: string): string {
  const property = getProperty(page, propertyName);
  if (!property || property.type !== "title") {
    return "";
  }
  return property.title.map((item) => item.plain_text).join("").trim();
}

function getRichText(page: PageObjectResponse, propertyName: string): string {
  const property = getProperty(page, propertyName);
  if (!property || property.type !== "rich_text") {
    return "";
  }
  return property.rich_text.map((item) => item.plain_text).join("").trim();
}

function getDate(page: PageObjectResponse, propertyName: string): string {
  const property = getProperty(page, propertyName);
  if (!property || property.type !== "date" || !property.date) {
    return "";
  }
  return property.date.start;
}

function getNumber(page: PageObjectResponse, propertyName: string): number {
  const property = getProperty(page, propertyName);
  if (!property || property.type !== "number" || property.number === null) {
    return 0;
  }
  return property.number;
}

function getMultiSelect(page: PageObjectResponse, propertyName: string): string[] {
  const property = getProperty(page, propertyName);
  if (!property || property.type !== "multi_select") {
    return [];
  }
  return property.multi_select.map((item) => item.name);
}

function getStatusName(page: PageObjectResponse, propertyName: string): string {
  const property = getProperty(page, propertyName);
  if (!property) {
    return "";
  }

  if (property.type === "status" && property.status) {
    return property.status.name;
  }

  if (property.type === "select" && property.select) {
    return property.select.name;
  }

  return "";
}

function getTextOrMultiSelect(page: PageObjectResponse, propertyName: string): string[] {
  const property = getProperty(page, propertyName);
  if (!property) {
    return [];
  }

  if (property.type === "multi_select") {
    return property.multi_select.map((item) => item.name);
  }

  if (property.type === "rich_text") {
    const text = property.rich_text.map((item) => item.plain_text).join("").trim();
    if (!text) {
      return [];
    }
    return text.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function mapCasePage(page: PageObjectResponse): SurgicalCase {
  return {
    notionPageId: page.id,
    caseId: getTitle(page, "case_id"),
    patientName: getRichText(page, "paciente"),
    documentId: getRichText(page, "documento_identidad"),
    policyId: getRichText(page, "policy_id"),
    diagnosis: getRichText(page, "diagnostico"),
    requestedProcedure: getRichText(page, "procedimiento_solicitado"),
    requestDate: getDate(page, "fecha_solicitud"),
    medicalReport: getRichText(page, "informe_medico"),
    submittedDocuments: getMultiSelect(page, "documentos_presentados"),
    status: (getStatusName(page, "estado") || "Nuevo") as SurgicalCase["status"],
    finalResult: getStatusName(page, "resultado_final") || getRichText(page, "resultado_final"),
    decisionReason: getRichText(page, "motivo_decision"),
    missingDocumentsText: getTextOrMultiSelect(page, "documentos_faltantes"),
    extractionConfidence: getNumber(page, "confianza_extraccion"),
    processedAt: getDate(page, "fecha_procesamiento"),
  };
}

function mapPolicyPage(page: PageObjectResponse): Policy {
  return {
    notionPageId: page.id,
    policyId: getTitle(page, "policy_id"),
    insurerName: getRichText(page, "aseguradora"),
    plan: getRichText(page, "plan"),
    policyStartDate: getDate(page, "fecha_inicio"),
    coveredProcedures: getMultiSelect(page, "procedimientos_cubiertos"),
    exclusions: getMultiSelect(page, "exclusiones"),
    waitingPeriodDays: getNumber(page, "dias_carencia"),
    requiredDocuments: getMultiSelect(page, "documentos_requeridos"),
    specialRules: getRichText(page, "reglas_especiales"),
  };
}

export async function queryCasesFromNotion(): Promise<SurgicalCase[]> {
  if (!casesDataSourceId) {
    throw new Error("NOTION_CASES_DATA_SOURCE_ID no esta configurado.");
  }

  const response = await queryNotionCollection(casesDataSourceId, [{ property: "fecha_solicitud", direction: "descending" }]);
  return response.results.filter(isPageObject).map(mapCasePage);
}

export async function queryPoliciesFromNotion(): Promise<Policy[]> {
  if (!policiesDataSourceId) {
    throw new Error("NOTION_POLICIES_DATA_SOURCE_ID no esta configurado.");
  }

  const response = await queryNotionCollection(policiesDataSourceId);
  return response.results.filter(isPageObject).map(mapPolicyPage);
}

export async function queryDocumentsFromNotion(): Promise<[]> {
  if (!documentsDataSourceId) {
    return [];
  }
  return [];
}

function getTextPropertyPayload(value: string) {
  return {
    rich_text: value
      ? [{ type: "text" as const, text: { content: value } }]
      : [],
  };
}

function splitMissingDocuments(value: string[]): string[] {
  return value.map((item) => item.trim()).filter(Boolean);
}

export async function updateCaseDecisionInNotion(notionPageId: string, decision: DecisionResult): Promise<void> {
  const notion = getNotionClient();
  const page = await notion.pages.retrieve({ page_id: notionPageId });

  if (!("properties" in page)) {
    throw new Error("No fue posible leer propiedades de la pagina para actualizar el caso.");
  }

  const existingProperties = page.properties;
  const missingDocs = splitMissingDocuments(decision.missingDocuments);

  const properties: UpdatePageParameters["properties"] = {
    motivo_decision: getTextPropertyPayload(decision.reason),
    confianza_extraccion: { number: decision.confidence },
    fecha_procesamiento: { date: { start: new Date().toISOString() } },
  };

  const estadoProperty = existingProperties.estado;
  if (estadoProperty?.type === "status") {
    properties.estado = { status: { name: decision.status } };
  } else if (estadoProperty?.type === "select") {
    properties.estado = { select: { name: decision.status } };
  }

  const resultadoProperty = existingProperties.resultado_final;
  if (resultadoProperty?.type === "select") {
    properties.resultado_final = { select: { name: decision.status } };
  } else {
    properties.resultado_final = getTextPropertyPayload(decision.status);
  }

  const faltantesProperty = existingProperties.documentos_faltantes;
  if (faltantesProperty?.type === "multi_select") {
    properties.documentos_faltantes = { multi_select: missingDocs.map((name) => ({ name })) };
  } else {
    properties.documentos_faltantes = getTextPropertyPayload(missingDocs.join(", "));
  }

  await notion.pages.update({ page_id: notionPageId, properties });
}
