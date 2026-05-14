import Link from "next/link";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { CasesFilters } from "@/features/cases/components/cases-filters";
import { ProcessCaseButton } from "@/features/cases/components/process-case-button";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { getDataSourceMode, listCases } from "@/lib/case-service";
import styles from "./cases.module.css";

const PAGE_SIZE = 10;

function isWithinRange(dateString: string, range: string) {
  if (!dateString || !range) {
    return true;
  }

  const requestDate = new Date(dateString);

  if (Number.isNaN(requestDate.getTime())) {
    return true;
  }

  const now = new Date();
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((now.getTime() - requestDate.getTime()) / dayMs);

  if (range === "30") return diffDays <= 30;
  if (range === "90") return diffDays <= 90;
  if (range === "180") return diffDays <= 180;

  return true;
}

function buildCasesUrl(params: {
  q?: string;
  insurer?: string;
  status?: string;
  procedure?: string;
  range?: string;
  page?: number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.insurer) search.set("insurer", params.insurer);
  if (params.status) search.set("status", params.status);
  if (params.procedure) search.set("procedure", params.procedure);
  if (params.range) search.set("range", params.range);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();
  return query ? `/cases?${query}` : "/cases";
}

function getStatusClass(status: string, classes: Record<string, string>) {
  if (status === "Nuevo") return classes.pending;
  if (status === "En analisis") return classes.pending;
  if (status === "Preaprobado") return classes.approved;
  if (status === "Pendiente por documentos") return classes.pending;
  return classes.denied;
}

function getStatusLabel(status: string) {
  if (status === "Nuevo") return "NUEVO";
  if (status === "En analisis") return "EN ANALISIS";
  if (status === "Preaprobado") return "APROBADO";
  if (status === "Pendiente por documentos") return "REVISION PENDIENTE";
  if (status === "Revision manual") return "REVISION REQUERIDA";
  if (status === "Rechazado por exclusion") return "DENEGADO";
  return status.toUpperCase();
}

type CasesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const cases = await listCases();
  const evaluations = await Promise.all(cases.map((surgicalCase) => evaluateSurgicalCase(surgicalCase)));

  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const insurer = typeof resolvedSearchParams.insurer === "string" ? resolvedSearchParams.insurer : "";
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "";
  const procedure = typeof resolvedSearchParams.procedure === "string" ? resolvedSearchParams.procedure : "";
  const range = typeof resolvedSearchParams.range === "string" ? resolvedSearchParams.range : "";
  const page = Math.max(
    1,
    Number.parseInt(typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1", 10) || 1,
  );

  const filteredEvaluations = evaluations.filter((item) => {
    const matchesQuery =
      !q ||
      item.case.caseId.toLowerCase().includes(q.toLowerCase()) ||
      item.case.patientName.toLowerCase().includes(q.toLowerCase()) ||
      item.case.policyId.toLowerCase().includes(q.toLowerCase()) ||
      item.case.requestedProcedure.toLowerCase().includes(q.toLowerCase()) ||
      item.case.diagnosis.toLowerCase().includes(q.toLowerCase());

    const matchesInsurer = !insurer || item.case.insurerName === insurer;
    const matchesStatus = !status || item.case.status === status;
    const matchesProcedure = !procedure || item.case.requestedProcedure === procedure;
    const matchesRange = isWithinRange(item.case.requestDate, range);

    return matchesQuery && matchesInsurer && matchesStatus && matchesProcedure && matchesRange;
  });

  const totalCases = filteredEvaluations.length;
  const totalPages = Math.max(1, Math.ceil(totalCases / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedEvaluations = filteredEvaluations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = totalCases === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalCases);

  const insurerOptions = Array.from(new Set(evaluations.map((item) => item.case.insurerName))).sort();
  const procedureOptions = Array.from(new Set(evaluations.map((item) => item.case.requestedProcedure))).sort();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="casos"
          items={[...workspaceNavigationItems]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.fullWidthHeader}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar casos, pacientes o IDs de poliza..."
              searchTargetPath="/cases"
              systemStatusLabel="Estado del sistema:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Notion activa" : "Notion no configurada"}
            />
          </div>

          <div className={styles.canvas}>

            <section className={styles.headerBlock}>
              <div>
                <h2 className={styles.title}>Gestion de casos</h2>
                <p className={styles.subtitle}>Vista operativa para validar cobertura, documentos y estado del caso</p>
              </div>
              <div className={styles.headerActions}>
                <Link href="/cases/new" className={styles.primaryButton}>
                  NUEVO CASO
                </Link>
                <Link href="/api/cases/export" className={styles.secondaryButton}>
                  EXPORTAR
                </Link>
              </div>
            </section>

            <CasesFilters
              key={`${q}|${insurer}|${status}|${procedure}|${range}`}
              insurerOptions={insurerOptions}
              procedureOptions={procedureOptions}
              initialValues={{ q, insurer, status, procedure, range }}
              classNames={{
                filtersCard: styles.filtersCard,
                filterItem: styles.filterItem,
                filterInput: styles.filterInput,
                filterActions: styles.filterActions,
                clearFilters: styles.clearFilters,
              }}
            />

            <section className={styles.tableCard}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Paciente</th>
                      <th>Aseguradora / Poliza</th>
                      <th>Procedimiento</th>
                      <th>Diagnostico</th>
                      <th>Estado</th>
                      <th className={styles.alignRight}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvaluations.map((item, index) => {
                      return (
                        <tr key={item.case.caseId} className={index % 2 === 1 ? styles.altRow : undefined}>
                          <td className={styles.mono}>{item.case.caseId}</td>
                          <td>
                            <div className={styles.primaryText}>{item.case.patientName}</div>
                            <div className={styles.secondaryText}>
                              Inicio poliza: {item.case.policyStartDate}
                            </div>
                          </td>
                          <td>
                            <div>{item.case.insurerName}</div>
                            <div className={styles.secondaryText}>{item.case.policyId}</div>
                          </td>
                          <td>{item.case.requestedProcedure}</td>
                          <td>{item.case.diagnosis}</td>
                          <td>
                            <span className={getStatusClass(item.case.status, styles)}>
                              {getStatusLabel(item.case.status)}
                            </span>
                          </td>
                          <td className={styles.alignRight}>
                            <div className={styles.rowActions}>
                              <Link href={`/cases/${item.case.caseId}`} className={styles.viewLink}>
                                Ver
                              </Link>
                              <ProcessCaseButton caseId={item.case.caseId} compact hideMessage />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <p className={styles.paginationText}>
                  Mostrando <strong>{startIndex} - {endIndex}</strong> de {totalCases} casos totales
                </p>
                <div className={styles.paginationControls}>
                  {currentPage > 1 ? (
                    <Link
                      href={buildCasesUrl({ q, insurer, status, procedure, range, page: currentPage - 1 })}
                      className={styles.pageButton}
                    >
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
                        href={buildCasesUrl({ q, insurer, status, procedure, range, page: pageNumber })}
                        className={styles.pageButton}
                      >
                        {pageNumber}
                      </Link>
                    ),
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={buildCasesUrl({ q, insurer, status, procedure, range, page: currentPage + 1 })}
                      className={styles.pageButton}
                    >
                      &gt;
                    </Link>
                  ) : (
                    <span className={styles.pageButtonDisabled}>&gt;</span>
                  )}
                </div>
              </div>
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
