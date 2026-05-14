import Link from "next/link";
import { notFound } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardStatusPill } from "@/components/dashboard-status-pill";
import { ProcessCaseButton } from "@/features/cases/components/process-case-button";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { evaluateSurgicalCase } from "@/lib/case-evaluation";
import { findCaseById, getDataSourceMode } from "@/lib/case-service";
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

const checkLabels = {
  policyFound: "Poliza encontrada",
  confidenceAccepted: "Lectura suficiente para decidir",
  waitingPeriodMet: "Carencia cumplida",
  covered: "Cobertura valida",
  excluded: "Sin exclusion aplicable",
  documentsComplete: "Documentacion completa",
} as const;

function isCheckPassing(key: keyof typeof checkLabels, value: boolean) {
  if (key === "excluded") {
    return !value;
  }

  return value;
}

function getCheckCopy(key: keyof typeof checkLabels, value: boolean) {
  if (key === "excluded") {
    return value ? "Hay exclusion aplicable" : "Cumplido";
  }

  return value ? "Cumplido" : "Requiere atencion";
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { caseId } = await params;
  const surgicalCase = await findCaseById(caseId);

  if (!surgicalCase) {
    notFound();
  }

  const evaluation = await evaluateSurgicalCase(surgicalCase);
  const { case: caseData, policy, extraction, documents, decision } = evaluation;

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
              searchPlaceholder={`Explorar caso ${caseData.caseId}...`}
              searchTargetPath="/cases"
              systemStatusLabel="Caso actual:"
              systemStatusValue={caseData.isUrgent ? "Urgente" : getDataSourceMode() === "notion" ? "Notion activa" : "No configurado"}
            />
          </div>

          <div className={styles.canvas}>
            <section className={styles.hero}>
              <div className={styles.heroIdentity}>
                <div className={styles.avatar}>{getInitials(caseData.patientName)}</div>
                <div>
                  <p className={styles.caseLabel}>Caso {caseData.caseId}</p>
                  <h1 className={styles.patientName}>{caseData.patientName}</h1>
                  <p className={styles.metaCopy}>
                    {caseData.insurerName} · Poliza {caseData.policyId} · Solicitud {caseData.requestDate}
                  </p>
                </div>
              </div>

              <div className={styles.heroActions}>
                <DashboardStatusPill status={decision.status} className={styles.statusPill} />
                <div className={styles.actionsRow}>
                  <Link href="/cases" className={styles.secondaryAction}>
                    Volver a casos
                  </Link>
                  <Link href={`/documents/new?caseId=${encodeURIComponent(caseData.caseId)}`} className={styles.secondaryAction}>
                    Subir documento
                  </Link>
                  <ProcessCaseButton caseId={caseData.caseId} />
                </div>
              </div>
            </section>

            <section className={styles.layout}>
              <article className={styles.card}>
                <h2 className={styles.cardTitle}>Resumen del caso</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Diagnostico</span>
                    <p className={styles.infoValue}>{caseData.diagnosis}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Procedimiento</span>
                    <p className={styles.infoValue}>{caseData.requestedProcedure}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Inicio de poliza</span>
                    <p className={styles.infoValue}>{caseData.policyStartDate}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Prioridad</span>
                    <p className={styles.infoValue}>{caseData.isUrgent ? "Alta" : "Regular"}</p>
                  </div>
                </div>
              </article>

              <article className={styles.card}>
                <h2 className={styles.cardTitle}>Reglas de la poliza</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Carencia</span>
                    <p className={styles.infoValue}>{policy ? `${policy.waitingPeriodDays} dias` : "No disponible"}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Cobertura</span>
                    <p className={styles.infoValue}>
                      {policy?.coveredProcedures.length ? policy.coveredProcedures.join(", ") : "No disponible"}
                    </p>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Exclusiones</span>
                    <p className={styles.infoValue}>{policy?.exclusions.length ? policy.exclusions.join(", ") : "No disponible"}</p>
                  </div>
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <h2 className={styles.cardTitle}>Documentos del expediente</h2>
                  <Link href={`/documents/new?caseId=${encodeURIComponent(caseData.caseId)}`} className={styles.inlineAction}>
                    Agregar documento
                  </Link>
                </div>
                {documents.length > 0 ? (
                  <div className={styles.documentList}>
                    {documents.map((document) => (
                      <div key={document.documentId} className={styles.documentItem}>
                        <div>
                          <p className={styles.documentTitle}>{document.documentType}</p>
                          <p className={styles.documentMeta}>{document.documentStatus}</p>
                        </div>
                        <div className={styles.documentLinks}>
                          {document.fileUrl ? (
                            <a href={document.fileUrl} target="_blank" rel="noreferrer" className={styles.inlineAction}>
                              Ver archivo
                            </a>
                          ) : null}
                          <Link href={`/documents/${document.documentId}/edit`} className={styles.inlineAction}>
                            Editar
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyCopy}>No hay documentos asociados a este caso todavia.</p>
                )}
              </article>

              <article className={styles.card}>
                <h2 className={styles.cardTitle}>Resultado actual</h2>
                <div className={styles.resultTop}>
                  <DashboardStatusPill status={decision.status} className={styles.resultPill} />
                  <p className={styles.resultReason}>{decision.reason}</p>
                </div>

                {decision.missingDocuments.length > 0 ? (
                  <div className={styles.missingBlock}>
                    <span className={styles.infoLabel}>Documentos que faltan</span>
                    <div className={styles.tagList}>
                      {decision.missingDocuments.map((item) => (
                        <span key={item} className={styles.tag}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className={styles.checksGrid}>
                  {Object.entries(decision.checks).map(([key, value]) => {
                    const typedKey = key as keyof typeof checkLabels;
                    const passing = isCheckPassing(typedKey, value);

                    return (
                      <div key={key} className={styles.checkRow}>
                        <span className={styles.checkLabel}>{checkLabels[typedKey]}</span>
                        <span className={passing ? styles.checkOk : styles.checkWarn}>{getCheckCopy(typedKey, value)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.readingBlock}>
                  <span className={styles.infoLabel}>Lectura del sistema</span>
                  <p className={styles.readingCopy}>
                    Procedimiento detectado: {extraction.detectedProcedure}. Diagnostico detectado: {extraction.detectedDiagnosis}.
                  </p>
                </div>
              </article>
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
