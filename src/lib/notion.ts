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
const NOTION_DIRECT_UPLOAD_LIMIT_BYTES = 20 * 1024 * 1024;

type UploadedDocumentFile = {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
};

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

function sanitizeFileName(filename: string, fallbackExtension = ".pdf") {
  const normalized = filename.trim().replace(/[\\/:*?"<>|]+/g, "_");

  if (!normalized) {
    return `documento${fallbackExtension}`;
  }

  if (normalized.includes(".")) {
    return normalized.slice(0, 180);
  }

  return `${normalized.slice(0, 176)}${fallbackExtension}`;
}

function inferExtensionFromContentType(contentType: string) {
  if (contentType === "application/pdf") {
    return ".pdf";
  }

  if (contentType === "text/plain") {
    return ".txt";
  }

  if (contentType === "text/markdown") {
    return ".md";
  }

  if (contentType === "application/json") {
    return ".json";
  }

  if (contentType === "text/csv") {
    return ".csv";
  }

  return ".bin";
}

function getCaptionContent(value: string) {
  return [
    {
      type: "text" as const,
      text: {
        content: value.slice(0, 1900),
      },
    },
  ];
}

function getNotionHostedUrlFromBlock(block: Record<string, unknown>): string {
  const blockType = typeof block.type === "string" ? block.type : "";

  if (blockType !== "file" && blockType !== "pdf") {
    return "";
  }

  const payload = block[blockType];
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const type = "type" in payload && typeof payload.type === "string" ? payload.type : "";

  if (type === "file" && "file" in payload && payload.file && typeof payload.file === "object") {
    const filePayload = payload.file as { url?: string };
    return typeof filePayload.url === "string" ? filePayload.url : "";
  }

  if (type === "external" && "external" in payload && payload.external && typeof payload.external === "object") {
    const externalPayload = payload.external as { url?: string };
    return typeof externalPayload.url === "string" ? externalPayload.url : "";
  }

  return "";
}

async function waitForUploadedFile(fileUploadId: string): Promise<void> {
  const notion = getNotionClient();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const upload = await notion.fileUploads.retrieve({
      file_upload_id: fileUploadId,
    });

    if (upload.status === "uploaded") {
      return;
    }

    if (upload.status === "failed" || upload.status === "expired") {
      throw new Error(`La carga del archivo en Notion termino con estado ${upload.status}.`);
    }

    await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
  }

  throw new Error("Notion no confirmo la carga del archivo dentro del tiempo esperado.");
}

async function updateDocumentAttachmentUrl(pageId: string, fileUrl: string) {
  const notion = getNotionClient();

  if (!fileUrl) {
    return;
  }

  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        archivo_url: {
          url: fileUrl,
        },
      },
    });
  } catch (error) {
    if (!(isValidationError(error) && error.message.includes("archivo_url"))) {
      throw error;
    }
  }
}

async function enrichDocumentWithAttachmentUrl(document: CaseDocument): Promise<CaseDocument> {
  if ((!document.notionPageId || document.fileUrl) && document.storage !== "notion") {
    return document;
  }

  if (!document.notionPageId) {
    return document;
  }

  const notion = getNotionClient();

  try {
    const response = await notion.blocks.children.list({
      block_id: document.notionPageId,
      page_size: 20,
    });

    for (const block of response.results) {
      if (block.object !== "block") {
        continue;
      }

      const liveUrl = getNotionHostedUrlFromBlock(block as Record<string, unknown>);

      if (liveUrl) {
        return {
          ...document,
          fileUrl: liveUrl,
          storage: "notion",
        };
      }
    }
  } catch (error) {
    console.error(`No se pudo resolver el adjunto en Notion para ${document.documentId}.`, error);
  }

  return document;
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
    storage: getUrl(page, "archivo_url") ? "external" : undefined,
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
  const documents = response.results.filter(isPageObject).map(mapDocumentPage);
  return Promise.all(documents.map(enrichDocumentWithAttachmentUrl));
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

export async function updateDocumentInNotion(document: CaseDocument): Promise<CaseDocument> {
  if (!document.notionPageId) {
    throw new Error("El documento no tiene notionPageId para actualizarse.");
  }

  const notion = getNotionClient();
  const baseProperties: UpdatePageParameters["properties"] = {
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

  try {
    await notion.pages.update({
      page_id: document.notionPageId,
      properties: {
        ...baseProperties,
        archivo_url: {
          url: document.fileUrl || null,
        },
      },
    });
  } catch (error) {
    if (!(isValidationError(error) && error.message.includes("archivo_url"))) {
      throw error;
    }

    await notion.pages.update({
      page_id: document.notionPageId,
      properties: baseProperties,
    });
  }

  return document;
}

export async function attachFileToDocumentInNotion(
  notionPageId: string,
  uploadedFile: UploadedDocumentFile,
  metadata: {
    documentId: string;
    documentType: string;
  },
): Promise<string> {
  if (uploadedFile.bytes.byteLength > NOTION_DIRECT_UPLOAD_LIMIT_BYTES) {
    throw new Error("Notion solo admite cargas directas de hasta 20 MB en este flujo.");
  }

  const notion = getNotionClient();
  const inferredExtension = inferExtensionFromContentType(uploadedFile.contentType);
  const filename = sanitizeFileName(uploadedFile.filename, inferredExtension);
  const upload = await notion.fileUploads.create({
    mode: "single_part",
    filename,
    content_type: uploadedFile.contentType || undefined,
  });
  const fileBuffer = uploadedFile.bytes.buffer.slice(
    uploadedFile.bytes.byteOffset,
    uploadedFile.bytes.byteOffset + uploadedFile.bytes.byteLength,
  ) as ArrayBuffer;

  await notion.fileUploads.send({
    file_upload_id: upload.id,
    file: {
      data: new Blob([fileBuffer], {
        type: uploadedFile.contentType || "application/octet-stream",
      }),
      filename,
    },
  });

  await waitForUploadedFile(upload.id);

  const isPdf = filename.toLowerCase().endsWith(".pdf");
  const appended = await notion.blocks.children.append({
    block_id: notionPageId,
    children: [
      {
        object: "block",
        type: isPdf ? "pdf" : "file",
        [isPdf ? "pdf" : "file"]: {
          type: "file_upload",
          file_upload: {
            id: upload.id,
          },
          caption: getCaptionContent(`${metadata.documentType} · ${metadata.documentId}`),
        },
      },
    ],
  } as never);

  const results = "results" in appended && Array.isArray(appended.results) ? appended.results : [];
  const firstBlock = results[0] as Record<string, unknown> | undefined;
  const liveUrl = firstBlock ? getNotionHostedUrlFromBlock(firstBlock) : "";

  if (liveUrl) {
    await updateDocumentAttachmentUrl(notionPageId, liveUrl);
  }

  return liveUrl;
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

export async function archivePageInNotion(pageId: string): Promise<void> {
  const notion = getNotionClient();

  await notion.pages.update({
    page_id: pageId,
    in_trash: true,
  });
}
