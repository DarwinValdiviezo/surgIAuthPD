import Link from "next/link";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { getDataSourceMode, listCases, listDocuments, listPolicies } from "@/lib/case-service";
import styles from "./dashboard-page.module.css";

function getMetricRate(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.max(4, Math.round((value / total) * 100));
}

export default async function DashboardPage() {
  const [cases, policies, documents] = await Promise.all([listCases(), listPolicies(), listDocuments()]);
  const evaluations = await Promise.all(cases.map((surgicalCase) => evaluateSurgicalCase(surgicalCase)));

  const preapproved = evaluations.filter((item) => item.decision.status === "Preaprobado").length;
  const pending = evaluations.filter((item) => item.decision.status === "Pendiente por documentos").length;
  const reviewRequired = evaluations.filter(
    (item) =>
      item.decision.status === "Revision manual" || item.decision.status === "Rechazado por exclusion",
  ).length;
  const averageConfidence =
    evaluations.length > 0
      ? Math.round(
          (evaluations.reduce((accumulator, item) => accumulator + item.extraction.confidence, 0) / evaluations.length) *
            100,
        )
      : 0;
  const geminiCases = evaluations.filter((item) => item.extraction.source === "gemini").length;

  const loadBars = Array.from({ length: 12 }, (_, index) => {
    const evaluation = evaluations[index % Math.max(evaluations.length, 1)];
    const confidence = evaluation ? Math.round(evaluation.extraction.confidence * 100) : 20;
    return Math.max(18, confidence);
  });

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="dashboard"
          items={[
            { key: "dashboard", label: "Dashboard", href: "/dashboard" },
            { key: "casos", label: "Casos", href: "/cases" },
            { key: "polizas", label: "Polizas", href: "/policies" },
            { key: "documentos", label: "Documentos", href: "/documents" },
            { key: "config", label: "Configuracion", href: "/settings" },
            { key: "auditoria", label: "Auditoria", href: "/audit" },
          ]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.canvas}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar casos, pacientes o polizas..."
              searchTargetPath="/cases"
              systemStatusLabel="Estado del sistema:"
              systemStatusValue="Operativo"
            />

            <section className={styles.metrics}>
              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricLabel}>Casos totales</span>
                  <span className={styles.metricTag}>{cases.length > 0 ? "Activo" : "Sin datos"}</span>
                </div>
                <div className={styles.metricValueRow}>
                  <strong className={styles.metricValue}>{cases.length}</strong>
                  <span className={styles.metricHelper}>Cola actual</span>
                </div>
                <div className={styles.metricTrack}>
                  <div className={styles.metricFillPrimary} style={{ width: "100%" }} />
                </div>
              </article>

              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricLabel}>Preaprobados</span>
                  <span className={styles.metricTagSuccess}>IA</span>
                </div>
                <div className={styles.metricValueRow}>
                  <strong className={styles.metricValue}>{preapproved}</strong>
                  <span className={styles.metricHelper}>Resueltos</span>
                </div>
                <div className={styles.metricTrack}>
                  <div
                    className={styles.metricFillSuccess}
                    style={{ width: `${getMetricRate(preapproved, evaluations.length)}%` }}
                  />
                </div>
              </article>

              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricLabel}>Pendientes</span>
                  <span className={styles.metricTagMuted}>Documentos</span>
                </div>
                <div className={styles.metricValueRow}>
                  <strong className={styles.metricValue}>{pending}</strong>
                  <span className={styles.metricHelper}>Faltantes</span>
                </div>
                <div className={styles.metricTrack}>
                  <div
                    className={styles.metricFillMuted}
                    style={{ width: `${getMetricRate(pending, evaluations.length)}%` }}
                  />
                </div>
              </article>

              <article className={styles.metricCard}>
                <div className={styles.metricHead}>
                  <span className={styles.metricLabel}>Revision requerida</span>
                  <span className={styles.metricTagAlert}>Atencion</span>
                </div>
                <div className={styles.metricValueRow}>
                  <strong className={styles.metricValue}>{reviewRequired}</strong>
                  <span className={styles.metricHelper}>Casos criticos</span>
                </div>
                <div className={styles.metricTrack}>
                  <div
                    className={styles.metricFillAlert}
                    style={{ width: `${getMetricRate(reviewRequired, evaluations.length)}%` }}
                  />
                </div>
              </article>
            </section>

            <div className={styles.grid}>
              <section className={styles.tablePanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Casos recientes</h2>
                    <p className={styles.panelSubtitle}>Seguimiento operativo de autorizaciones quirurgicas</p>
                  </div>
                  <Link href="/cases" className={styles.panelButton}>
                    Ver toda la cola
                  </Link>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Paciente</th>
                        <th>Procedimiento</th>
                        <th>Estado</th>
                        <th className={styles.alignRight}>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((item, index) => (
                        <tr key={item.case.caseId} className={index % 2 === 1 ? styles.altRow : undefined}>
                          <td>{item.case.caseId}</td>
                          <td className={styles.tablePatient}>{item.case.patientName}</td>
                          <td className={styles.tableProcedure}>{item.case.requestedProcedure}</td>
                          <td>
                            <span
                              className={
                                item.decision.status === "Preaprobado"
                                  ? styles.statusSuccess
                                  : item.decision.status === "Pendiente por documentos"
                                    ? styles.statusPending
                                    : styles.statusAlert
                              }
                            >
                              {item.decision.status}
                            </span>
                          </td>
                          <td className={styles.alignRight}>
                            <Link href={`/cases/${item.case.caseId}`} className={styles.rowAction}>
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className={styles.sideColumn}>
                <section className={styles.aiCard}>
                  <div className={styles.aiHeader}>
                    <h3 className={styles.aiTitle}>Motor Gemini</h3>
                    <span className={styles.aiBadge}>Activo</span>
                  </div>
                  <p className={styles.aiHeadline}>Analisis neural operativo</p>
                  <div className={styles.aiProgressRow}>
                    <div className={styles.aiProgressTrack}>
                      <div className={styles.aiProgressFill} style={{ width: `${averageConfidence}%` }} />
                    </div>
                    <span className={styles.aiProgressValue}>{averageConfidence}% de confianza</span>
                  </div>
                  <p className={styles.aiCopy}>
                    El agente analiza informes medicos, reglas de poliza y documentos del caso en tiempo real.
                  </p>
                </section>

                <section className={styles.card}>
                  <div className={styles.panelHeaderCompact}>
                    <h3 className={styles.panelTitle}>Carga de procesamiento</h3>
                    <span className={styles.sideNote}>Casos Gemini: {geminiCases}</span>
                  </div>
                  <div className={styles.chart}>
                    {loadBars.map((height, index) => (
                      <div
                        key={`${height}-${index}`}
                        className={index === 5 ? styles.chartBarActive : styles.chartBar}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className={styles.chartLabels}>
                    <span>00:00</span>
                    <span>12:00</span>
                    <span>23:59</span>
                  </div>
                </section>

                <section className={styles.card}>
                  <div className={styles.panelHeaderCompact}>
                    <h3 className={styles.panelTitle}>Salud de la instancia</h3>
                  </div>
                  <div className={styles.healthList}>
                    <div className={styles.healthRow}>
                      <span>Fuente de casos</span>
                      <strong>{getDataSourceMode() === "notion" ? "OK" : "Mock"}</strong>
                    </div>
                    <div className={styles.healthRow}>
                      <span>Base de polizas</span>
                      <strong>{policies.length > 0 ? "OK" : "Vacia"}</strong>
                    </div>
                    <div className={styles.healthRow}>
                      <span>Capa documental</span>
                      <strong>{documents.length > 0 ? "OK" : "Pendiente"}</strong>
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            <section className={styles.alertBar}>
              <div className={styles.alertContent}>
                <div className={styles.alertIcon}>i</div>
                <div>
                  <h4 className={styles.alertTitle}>Nota operativa</h4>
                  <p className={styles.alertCopy}>
                    El sistema esta listo para continuar con revision de casos en vivo usando la informacion actual de
                    Notion y los documentos ya cargados.
                  </p>
                </div>
              </div>
            </section>

            <div className={styles.fabWrap}>
              <Link href="/cases" className={styles.fab}>
                Abrir cola de casos
              </Link>
            </div>

            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
