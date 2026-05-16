import Link from "next/link";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DocumentFilePreview } from "@/features/documents/components/document-file-preview";
import { DocumentsFilters } from "@/features/documents/components/documents-filters";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { getDataSourceMode, listCases, listDocuments } from "@/lib/case-service";
import styles from "./documents.module.css";

const PAGE_SIZE = 10;

function getStatusClass(status: string, classes: Record<string, string>) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "procesado") {
    return classes.statusReady;
  }

  if (normalized === "pendiente") {
    return classes.statusPending;
  }

  return classes.statusAvailable;
}

function getPreview(text: string) {
  if (!text.trim()) {
    return "Sin texto extraido disponible.";
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

function getDocumentTypeLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getDocumentStorageLabel(storage?: "notion" | "external", fileUrl?: string) {
  if (storage === "notion") {
    return "Adjunto en Notion";
  }

  if (fileUrl) {
    return "Enlace externo";
  }

  return "Sin archivo";
}

function buildDocumentsUrl(params: {
  q?: string;
  status?: string;
  type?: string;
  caseId?: string;
  page?: number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.type) search.set("type", params.type);
  if (params.caseId) search.set("caseId", params.caseId);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();
  return query ? `/documents?${query}` : "/documents";
}

type DocumentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const [documents, cases] = await Promise.all([listDocuments(), listCases()]);

  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "";
  const type = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "";
  const caseId = typeof resolvedSearchParams.caseId === "string" ? resolvedSearchParams.caseId : "";
  const page = Math.max(
    1,
    Number.parseInt(typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1", 10) || 1,
  );

  const filteredDocuments = documents.filter((document) => {
    const matchesQuery =
      !q ||
      document.documentId.toLowerCase().includes(q.toLowerCase()) ||
      document.caseId.toLowerCase().includes(q.toLowerCase()) ||
      document.documentType.toLowerCase().includes(q.toLowerCase()) ||
      document.extractedText.toLowerCase().includes(q.toLowerCase());

    const matchesStatus = !status || document.documentStatus === status;
    const matchesType = !type || document.documentType === type;
    const matchesCase = !caseId || document.caseId === caseId;

    return matchesQuery && matchesStatus && matchesType && matchesCase;
  });

  const totalDocuments = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalDocuments / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = totalDocuments === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalDocuments);

  const caseOptions = Array.from(new Set(cases.map((item) => item.caseId))).sort();
  const typeOptions = Array.from(new Set(documents.map((item) => item.documentType))).sort();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="documentos"
          items={[...workspaceNavigationItems]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.fullWidthHeader}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar documento por caso, tipo o estado..."
              searchTargetPath="/documents"
              systemStatusLabel="Fuente documental:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Notion activa" : "Notion no configurada"}
            />
          </div>

          <div className={styles.canvas}>

            <section className={styles.headerBlock}>
              <div>
                <h2 className={styles.title}>Centro documental</h2>
                <p className={styles.subtitle}>
                  Revision de soportes clinicos y administrativos asociados a los casos quirurgicos.
                </p>
              </div>
              <div className={styles.headerActions}>
                <Link href="/api/documents/export" className={styles.secondaryButton}>
                  Exportar listado
                </Link>
                <Link href="/documents/new" className={styles.primaryButton}>
                  Nuevo documento
                </Link>
              </div>
            </section>

            <DocumentsFilters
              key={`${q}|${status}|${type}|${caseId}`}
              caseOptions={caseOptions}
              typeOptions={typeOptions}
              initialValues={{ q, status, type, caseId }}
              classNames={{
                filtersCard: styles.filtersCard,
                filterItem: styles.filterItem,
                filterInput: styles.filterInput,
                filterAction: styles.filterAction,
                clearFilters: styles.clearFilters,
              }}
            />

            <section className={styles.tableCard}>
              {documents.length > 0 ? (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Documento</th>
                          <th>Caso</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Texto extraido</th>
                          <th className={styles.center}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDocuments.map((document, index) => (
                          <tr key={document.documentId} className={index % 2 === 1 ? styles.altRow : undefined}>
                            <td>
                              <div className={styles.documentCell}>
                                <strong className={styles.documentId}>{document.documentId}</strong>
                                <span className={styles.documentMeta}>{getDocumentStorageLabel(document.storage, document.fileUrl)}</span>
                              </div>
                            </td>
                            <td>
                              <Link href={`/cases/${document.caseId}`} className={styles.caseLink}>
                                {document.caseId}
                              </Link>
                            </td>
                            <td>{getDocumentTypeLabel(document.documentType)}</td>
                            <td>
                              <span className={getStatusClass(document.documentStatus, styles)}>{document.documentStatus}</span>
                            </td>
                            <td>
                              <p className={styles.previewText}>{getPreview(document.extractedText)}</p>
                            </td>
                            <td className={styles.center}>
                              <div className={styles.actionStack}>
                                <Link href={`/cases/${document.caseId}`} className={styles.openButton}>
                                  Abrir caso
                                </Link>
                                <Link href={`/documents/${document.documentId}/edit`} className={styles.secondaryAction}>
                                  Editar
                                </Link>
                                <DocumentFilePreview fileUrl={document.fileUrl} documentId={document.documentId} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.tableFooter}>
                    <p className={styles.footerText}>
                      Mostrando <strong>{startIndex}-{endIndex}</strong> de <strong>{totalDocuments}</strong> documentos
                    </p>
                    <div className={styles.paginationControls}>
                      {currentPage > 1 ? (
                        <Link href={buildDocumentsUrl({ q, status, type, caseId, page: currentPage - 1 })} className={styles.pageButton}>
                          &lt;
                        </Link>
                      ) : (
                        <span className={styles.pageButtonDisabled}>&lt;</span>
                      )}

                      {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) =>
                        pageNumber === currentPage ? (
                          <span key={pageNumber} className={styles.pageButtonActive}>
                            {pageNumber}
                          </span>
                        ) : (
                          <Link
                            key={pageNumber}
                            href={buildDocumentsUrl({ q, status, type, caseId, page: pageNumber })}
                            className={styles.pageButton}
                          >
                            {pageNumber}
                          </Link>
                        ),
                      )}

                      {currentPage < totalPages ? (
                        <Link href={buildDocumentsUrl({ q, status, type, caseId, page: currentPage + 1 })} className={styles.pageButton}>
                          &gt;
                        </Link>
                      ) : (
                        <span className={styles.pageButtonDisabled}>&gt;</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <h3>No hay documentos cargados</h3>
                  <p>
                    Cuando Notion entregue registros en la base de `Documentos`, aqui veras el texto extraido, el
                    estado y su vinculacion con cada caso.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className={styles.fullWidthFooter}>
            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
