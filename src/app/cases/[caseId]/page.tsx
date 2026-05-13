import Link from "next/link";
import { notFound } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardStatusPill } from "@/components/dashboard-status-pill";
import { ProcessCaseButton } from "@/components/process-case-button";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { findCaseById } from "@/lib/case-service";
import styles from "./detail.module.css";

type CaseDetailPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getDocumentStateClass(status: string, classes: Record<string, string>) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "procesado" || normalized === "disponible") {
    return classes.documentReady;
  }

  if (normalized === "pendiente") {
    return classes.documentPending;
  }

  return classes.documentAlert;
}

function getCheckClass(value: boolean, classes: Record<string, string>) {
  return value ? classes.checkOk : classes.checkPending;
}

const checkLabels = {
  policyFound: "Poliza encontrada",
  confidenceAccepted: "Confianza aceptada",
  waitingPeriodMet: "Carencia cumplida",
  covered: "Cobertura valida",
  excluded: "Sin exclusion aplicable",
  documentsComplete: "Documentacion completa",
} as const;

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    notFound();
  }

  const evaluation = await evaluateSurgicalCase(surgicalCase, { preferAI: true });
  const { case: caseData, policy, extraction, documents, decision } = evaluation;
  const confidence = Math.round(extraction.confidence * 100);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="casos"
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
              searchPlaceholder={`Explorar caso ${caseData.caseId}...`}
              searchTargetPath="/cases"
              systemStatusLabel="Caso actual:"
              systemStatusValue={caseData.isUrgent ? "Urgente" : "Programado"}
            />

            <section className={styles.hero}>
              <div className={styles.heroLeft}>
                <Link href="/cases" className={styles.backLink}>
                  Volver a casos
                </Link>
                <div className={styles.identity}>
                  <div className={styles.avatar}>{getInitials(caseData.patientName)}</div>
                  <div>
                    <p className={styles.caseLabel}>Caso {caseData.caseId}</p>
                    <h1 className={styles.patientName}>{caseData.patientName}</h1>
                    <div className={styles.metaRow}>
                      <span>{caseData.insurerName}</span>
                      <span>Poliza {caseData.policyId}</span>
                      <span>Solicitud {caseData.requestDate}</span>
                      <span>{caseData.isUrgent ? "Prioridad alta" : "Flujo regular"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.heroRight}>
                <DashboardStatusPill status={decision.status} className={styles.statusPill} />
                <div className={styles.processWrap}>
                  <ProcessCaseButton caseId={caseData.caseId} />
                </div>
              </div>
            </section>

            <section className={styles.layout}>
              <div className={styles.primaryColumn}>
                <article className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.eyebrow}>Resumen</p>
                      <h2 className={styles.cardTitle}>Solicitud clinica y administrativa</h2>
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
                        <span className={styles.itemLabel}>Documentos declarados</span>
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
                      <p className={styles.eyebrow}>Poliza</p>
                      <h2 className={styles.cardTitle}>Cobertura, carencia y exclusiones</h2>
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
                        <p className={styles.itemValue}>{policy ? `${policy.waitingPeriodDays} dias` : "No disponible"}</p>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.itemLabel}>Coberturas</span>
                        <p className={styles.itemValue}>
                          {policy?.coveredProcedures.length ? policy.coveredProcedures.join(", ") : "No disponible"}
                        </p>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.itemLabel}>Exclusiones</span>
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
                      <p className={styles.eyebrow}>Documentos</p>
                      <h2 className={styles.cardTitle}>Expediente asociado al caso</h2>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    {documents.length > 0 ? (
                      <div className={styles.documentsList}>
                        {documents.map((document) => (
                          <article key={document.documentId} className={styles.documentItem}>
                            <div className={styles.documentTop}>
                              <div>
                                <p className={styles.documentName}>{document.documentType}</p>
                                <p className={styles.documentMeta}>
                                  {document.documentId} - {document.caseId}
                                </p>
                              </div>
                              <span className={getDocumentStateClass(document.documentStatus, styles)}>
                                {document.documentStatus}
                              </span>
                            </div>
                            <p className={styles.documentText}>
                              {document.extractedText || "Documento sin texto extraido disponible."}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.emptyCopy}>No hay documentos asociados a este caso.</p>
                    )}
                  </div>
                </article>
              </div>

              <aside className={styles.sideColumn}>
                <article className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.eyebrow}>Analisis IA</p>
                      <h2 className={styles.cardTitle}>Lectura del agente</h2>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.aiHeader}>
                      <div className={styles.aiConfidence}>{confidence}%</div>
                      <div>
                        <p className={styles.aiTitle}>{extraction.source === "gemini" ? "Gemini 2.5 Flash" : "Fallback mock"}</p>
                        <p className={styles.aiCopy}>Fuente usada para interpretar diagnostico, procedimiento y faltantes.</p>
                      </div>
                    </div>

                    <div className={styles.aiFacts}>
                      <div className={styles.summaryItem}>
                        <span className={styles.itemLabel}>Procedimiento detectado</span>
                        <p className={styles.itemValue}>{extraction.detectedProcedure}</p>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.itemLabel}>Diagnostico detectado</span>
                        <p className={styles.itemValue}>{extraction.detectedDiagnosis}</p>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.itemLabel}>Faltantes inferidos</span>
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
                      <p className={styles.eyebrow}>Decision</p>
                      <h2 className={styles.cardTitle}>Resultado del caso</h2>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.decisionBlock}>
                      <DashboardStatusPill status={decision.status} className={styles.decisionPill} />
                      <p className={styles.decisionReason}>{decision.reason}</p>
                    </div>

                    {decision.missingDocuments.length > 0 ? (
                      <div className={styles.missingBlock}>
                        <span className={styles.itemLabel}>Documentos faltantes</span>
                        <div className={styles.tagList}>
                          {decision.missingDocuments.map((item) => (
                            <span key={item} className={styles.missingTag}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className={styles.checksGrid}>
                      {Object.entries(decision.checks).map(([key, value]) => (
                        <article key={key} className={getCheckClass(value, styles)}>
                          <p className={styles.checkTitle}>{checkLabels[key as keyof typeof checkLabels]}</p>
                          <p className={styles.checkValue}>{value ? "Cumplido" : "Pendiente"}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </article>
              </aside>
            </section>

            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
