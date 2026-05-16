import Link from "next/link";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { PoliciesFilters } from "@/features/policies/components/policies-filters";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { getDataSourceMode, listPolicies } from "@/lib/case-service";
import styles from "./policies.module.css";

const PAGE_SIZE = 8;

function formatWaitingPeriod(days: number) {
  if (days <= 0) {
    return "Sin carencia";
  }

  return `${days} dias de carencia`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function matchesWaitingBand(days: number, waitingBand: string) {
  if (!waitingBand) return true;
  if (waitingBand === "short") return days <= 30;
  if (waitingBand === "medium") return days > 30 && days <= 60;
  if (waitingBand === "long") return days > 60;
  return true;
}

function buildPoliciesUrl(params: {
  q?: string;
  insurer?: string;
  procedure?: string;
  waitingBand?: string;
  page?: number;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.insurer) search.set("insurer", params.insurer);
  if (params.procedure) search.set("procedure", params.procedure);
  if (params.waitingBand) search.set("waitingBand", params.waitingBand);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();
  return query ? `/policies?${query}` : "/policies";
}

type PoliciesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PoliciesPage({ searchParams }: PoliciesPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const policies = await listPolicies();

  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const insurer = typeof resolvedSearchParams.insurer === "string" ? resolvedSearchParams.insurer : "";
  const procedure = typeof resolvedSearchParams.procedure === "string" ? resolvedSearchParams.procedure : "";
  const waitingBand = typeof resolvedSearchParams.waitingBand === "string" ? resolvedSearchParams.waitingBand : "";
  const page = Math.max(
    1,
    Number.parseInt(typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1", 10) || 1,
  );

  const filteredPolicies = policies.filter((policy) => {
    const matchesQuery =
      !q ||
      policy.policyId.toLowerCase().includes(q.toLowerCase()) ||
      policy.insurerName.toLowerCase().includes(q.toLowerCase()) ||
      policy.coveredProcedures.some((item) => item.toLowerCase().includes(q.toLowerCase())) ||
      policy.exclusions.some((item) => item.toLowerCase().includes(q.toLowerCase()));

    const matchesInsurer = !insurer || policy.insurerName === insurer;
    const matchesProcedure = !procedure || policy.coveredProcedures.includes(procedure);
    const matchesCarencia = matchesWaitingBand(policy.waitingPeriodDays, waitingBand);

    return matchesQuery && matchesInsurer && matchesProcedure && matchesCarencia;
  });

  const totalPolicies = filteredPolicies.length;
  const totalPages = Math.max(1, Math.ceil(totalPolicies / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPolicies = filteredPolicies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = totalPolicies === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalPolicies);

  const insurerOptions = Array.from(new Set(policies.map((policy) => policy.insurerName))).sort();
  const procedureOptions = Array.from(new Set(policies.flatMap((policy) => policy.coveredProcedures))).sort();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="polizas"
          items={[...workspaceNavigationItems]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.fullWidthHeader}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar poliza por ID o aseguradora..."
              searchTargetPath="/policies"
              systemStatusLabel="Fuente de datos:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Notion activa" : "Notion no configurada"}
            />
          </div>

          <div className={styles.canvas}>

            <section className={styles.headerBlock}>
              <div>
                <h2 className={styles.title}>Catalogo de polizas</h2>
                <p className={styles.subtitle}>Gestion tecnica y requisitos de cobertura institucional.</p>
              </div>
              <div className={styles.headerActions}>
                <Link href="/api/policies/export" className={styles.secondaryButton}>
                  Exportar CSV
                </Link>
                <Link href="/policies/new" className={styles.primaryButton}>
                  Nueva poliza
                </Link>
              </div>
            </section>

            <PoliciesFilters
              key={`${q}|${insurer}|${procedure}|${waitingBand}`}
              insurerOptions={insurerOptions}
              procedureOptions={procedureOptions}
              initialValues={{ q, insurer, procedure, waitingBand }}
              classNames={{
                filtersCard: styles.filtersCard,
                filterItem: styles.filterItem,
                filterInput: styles.filterInput,
                filterAction: styles.filterAction,
                clearFilters: styles.clearFilters,
              }}
            />

            <section className={styles.tableCard}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Policy_ID</th>
                      <th>Aseguradora</th>
                      <th>Resumen de cobertura</th>
                      <th>Exclusiones criticas</th>
                      <th>Documentos requeridos</th>
                      <th className={styles.center}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPolicies.map((policy, index) => (
                      <tr key={policy.policyId} className={index % 2 === 0 ? undefined : styles.altRow}>
                        <td className={styles.mono}>{policy.policyId}</td>
                        <td>
                          <div className={styles.insurerCell}>
                            <div className={styles.insurerMark}>{getInitials(policy.insurerName)}</div>
                            <span className={styles.insurerName}>{policy.insurerName}</span>
                          </div>
                        </td>
                        <td>
                          <p className={styles.coverageText}>
                            {policy.coveredProcedures.slice(0, 3).join(", ")}. {formatWaitingPeriod(policy.waitingPeriodDays)}.
                          </p>
                        </td>
                        <td>
                          <div className={styles.tagList}>
                            {policy.exclusions.length > 0 ? (
                              policy.exclusions.slice(0, 3).map((exclusion) => (
                                <span key={exclusion} className={styles.exclusionTag}>
                                  {exclusion}
                                </span>
                              ))
                            ) : (
                              <span className={styles.emptyText}>Sin exclusiones registradas</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.documentsList}>
                            {policy.requiredDocuments.map((document) => (
                              <div key={document} className={styles.documentItem}>
                                <span className={styles.documentIndicator}>OK</span>
                                <span>{document}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className={styles.center}>
                          <div className={styles.actionStack}>
                            <Link href={`/cases?q=${encodeURIComponent(policy.policyId)}`} className={styles.actionLink}>
                              Ver casos
                            </Link>
                            <Link href={`/cases?q=${encodeURIComponent(policy.insurerName)}`} className={styles.actionLinkSecondary}>
                              Ver aseguradora
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <p className={styles.paginationText}>
                  Mostrando <strong>{startIndex}-{endIndex}</strong> de <strong>{totalPolicies}</strong> polizas registradas
                </p>
                <div className={styles.paginationControls}>
                  {currentPage > 1 ? (
                    <Link
                      href={buildPoliciesUrl({ q, insurer, procedure, waitingBand, page: currentPage - 1 })}
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
                        href={buildPoliciesUrl({ q, insurer, procedure, waitingBand, page: pageNumber })}
                        className={styles.pageButton}
                      >
                        {pageNumber}
                      </Link>
                    ),
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPoliciesUrl({ q, insurer, procedure, waitingBand, page: currentPage + 1 })}
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
