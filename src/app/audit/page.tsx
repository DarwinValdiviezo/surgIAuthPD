import Link from "next/link";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { listCases, listDocuments } from "@/lib/case-service";
import styles from "./audit.module.css";

export default async function AuditPage() {
  const [cases, documents] = await Promise.all([listCases(), listDocuments()]);
  const evaluations = await Promise.all(cases.map((item) => evaluateSurgicalCase(item, { preferAI: true })));

  const geminiCount = evaluations.filter((item) => item.extraction.source === "gemini").length;
  const manualCount = evaluations.filter((item) => item.decision.status === "Revision manual").length;
  const missingDocsCount = evaluations.filter((item) => item.decision.missingDocuments.length > 0).length;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="auditoria"
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
              searchPlaceholder="Buscar evento por caso o resultado..."
              searchTargetPath="/audit"
              systemStatusLabel="Vista:"
              systemStatusValue="Snapshot operativo"
            />

            <section className={styles.headerBlock}>
              <div>
                <h2 className={styles.title}>Auditoria operativa</h2>
                <p className={styles.subtitle}>
                  Trazabilidad actual del procesamiento por caso, fuentes de lectura y decision resultante.
                </p>
              </div>
            </section>

            <section className={styles.metrics}>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Casos evaluados</span>
                <strong className={styles.metricValue}>{evaluations.length}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Lecturas con Gemini</span>
                <strong className={styles.metricValue}>{geminiCount}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Revision manual</span>
                <strong className={styles.metricValue}>{manualCount}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Casos con faltantes</span>
                <strong className={styles.metricValue}>{missingDocsCount}</strong>
              </article>
            </section>

            <section className={styles.tableCard}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Caso</th>
                      <th>Fuente</th>
                      <th>Decision</th>
                      <th>Documentos</th>
                      <th>Observacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.map((item, index) => (
                      <tr key={item.case.caseId} className={index % 2 === 1 ? styles.altRow : undefined}>
                        <td>{item.case.requestDate}</td>
                        <td>
                          <Link href={`/cases/${item.case.caseId}`} className={styles.caseLink}>
                            {item.case.caseId}
                          </Link>
                        </td>
                        <td>{item.extraction.source === "gemini" ? "Gemini" : "Mock"}</td>
                        <td>
                          <span className={styles.status}>{item.decision.status}</span>
                        </td>
                        <td>{item.documents.length}</td>
                        <td className={styles.reason}>{item.decision.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.bottomGrid}>
              <article className={styles.noteCard}>
                <span className={styles.noteLabel}>Alcance actual</span>
                <p className={styles.noteText}>
                  Esta vista refleja el estado actual del sistema y no un historial persistente de eventos pasados.
                </p>
              </article>
              <article className={styles.noteCard}>
                <span className={styles.noteLabel}>Documentos vinculados</span>
                <p className={styles.noteText}>
                  Hay {documents.length} soportes visibles en la base documental utilizados para enriquecer el analisis.
                </p>
              </article>
              <article className={styles.featureCard}>
                <h4>Lectura transversal</h4>
                <p>
                  Util para demostrar trazabilidad entre solicitud, fuente de extraccion y resultado operativo del agente.
                </p>
              </article>
            </section>

            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
