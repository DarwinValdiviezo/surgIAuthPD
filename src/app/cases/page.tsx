import Link from "next/link";
import { DashboardStatusPill } from "@/components/dashboard-status-pill";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { getDataSourceMode, listCases } from "@/lib/case-service";
import styles from "./cases.module.css";

function getConfidenceTone(confidence: number) {
  if (confidence >= 0.9) {
    return styles.confidenceHigh;
  }

  if (confidence >= 0.75) {
    return styles.confidenceMedium;
  }

  return styles.confidenceLow;
}

export default async function CasesPage() {
  const cases = await listCases();
  const evaluations = await Promise.all(cases.map((surgicalCase) => evaluateSurgicalCase(surgicalCase)));

  const pendingCases = evaluations.filter((item) => item.decision.status === "Pendiente por documentos");
  const manualCases = evaluations.filter((item) => item.decision.status === "Revision manual");
  const rejectedCases = evaluations.filter((item) => item.decision.status === "Rechazado por exclusion");
  const lowConfidenceCases = [...evaluations]
    .sort((left, right) => left.extraction.confidence - right.extraction.confidence)
    .slice(0, 3);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>SA</div>
            <div>
              <p className={styles.brandTitle}>SurgiAuth</p>
              <p className={styles.brandSubtitle}>Mesa operativa</p>
            </div>
          </div>

          <div className={styles.navSection}>
            <Link href="/dashboard" className={styles.navItem}>
              <span className={styles.navIcon}>01</span>
              <span>Dashboard</span>
            </Link>
            <Link href="/cases" className={styles.navItemActive}>
              <span className={styles.navIcon}>02</span>
              <span>Casos</span>
            </Link>
            <a href="/api/notion/health" className={styles.navItem}>
              <span className={styles.navIcon}>03</span>
              <span>Estado del sistema</span>
            </a>
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.sidebarStat}>
              <span>Fuente</span>
              <strong>{getDataSourceMode() === "notion" ? "Notion" : "Mock"}</strong>
            </div>
            <div className={styles.sidebarStat}>
              <span>Casos totales</span>
              <strong>{evaluations.length}</strong>
            </div>
          </div>
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <div>
              <h1 className={styles.topbarTitle}>Gestion de casos</h1>
              <p className={styles.topbarSubtitle}>
                Espacio para revisar prioridades, documentos faltantes y acceso rapido al detalle.
              </p>
            </div>
            <div className={styles.topbarLinks}>
              <Link href="/dashboard" className={styles.topbarLinkSecondary}>
                Ir al dashboard
              </Link>
              <a href="/api/notion/health" className={styles.topbarLink}>
                Ver conexion
              </a>
            </div>
          </header>

          <main className={styles.content}>
            <section className={styles.hero}>
              <div>
                <p className={styles.eyebrow}>Cola de trabajo</p>
                <h2 className={styles.headline}>Casos listos para revisar sin ruido innecesario</h2>
                <p className={styles.subhead}>
                  Esta vista se enfoca en la operacion: que casos estan pendientes, cuales tienen menor confianza y
                  cuales requieren accion inmediata.
                </p>
              </div>

              <div className={styles.summaryRail}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Pendientes por documentos</span>
                  <strong>{pendingCases.length}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Revision manual</span>
                  <strong>{manualCases.length}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Rechazados</span>
                  <strong>{rejectedCases.length}</strong>
                </div>
              </div>
            </section>

            <section className={styles.workspace}>
              <div className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h3 className={styles.panelTitle}>Listado operativo</h3>
                    <p className={styles.panelDescription}>
                      Casos reales con sus datos clave para decidir a cual entrar primero.
                    </p>
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Caso</th>
                        <th>Paciente</th>
                        <th>Poliza</th>
                        <th>Procedimiento</th>
                        <th>Estado</th>
                        <th>Docs</th>
                        <th>Confianza</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((evaluation) => (
                        <tr key={evaluation.case.caseId} className={styles.tableRow}>
                          <td className={styles.caseCell}>{evaluation.case.caseId}</td>
                          <td>
                            <div className={styles.primaryCell}>{evaluation.case.patientName}</div>
                            <div className={styles.secondaryCell}>{evaluation.case.insurerName}</div>
                          </td>
                          <td className={styles.secondaryCell}>{evaluation.case.policyId}</td>
                          <td className={styles.procedureCell}>{evaluation.case.requestedProcedure}</td>
                          <td>
                            <DashboardStatusPill
                              status={evaluation.decision.status}
                              className={styles.statusPill}
                            />
                          </td>
                          <td className={styles.secondaryCell}>{evaluation.documents.length}</td>
                          <td>
                            <span className={`${styles.confidenceBadge} ${getConfidenceTone(evaluation.extraction.confidence)}`}>
                              {Math.round(evaluation.extraction.confidence * 100)}%
                            </span>
                          </td>
                          <td>
                            <Link href={`/cases/${evaluation.case.caseId}`} className={styles.actionLink}>
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className={styles.sideStack}>
                <section className={styles.sidePanel}>
                  <div className={styles.sidePanelHeader}>
                    <h3 className={styles.sideTitle}>Prioridad inmediata</h3>
                    <span className={styles.sideCount}>{pendingCases.length}</span>
                  </div>
                  <div className={styles.sideList}>
                    {pendingCases.length > 0 ? (
                      pendingCases.map((evaluation) => (
                        <Link
                          key={evaluation.case.caseId}
                          href={`/cases/${evaluation.case.caseId}`}
                          className={styles.sideItem}
                        >
                          <div>
                            <p className={styles.sideItemTitle}>{evaluation.case.caseId}</p>
                            <p className={styles.sideItemText}>{evaluation.case.patientName}</p>
                          </div>
                          <span className={styles.sideHint}>Docs</span>
                        </Link>
                      ))
                    ) : (
                      <p className={styles.emptyCopy}>No hay casos pendientes por documentos en este momento.</p>
                    )}
                  </div>
                </section>

                <section className={styles.sidePanel}>
                  <div className={styles.sidePanelHeader}>
                    <h3 className={styles.sideTitle}>Menor confianza</h3>
                    <span className={styles.sideCount}>{lowConfidenceCases.length}</span>
                  </div>
                  <div className={styles.sideList}>
                    {lowConfidenceCases.map((evaluation) => (
                      <Link
                        key={evaluation.case.caseId}
                        href={`/cases/${evaluation.case.caseId}`}
                        className={styles.sideItem}
                      >
                        <div>
                          <p className={styles.sideItemTitle}>{evaluation.case.caseId}</p>
                          <p className={styles.sideItemText}>{evaluation.case.requestedProcedure}</p>
                        </div>
                        <span className={`${styles.confidenceBadge} ${getConfidenceTone(evaluation.extraction.confidence)}`}>
                          {Math.round(evaluation.extraction.confidence * 100)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className={styles.sidePanel}>
                  <div className={styles.sidePanelHeader}>
                    <h3 className={styles.sideTitle}>Resumen de operacion</h3>
                  </div>
                  <div className={styles.detailList}>
                    <div className={styles.detailRow}>
                      <span>Casos con Gemini</span>
                      <strong>{evaluations.filter((item) => item.extraction.source === "gemini").length}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Casos urgentes</span>
                      <strong>{evaluations.filter((item) => item.case.isUrgent).length}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Total de documentos</span>
                      <strong>{evaluations.reduce((sum, item) => sum + item.documents.length, 0)}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Modo actual</span>
                      <strong>{getDataSourceMode() === "notion" ? "Produccion local" : "Prueba mock"}</strong>
                    </div>
                  </div>
                </section>
              </aside>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
