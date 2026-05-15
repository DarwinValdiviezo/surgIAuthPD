import { Client } from "@notionhq/client";
import type {
  CreatePageParameters,
  GetDatabaseResponse,
  PageObjectResponse,
  QueryDataSourceResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { CaseDocument, DecisionResult, Policy, SurgicalCase } from "@/types/domain";

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
    notionClient = new Client({
      auth: notionToken,
      timeoutMs: 120000,
    });
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
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === "object_not_found"
  );
}

function isValidationError(error: unknown): error is Error & { code: string; message: string } {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === "validation_error"
  );
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
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const dataSourceId = extractDataSourceIdFromDatabase(database);
    resolvedDataSourceIds.set(databaseId, dataSourceId);
    return dataSourceId;
  } catch (error) {
    if (!isObjectNotFoundError(error)) {
      throw error;
    }

    // In some workspaces the configured id is already the data source id.
    await notion.dataSources.retrieve({
      data_source_id: databaseId,
    });

    resolvedDataSourceIds.set(databaseId, databaseId);
    return databaseId;
  }
}

async function queryNotionCollection(databaseOrDataSourceId: string, sorts?: Array<{ property: string; direction: "ascending" | "descending" }>) {
  const notion = getNotionClient();
  const dataSourceId = await resolveDataSourceId(databaseOrDataSourceId);

  return notion.dataSources.query({
    data_source_id: dataSourceId,
    sorts,
  });
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

function getCheckbox(page: PageObjectResponse, propertyName: string): boolean {
  const property = getProperty(page, propertyName);

  if (!property || property.type !== "checkbox") {
    return false;
  }

  return property.checkbox;
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

function getUrl(page: PageObjectResponse, propertyName: string): string {
  const property = getProperty(page, propertyName);

  if (!property || property.type !== "url") {
    return "";
  }

  return property.url ?? "";
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

function createTextContent(content: string) {
  return [
    {
      type: "text" as const,
      text: {
        content: content.slice(0, 1900),
      },
    },
  ];
}

function createMultiSelectOptions(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({ name: value.slice(0, 100) }));
}

async function createPageInDataSource(args: Omit<CreatePageParameters, "parent"> & { dataSourceId: string }) {
  const notion = getNotionClient();
  const dataSourceId = await resolveDataSourceId(args.dataSourceId);

  return notion.pages.create({
    parent: {
      data_source_id: dataSourceId,
      type: "data_source_id",
    },
    properties: args.properties,
  });
}

function mapCasePage(page: PageObjectResponse): SurgicalCase {
  return {
    notionPageId: page.id,
    caseId: getTitle(page, "case_id"),
    patientName: getRichText(page, "paciente"),
    insurerName: getRichText(page, "aseguradora"),
    policyId: getRichText(page, "policy_id"),
    policyStartDate: getDate(page, "inicio_poliza"),
    diagnosis: getRichText(page, "diagnostico"),
    requestedProcedure: getRichText(page, "procedimiento_solicitado"),
    requestDate: getDate(page, "fecha_solicitud"),
    submittedDocuments: getMultiSelect(page, "documentos_presentados"),
    isUrgent: getCheckbox(page, "urgente"),
    status: (getStatusName(page, "estado") || "Nuevo") as SurgicalCase["status"],
  };
}

function mapPolicyPage(page: PageObjectResponse): Policy {
  return {
    notionPageId: page.id,
    policyId: getTitle(page, "policy_id"),
    insurerName: getRichText(page, "aseguradora"),
    coveredProcedures: getMultiSelect(page, "procedimientos_cubiertos"),
    exclusions: getMultiSelect(page, "exclusiones"),
    waitingPeriodDays: getNumber(page, "dias_carencia"),
    requiredDocuments: getMultiSelect(page, "documentos_requeridos"),
  };
}

function mapDocumentPage(page: PageObjectResponse): CaseDocument {
  return {
    notionPageId: page.id,
    documentId: getTitle(page, "document_id"),
    caseId: getRichText(page, "case_id"),
    documentType: getRichText(page, "tipo_documento"),
    fileUrl: getUrl(page, "archivo_url"),
    documentStatus: getStatusName(page, "estado_documento") || "Pendiente",
    extractedText: getRichText(page, "texto_extraido"),
  };
}

export async function queryCasesFromNotion(): Promise<SurgicalCase[]> {
  if (!casesDataSourceId) {
    throw new Error("NOTION_CASES_DATA_SOURCE_ID no esta configurado.");
  }

  const response = await queryNotionCollection(casesDataSourceId, [
      {
        property: "fecha_solicitud",
        direction: "descending",
      },
    ]);

  return response.results.filter(isPageObject).map(mapCasePage);
}

export async function queryPoliciesFromNotion(): Promise<Policy[]> {
  if (!policiesDataSourceId) {
    throw new Error("NOTION_POLICIES_DATA_SOURCE_ID no esta configurado.");
  }

  const response = await queryNotionCollection(policiesDataSourceId);

  return response.results.filter(isPageObject).map(mapPolicyPage);
}

export async function queryDocumentsFromNotion(): Promise<CaseDocument[]> {
  if (!documentsDataSourceId) {
    return [];
  }

  const response = await queryNotionCollection(documentsDataSourceId);
  return response.results.filter(isPageObject).map(mapDocumentPage);
}

export async function createCaseInNotion(surgicalCase: SurgicalCase): Promise<SurgicalCase> {
  if (!casesDataSourceId) {
    throw new Error("NOTION_CASES_DATA_SOURCE_ID no esta configurado.");
  }

  const createdPage = await createPageInDataSource({
    dataSourceId: casesDataSourceId,
    properties: {
      case_id: {
        title: createTextContent(surgicalCase.caseId),
      },
      paciente: {
        rich_text: createTextContent(surgicalCase.patientName),
      },
      aseguradora: {
        rich_text: createTextContent(surgicalCase.insurerName),
      },
      policy_id: {
        rich_text: createTextContent(surgicalCase.policyId),
      },
      inicio_poliza: {
        date: {
          start: surgicalCase.policyStartDate,
        },
      },
      diagnostico: {
        rich_text: createTextContent(surgicalCase.diagnosis),
      },
      procedimiento_solicitado: {
        rich_text: createTextContent(surgicalCase.requestedProcedure),
      },
      fecha_solicitud: {
        date: {
          start: surgicalCase.requestDate,
        },
      },
      documentos_presentados: {
        multi_select: createMultiSelectOptions(surgicalCase.submittedDocuments),
      },
      urgente: {
        checkbox: surgicalCase.isUrgent,
      },
      estado: {
        status: {
          name: surgicalCase.status,
        },
      },
    },
  });

  if (!("object" in createdPage) || createdPage.object !== "page" || !("id" in createdPage)) {
    throw new Error("Notion no devolvio una pagina valida al crear el caso.");
  }

  return {
    ...surgicalCase,
    notionPageId: createdPage.id,
  };
}

export async function createPolicyInNotion(policy: Policy): Promise<Policy> {
  if (!policiesDataSourceId) {
    throw new Error("NOTION_POLICIES_DATA_SOURCE_ID no esta configurado.");
  }

  const createdPage = await createPageInDataSource({
    dataSourceId: policiesDataSourceId,
    properties: {
      policy_id: {
        title: createTextContent(policy.policyId),
      },
      aseguradora: {
        rich_text: createTextContent(policy.insurerName),
      },
      procedimientos_cubiertos: {
        multi_select: createMultiSelectOptions(policy.coveredProcedures),
      },
      exclusiones: {
        multi_select: createMultiSelectOptions(policy.exclusions),
      },
      dias_carencia: {
        number: policy.waitingPeriodDays,
      },
      documentos_requeridos: {
        multi_select: createMultiSelectOptions(policy.requiredDocuments),
      },
    },
  });

  if (!("object" in createdPage) || createdPage.object !== "page" || !("id" in createdPage)) {
    throw new Error("Notion no devolvio una pagina valida al crear la poliza.");
  }

  return {
    ...policy,
    notionPageId: createdPage.id,
  };
}

export async function createDocumentInNotion(document: CaseDocument): Promise<CaseDocument> {
  if (!documentsDataSourceId) {
    throw new Error("NOTION_DOCUMENTS_DATA_SOURCE_ID no esta configurado.");
  }

  const baseProperties: NonNullable<CreatePageParameters["properties"]> = {
    document_id: {
      title: createTextContent(document.documentId),
    },
    case_id: {
      rich_text: createTextContent(document.caseId),
    },
    tipo_documento: {
      rich_text: createTextContent(document.documentType),
    },
    estado_documento: {
      status: {
        name: document.documentStatus,
      },
    },
    texto_extraido: {
      rich_text: createTextContent(document.extractedText),
    },
  };

  let createdPage;

  try {
    createdPage = await createPageInDataSource({
      dataSourceId: documentsDataSourceId,
      properties: document.fileUrl
        ? {
            ...baseProperties,
            archivo_url: {
              url: document.fileUrl,
            },
          }
        : baseProperties,
    });
  } catch (error) {
    if (!(isValidationError(error) && error.message.includes("archivo_url"))) {
      throw error;
    }

    createdPage = await createPageInDataSource({
      dataSourceId: documentsDataSourceId,
      properties: baseProperties,
    });
  }

  if (!("object" in createdPage) || createdPage.object !== "page" || !("id" in createdPage)) {
    throw new Error("Notion no devolvio una pagina valida al crear el documento.");
  }

  return {
    ...document,
    notionPageId: createdPage.id,
  };
}

export async function updateCaseDecisionInNotion(
  notionPageId: string,
  decision: DecisionResult,
): Promise<void> {
  const notion = getNotionClient();

  const properties: UpdatePageParameters["properties"] = {
    estado: {
      status: {
        name: decision.status,
      },
    },
    resultado_final: {
      rich_text: [
        {
          type: "text",
          text: {
            content: decision.status,
          },
        },
      ],
    },
    motivo_decision: {
      rich_text: [
        {
          type: "text",
          text: {
            content: decision.reason,
          },
        },
      ],
    },
    documentos_faltantes: {
      multi_select: decision.missingDocuments.map((item) => ({ name: item })),
    },
    confianza_extraccion: {
      number: decision.confidence,
    },
  };

  await notion.pages.update({
    page_id: notionPageId,
    properties,
  });
}
