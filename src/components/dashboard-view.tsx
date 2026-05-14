import Link from "next/link";
import styles from "@/components/dashboard-premium.module.css";
import { listCases } from "@/lib/case-service";
import { resolveCaseStatus } from "@/lib/status";

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("rechaz")) return styles.badgeDanger;
  if (normalized.includes("preapro") || normalized.includes("aproba")) return styles.badgeSuccess;
  if (normalized.includes("pend") || normalized.includes("anal")) return styles.badgeWarn;
  if (normalized.includes("revision")) return styles.badgeManual;

  return styles.badgeInfo;
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "-";
  return dateValue;
}

export async function DashboardView() {
  const cases = await listCases();

  const byStatus = (matcher: (value: string) => boolean) =>
    cases.filter((item) => matcher(resolveCaseStatus(item.finalResult, item.status).toLowerCase())).length;

  const metrics = [
    { label: "Total de casos", value: cases.length, tone: "neutral", icon: "description" },
    { label: "Nuevos", value: byStatus((s) => s.includes("nuevo")), tone: "primary", icon: "new_releases" },
    { label: "Preaprobados", value: byStatus((s) => s.includes("preapro") || s.includes("aproba")), tone: "success", icon: "check_circle" },
    { label: "Pendientes", value: byStatus((s) => s.includes("pend") || s.includes("anal")), tone: "warning", icon: "pending" },
    { label: "Rechazados", value: byStatus((s) => s.includes("rechaz")), tone: "danger", icon: "cancel" },
    { label: "Revision manual", value: byStatus((s) => s.includes("revision")), tone: "manual", icon: "clinical_notes" },
  ];

  const visibleCases = cases.slice(0, 10);

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <div className={styles.logo}>SA</div>
          <div>
            <h1 className={styles.brandTitle}>SurgiAuth</h1>
            <p className={styles.brandSubtitle}>Pre-aut quirurgica</p>
          </div>
        </div>

        <button className={styles.newButton} type="button">
          <span className="material-symbols-outlined">add_circle</span>
          Nueva Solicitud
        </button>

        <nav className={styles.nav}>
          <a className={`${styles.navItem} ${styles.navActive}`} href="#"><span className="material-symbols-outlined">grid_view</span>Inicio</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">verified</span>Autorizaciones</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">auto_awesome</span>Clinica IA</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">settings</span>Configuracion</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">contact_support</span>Soporte</a>
        </nav>

        <div className={styles.sidebarFooter}>
          <a className={styles.logout} href="#"><span className="material-symbols-outlined">logout</span>Cerrar Sesion</a>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.logoLarge}>SA</div>
            <div>
              <h2 className={styles.headerTitle}>SurgiAuth</h2>
              <h3 className={styles.headerSubtitle}>Agente de preautorizacion quirurgica en tiempo real</h3>
              <p className={styles.headerCopy}>
                Analice informes medicos provenientes de <strong>Notion</strong> de manera automatica. Nuestra inteligencia clinica valida criterios,
                detecta inconsistencias y acelera el proceso de toma de decisiones quirurgicas.
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.pills}>
              <span className={styles.pillMuted}><span className="material-symbols-outlined">sync</span>Conectado a Notion</span>
              <span className={styles.pillCyan}><span className={styles.dotPulse} />IA activa</span>
            </div>
            <button className={styles.refreshButton} type="button"><span className="material-symbols-outlined">refresh</span>Actualizar</button>
          </div>
        </header>

        <section className={styles.metricGrid}>
          {metrics.map((metric) => (
            <article key={metric.label} className={`${styles.metricCard} ${styles[`tone_${metric.tone}`]}`}>
              <span className="material-symbols-outlined">{metric.icon}</span>
              <p className={styles.metricValue}>{metric.value.toLocaleString()}</p>
              <p className={styles.metricLabel}>{metric.label}</p>
            </article>
          ))}
        </section>

        <section className={styles.flowSection}>
          <h4 className={styles.flowTitle}><span className="material-symbols-outlined">account_tree</span>Flujo del agente</h4>
          <div className={styles.flowGrid}>
            <article className={styles.flowCard}><span className={styles.flowNumber}>1</span><h5>Notion</h5><p>Sincronizacion de reportes medicos y expedientes.</p></article>
            <article className={styles.flowCard}><span className={styles.flowNumber}>2</span><h5>IA medica</h5><p>Analisis semantico y extraccion de criterios clinicos.</p></article>
            <article className={styles.flowCard}><span className={styles.flowNumber}>3</span><h5>Motor de reglas</h5><p>Cotejo contra polizas y protocolos hospitalarios.</p></article>
            <article className={`${styles.flowCard} ${styles.flowCardPrimary}`}><span className={styles.flowNumber}>4</span><h5>Decision</h5><p>Resolucion automatizada o escalamiento a experto.</p></article>
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}><span className="material-symbols-outlined">search</span><input placeholder="Buscar por paciente, Case ID o Policy ID" type="text" /></div>
            <select><option>Todos los estados</option><option>Pendiente</option><option>Preaprobado</option><option>Rechazado</option></select>
            <select><option>Resultados</option><option>IA Positivo</option><option>IA Negativo</option></select>
            <button className={styles.filterIconButton} type="button"><span className="material-symbols-outlined">filter_list</span></button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Case ID</th><th>Paciente</th><th>Procedimiento</th><th>Policy ID</th><th>Estado</th><th>Resultado final</th><th>Fecha de solicitud</th><th className={styles.right}>Accion</th></tr>
              </thead>
              <tbody>
                {visibleCases.map((currentCase) => {
                  const resolved = resolveCaseStatus(currentCase.finalResult, currentCase.status);
                  return (
                    <tr key={currentCase.caseId}>
                      <td className={styles.caseId}>{currentCase.caseId}</td>
                      <td>
                        <div className={styles.patientCell}>
                          <div className={styles.patientAvatar}>{getInitials(currentCase.patientName)}</div>
                          <span>{currentCase.patientName}</span>
                        </div>
                      </td>
                      <td>{currentCase.requestedProcedure}</td>
                      <td className={styles.policy}>{currentCase.policyId}</td>
                      <td><span className={`${styles.badge} ${statusBadge(currentCase.status)}`}>{currentCase.status}</span></td>
                      <td><span className={`${styles.badge} ${statusBadge(resolved)}`}>{resolved}</span></td>
                      <td>{formatDate(currentCase.requestDate)}</td>
                      <td className={styles.right}><Link href={`/cases/${currentCase.caseId}`}>Ver caso</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <p>Mostrando 1 a {visibleCases.length} de {cases.length} resultados</p>
            <div className={styles.paginationButtons}>
              <button type="button"><span className="material-symbols-outlined">chevron_left</span></button>
              <button className={styles.pageActive} type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p><span className="material-symbols-outlined">info</span>Datos sincronizados desde Notion - Ultima actualizacion: hace 5 minutos</p>
        </footer>
      </main>
    </div>
  );
}
