import Link from "next/link";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { getDataSourceMode, listCases } from "@/lib/case-service";
import styles from "./dashboard.module.css";

function getStatusClass(status: string, classes: Record<string, string>) {
  if (status === "Preaprobado") return classes.statusSuccess;
  if (status === "Pendiente por documentos") return classes.statusPending;
  return classes.statusAlert;
}

export default async function DashboardPage() {
  const cases = await listCases();
  const evaluations = await Promise.all(cases.map((surgicalCase) => evaluateSurgicalCase(surgicalCase)));

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="dashboard"
          items={[...workspaceNavigationItems]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.fullWidthHeader}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar casos, pacientes o polizas..."
              searchTargetPath="/cases"
              systemStatusLabel="Estado del sistema:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Notion activa" : "Notion no configurada"}
            />
          </div>

          <div className={styles.canvas}>
            <section className={styles.hero}>
              <div>
                <p className={styles.eyebrow}>Resumen operativo</p>
                <h1 className={styles.title}>Preautorizacion quirurgica, en un flujo simple</h1>
                <p className={styles.copy}>
                  SurgiAuth toma el caso del hospital, cruza la poliza de la aseguradora y revisa los documentos para
                  responder si el caso puede preaprobarse o si falta soporte.
                </p>
              </div>
              <Link href="/cases/new" className={styles.primaryAction}>
                Crear caso
              </Link>
            </section>

            <section className={styles.stepsCard}>
              <h2 className={styles.sectionTitle}>Como funciona</h2>
              <div className={styles.stepsGrid}>
                <article className={styles.stepItem}>
                  <span className={styles.stepNumber}>1</span>
                  <div>
                    <h3 className={styles.stepTitle}>Registrar caso</h3>
                    <p className={styles.stepCopy}>El hospital crea el caso y selecciona la poliza vinculada.</p>
                  </div>
                </article>
                <article className={styles.stepItem}>
                  <span className={styles.stepNumber}>2</span>
                  <div>
                    <h3 className={styles.stepTitle}>Subir documentos</h3>
                    <p className={styles.stepCopy}>Se cargan los soportes reales para que el sistema los procese.</p>
                  </div>
                </article>
                <article className={styles.stepItem}>
                  <span className={styles.stepNumber}>3</span>
                  <div>
                    <h3 className={styles.stepTitle}>Evaluar decision</h3>
                    <p className={styles.stepCopy}>La app valida cobertura, carencia y faltantes del expediente.</p>
                  </div>
                </article>
              </div>
            </section>

            <section className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Casos recientes</h2>
                  <p className={styles.tableCopy}>Lo mas importante para seguir la cola y abrir cada expediente.</p>
                </div>
                <Link href="/cases" className={styles.secondaryAction}>
                  Ver casos
                </Link>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Caso</th>
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
                        <td className={styles.patientCell}>{item.case.patientName}</td>
                        <td>{item.case.requestedProcedure}</td>
                        <td>
                          <span className={getStatusClass(item.case.status, styles)}>{item.case.status}</span>
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
          </div>

          <div className={styles.fullWidthFooter}>
            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
