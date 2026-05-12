import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardStatusPill } from "@/components/dashboard-status-pill";
import { DecisionPanel } from "@/components/decision-panel";
import { ProcessCaseButton } from "@/components/process-case-button";
import { findCaseById } from "@/lib/case-service";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import styles from "./detail.module.css";

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getDocumentStateClass(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "procesado" || normalized === "disponible") {
    return styles.documentReady;
  }

  if (normalized === "pendiente") {
    return styles.documentPending;
  }

  return styles.documentAlert;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    notFound();
  }

  const evaluation = await evaluateSurgicalCase(surgicalCase, { preferAI: true });
  const { case: caseData, policy, extraction, documents, decision } = evaluation;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>SA</span>
              <span className={styles.brandText}>SurgiAuth</span>
            </Link>
            <Link href="/cases" className={styles.backLink}>
              Volver a casos
            </Link>
          </div>
          <div className={styles.topbarActions}>
            <a href="/api/notion/health" className={styles.topbarLinkSecondary}>
              Estado del sistema
            </a>
            <Link href="/cases" className={styles.topbarLink}>
              Cola de casos
            </Link>
          </div>
        </header>

        <main className={styles.content}>
          <section className={styles.hero}>
            <div className={styles.heroIdentity}>
              <div className={styles.avatar}>{getInitials(caseData.patientName)}</div>
              <div>
                <p className={styles.caseLabel}>Caso {caseData.caseId}</p>
                <h1 className={styles.patientName}>{caseData.patientName}</h1>
                <div className={styles.heroMeta}>
                  <span>{caseData.insurerName}</span>
                  <span>Poliza {caseData.policyId}</span>
                  <span>Solicitud {caseData.requestDate}</span>
                  <span>{caseData.isUrgent ? "Urgente" : "Programada"}</span>
                </div>
              </div>
            </div>
            <div className={styles.heroActions}>
              <DashboardStatusPill status={decision.status} className={styles.statusPill} />
              <ProcessCaseButton caseId={caseData.caseId} />
            </div>
          </section>

          <section className={styles.layout}>
            <div className={styles.mainColumn}>
              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardEyebrow}>Solicitud</p>
                    <h2 className={styles.cardTitle}>Resumen clinico y administrativo</h2>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Diagnostico</span>
                      <p className={styles.itemValue}>{caseData.diagnosis}</p>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Procedimiento solicitado</span>
                      <p className={styles.itemValue}>{caseData.requestedProcedure}</p>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Inicio de poliza</span>
                      <p className={styles.itemValue}>{caseData.policyStartDate}</p>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Documentos declarados en el caso</span>
                      <p className={styles.itemValue}>
                        {caseData.submittedDocuments.length > 0
                          ? caseData.submittedDocuments.join(", ")
                          : "No se registraron documentos declarados"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardEyebrow}>Poliza</p>
                    <h2 className={styles.cardTitle}>Cobertura y reglas aplicadas</h2>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Aseguradora</span>
                      <p className={styles.itemValue}>{policy?.insurerName ?? "No encontrada"}</p>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Dias de carencia</span>
                      <p className={styles.itemValue}>
                        {policy ? `${policy.waitingPeriodDays} dias` : "No disponible"}
                      </p>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Coberturas registradas</span>
                      <p className={styles.itemValue}>
                        {policy?.coveredProcedures.length ? policy.coveredProcedures.join(", ") : "No disponible"}
                      </p>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.itemLabel}>Exclusiones registradas</span>
                      <p className={styles.itemValue}>
                        {policy?.exclusions.length ? policy.exclusions.join(", ") : "No disponible"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardEyebrow}>Documentos</p>
                    <h2 className={styles.cardTitle}>Soporte disponible para el analisis</h2>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.documentsList}>
                    {documents.length > 0 ? (
                      documents.map((document) => (
                        <div key={document.documentId} className={styles.documentItem}>
                          <div className={styles.documentTop}>
                            <div>
                              <p className={styles.documentName}>{document.documentType}</p>
                              <p className={styles.documentMeta}>
                                {document.documentId} · {document.caseId}
                              </p>
                            </div>
                            <span className={`${styles.documentBadge} ${getDocumentStateClass(document.documentStatus)}`}>
                              {document.documentStatus}
                            </span>
                          </div>
                          <p className={styles.documentExcerpt}>{document.extractedText}</p>
                        </div>
                      ))
                    ) : (
                      <p className={styles.emptyCopy}>No hay documentos asociados a este caso.</p>
                    )}
                  </div>
                </div>
              </article>
            </div>

            <aside className={styles.sideColumn}>
              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardEyebrow}>Analisis IA</p>
                    <h2 className={styles.cardTitle}>Lectura del agente</h2>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.aiSource}>
                    <span className={styles.aiConfidence}>{Math.round(extraction.confidence * 100)}%</span>
                    <div>
                      <p className={styles.aiTitle}>
                        {extraction.source === "gemini" ? "Gemini 2.5 Flash" : "Fallback mock"}
                      </p>
                      <p className={styles.aiCopy}>Fuente usada para interpretar procedimiento y diagnostico.</p>
                    </div>
                  </div>

                  <div className={styles.aiFacts}>
                    <div className={styles.aiFact}>
                      <span className={styles.itemLabel}>Procedimiento detectado</span>
                      <p className={styles.itemValue}>{extraction.detectedProcedure}</p>
                    </div>
                    <div className={styles.aiFact}>
                      <span className={styles.itemLabel}>Diagnostico detectado</span>
                      <p className={styles.itemValue}>{extraction.detectedDiagnosis}</p>
                    </div>
                    <div className={styles.aiFact}>
                      <span className={styles.itemLabel}>Faltantes inferidos por IA</span>
                      <p className={styles.itemValue}>
                        {extraction.missingDocuments.length > 0
                          ? extraction.missingDocuments.join(", ")
                          : "No se detectaron faltantes desde la extraccion"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardEyebrow}>Decision</p>
                    <h2 className={styles.cardTitle}>Resultado y trazabilidad</h2>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <DecisionPanel evaluation={evaluation} />
                </div>
              </article>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
