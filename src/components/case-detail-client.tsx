"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DecisionResult, ExtractionResult, Policy, SurgicalCase } from "@/types/domain";
import { resolveCaseStatus } from "@/lib/status";
import styles from "@/components/case-detail-client.module.css";

const defaultExtraction: ExtractionResult = {
  detectedProcedure: "",
  detectedDiagnosis: "",
  missingDocuments: [],
  confidence: 0,
};

const defaultDecision: DecisionResult = {
  status: "Revision manual",
  reason: "Caso pendiente de procesamiento.",
  missingDocuments: [],
  confidence: 0,
  evaluatedProcedure: "",
  checks: {
    policyFound: false,
    confidenceAccepted: false,
    waitingPeriodMet: false,
    covered: false,
    excluded: false,
    documentsComplete: false,
  },
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

export function CaseDetailClient({ initialCase, initialPolicy }: { initialCase: SurgicalCase; initialPolicy?: Policy }) {
  const router = useRouter();
  const [caseData, setCaseData] = useState(initialCase);
  const [policy, setPolicy] = useState<Policy | undefined>(initialPolicy);
  const [extraction, setExtraction] = useState<ExtractionResult>(defaultExtraction);
  const [decision, setDecision] = useState<DecisionResult>(defaultDecision);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  const finalStatus = useMemo(() => resolveCaseStatus(caseData.finalResult, caseData.status), [caseData]);

  async function runAnalysis() {
    setProcessing(true);
    setError(null);
    setUpdated(false);

    try {
      const response = await fetch("/api/process-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.caseId }),
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo procesar el caso.");
        return;
      }

      setPolicy(data.policy);
      setExtraction(data.extraction ?? defaultExtraction);
      setDecision(data.decision ?? defaultDecision);
      setCaseData((prev) => ({
        ...prev,
        finalResult: data.decision?.status ?? prev.finalResult,
        status: data.decision?.status ?? prev.status,
        decisionReason: data.decision?.reason ?? prev.decisionReason,
        missingDocumentsText: data.decision?.missingDocuments ?? prev.missingDocumentsText,
        extractionConfidence: data.decision?.confidence ?? prev.extractionConfidence,
        processedAt: new Date().toISOString(),
      }));
      setUpdated(true);
      router.refresh();
    } catch {
      setError("Error al consultar Notion o al procesar la IA.");
    } finally {
      setProcessing(false);
    }
  }

  const effectiveDecision = decision.status ? decision : defaultDecision;
  const hasProcessedResult = updated || Boolean(caseData.processedAt);
  const coverageStateClass = effectiveDecision.checks.covered ? styles.statusSuccess : hasProcessedResult ? styles.statusDanger : styles.statusWarn;
  const excludedStateClass = !effectiveDecision.checks.excluded ? styles.statusSuccess : hasProcessedResult ? styles.statusDanger : styles.statusWarn;
  const waitingStateClass = effectiveDecision.checks.waitingPeriodMet ? styles.statusSuccess : hasProcessedResult ? styles.statusDanger : styles.statusWarn;
  const docsStateClass = effectiveDecision.checks.documentsComplete ? styles.statusSuccess : hasProcessedResult ? styles.statusDanger : styles.statusWarn;

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

        <button className={styles.newButton} type="button">Nueva Solicitud</button>

        <nav className={styles.nav}>
          <Link className={styles.navItem} href="/"><span className="material-symbols-outlined">grid_view</span>Inicio</Link>
          <a className={`${styles.navItem} ${styles.navActive}`} href="#"><span className="material-symbols-outlined">verified</span>Autorizaciones</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">auto_awesome</span>Clinica IA</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">settings</span>Configuracion</a>
          <a className={styles.navItem} href="#"><span className="material-symbols-outlined">contact_support</span>Soporte</a>
        </nav>

        <div className={styles.sidebarFooter}>
          <a className={styles.logout} href="#"><span className="material-symbols-outlined">logout</span>Cerrar Sesion</a>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.crumb}>Dashboard / Casos / {caseData.caseId}</p>
            <div className={styles.identityRow}>
              <h2 className={styles.patientName}>{caseData.patientName}</h2>
              <p className={styles.inlineMeta}>ID: <strong>{caseData.caseId}</strong></p>
              <p className={styles.inlineMeta}>Documento: <strong>{caseData.documentId}</strong></p>
              <span className={styles.statusPill}>{finalStatus}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <Link className={styles.ghostBtn} href="/cases">Volver</Link>
            <button className={styles.ghostBtn} type="button">Exportar PDF</button>
            <button className={styles.primaryBtn} onClick={runAnalysis} disabled={processing} type="button">{processing ? "Analizando..." : "Analizar con IA"}</button>
          </div>
        </header>

        {error ? <p className={styles.error}>{error}</p> : null}
        {updated ? <p className={styles.ok}>Resultado actualizado correctamente.</p> : null}

        <div className={styles.layout}>
          <section className={styles.leftColumn}>
            <article className={styles.card}>
              <div className={styles.cardHeadRow}>
                <div>
                  <h3 className={styles.cardTitle}>Resultado Final</h3>
                  <p className={styles.cardSub}>Estado actual de la solicitud tras el procesamiento.</p>
                </div>
                <div className={styles.confBlock}><span>--</span><small>Confianza IA</small></div>
              </div>
              <div className={styles.resultGrid}>
                <div><p>Motivo</p><strong>{effectiveDecision.reason || "Pendiente de ejecucion"}</strong></div>
                <div><p>Fecha procesamiento</p><strong>{caseData.processedAt || "-- / -- / ----"}</strong></div>
                <div className={styles.resultState}><span className="material-symbols-outlined">pending</span><strong>{finalStatus}</strong></div>
              </div>
            </article>

            <section>
              <h3 className={styles.sectionTitle}>Validacion de Preautorizacion</h3>
              <div className={styles.quadGrid}>
                <article className={`${styles.cardMini} ${styles.miniAi}`}>
                  <h4>Analisis IA</h4>
                  <p>Procedimiento <strong>{extraction.detectedProcedure || "--"}</strong></p>
                  <p>Diagnostico <strong>{extraction.detectedDiagnosis || "--"}</strong></p>
                  <p>Nivel Confianza <strong className={hasProcessedResult ? styles.statusSuccess : styles.statusWarn}>{effectiveDecision.confidence || "--"}</strong></p>
                </article>
                <article className={`${styles.cardMini} ${styles.miniCoverage}`}>
                  <h4>Cobertura y Exclusiones</h4>
                  <p>Procedimiento solicitado <strong>{caseData.requestedProcedure || "--"}</strong></p>
                  <p>¿Cubierto? <strong className={coverageStateClass}>{effectiveDecision.checks.covered ? "Si" : hasProcessedResult ? "No" : "--"}</strong></p>
                  <p>¿Excluido? <strong className={excludedStateClass}>{effectiveDecision.checks.excluded ? "Si" : hasProcessedResult ? "No" : "--"}</strong></p>
                </article>
                <article className={`${styles.cardMini} ${styles.miniWaiting}`}>
                  <h4>Periodo de Carencia</h4>
                  <p>Dias transcurridos <strong>--</strong></p>
                  <p>Dias requeridos <strong>{policy?.waitingPeriodDays ?? "--"}</strong></p>
                  <p>¿Cumple? <strong className={waitingStateClass}>{effectiveDecision.checks.waitingPeriodMet ? "Si" : hasProcessedResult ? "No" : "--"}</strong></p>
                </article>
                <article className={`${styles.cardMini} ${styles.miniDocs}`}>
                  <h4>Documentacion</h4>
                  <p>Requeridos / Presentados <strong>{policy?.requiredDocuments?.length ?? 0} / {caseData.submittedDocuments.length}</strong></p>
                  <p>Faltantes <strong className={effectiveDecision.missingDocuments.length > 0 ? styles.statusDanger : styles.statusSuccess}>{effectiveDecision.missingDocuments.length}</strong></p>
                  <p>¿Completos? <strong className={docsStateClass}>{effectiveDecision.checks.documentsComplete ? "Si" : hasProcessedResult ? "No" : "--"}</strong></p>
                </article>
              </div>
            </section>

            <section className={styles.doubleGrid}>
              <article className={`${styles.card} ${styles.cardInfo}`}><h4 className={styles.smallTitle}>Informacion Clinica</h4><p><strong>Diagnostico Principal</strong></p><p>{caseData.diagnosis}</p><p><strong>Procedimiento</strong></p><p>{caseData.requestedProcedure}</p><div className={styles.tags}>{caseData.submittedDocuments.map((d) => <span key={d} className={styles.tag}>{d}</span>)}</div></article>
              <article className={styles.card}><h4 className={styles.smallTitle}>Informe Medico</h4><p className={styles.report}>{caseData.medicalReport || "Sin informe disponible"}</p></article>
            </section>

            <article className={`${styles.card} ${styles.cardInfo}`}>
              <h4 className={styles.smallTitle}>Proceso del Agente Inteligente</h4>
              <div className={styles.timeline}>
                {[
                  "Lectura de informe",
                  "Extraccion de codigos CIE-10",
                  "Mapeo de procedimiento CPT",
                  "Consulta de poliza",
                  "Verificacion de carencia",
                  "Analisis de exclusiones",
                  "Cotejo documental",
                  "Calculo de confianza",
                  "Generacion de resolucion",
                ].map((step, i) => (
                  <div key={step} className={styles.step}><span>{i + 1}</span><div><p>{step}</p><small>{processing ? "En curso" : "Pendiente"}</small></div></div>
                ))}
              </div>
            </article>
          </section>

          <aside className={styles.rightColumn}>
            <article className={`${styles.card} ${styles.cardPolicy} ${processing ? styles.analyzingCard : ""}`}>
              <div className={styles.patientSummary}>
                <div className={styles.avatar}>{getInitials(caseData.patientName)}</div>
                <div>
                  <h4>{caseData.patientName}</h4>
                  <p>45 años • Femenino</p>
                  {processing ? <span className={styles.analyzingBadge}><span className={styles.dotPulse} />Analizando perfil</span> : null}
                </div>
              </div>
              <div className={styles.keyRows}>
                <div><span>Afiliado desde</span><strong>{policy?.policyStartDate ?? "--"}</strong></div>
                <div><span>Nivel de riesgo</span><strong>Bajo</strong></div>
                <div><span>Ultimo contacto</span><strong>Hace 2 dias</strong></div>
              </div>
            </article>

            <article className={`${styles.card} ${processing ? styles.analyzingCard : ""}`}>
              <div className={styles.policyTitleRow}>
                <h4 className={styles.smallTitle}>Poliza Activa</h4>
                <span className={styles.policyId}>{policy?.policyId ?? caseData.policyId}</span>
              </div>
              <div className={styles.policyPlanBox}>
                <p className={styles.policyEyebrow}>Aseguradora &amp; Plan</p>
                <p className={styles.policyMain}>
                  <strong>{policy?.insurerName ?? "--"}</strong> <span>/ {policy?.plan ?? "--"}</span>
                </p>
                <p className={styles.policySub}>Integral</p>
              </div>
              <div className={styles.carenciaBlock}>
                <p className={styles.policyEyebrow}>Dias de carencia requeridos</p>
                <div className={styles.carenciaValue}>
                  <strong>{policy?.waitingPeriodDays ?? "--"}</strong>
                  <span>dias para cirugias</span>
                </div>
              </div>
              {processing ? <span className={styles.analyzingBadge}><span className={styles.dotPulse} />Analizando cobertura</span> : null}
              <p><strong>Reglas especiales:</strong> {policy?.specialRules || "Sin reglas especiales"}</p>
              <p><strong>Aseguradora:</strong> {policy?.insurerName ?? "--"}</p>
              <p className={styles.smallTitle} style={{ marginTop: 10 }}>Procedimientos cubiertos</p>
              <div className={styles.tags}>{policy?.coveredProcedures?.map((p) => <span key={p} className={styles.tag}>{p}</span>)}</div>
              <p className={styles.smallTitle} style={{ marginTop: 10 }}>Exclusiones</p>
              <div className={styles.tags}>{policy?.exclusions?.map((p) => <span key={p} className={`${styles.tag} ${styles.tagWarn}`}>{p}</span>)}</div>
            </article>

            <article className={`${styles.card} ${styles.cardCheck} ${processing ? styles.analyzingCard : ""}`}>
              <h4 className={styles.smallTitle}>Validaciones Rapidas</h4>
              {processing ? <span className={styles.analyzingBadge}><span className={styles.dotPulse} />Ejecutando chequeos</span> : null}
              <ul className={styles.quickList}>
                <li><span>Procedimiento cubierto</span><strong className={effectiveDecision.checks.covered ? styles.okState : hasProcessedResult ? styles.badState : styles.pendingState}>{effectiveDecision.checks.covered ? "OK" : hasProcessedResult ? "No cumple" : "Pendiente"}</strong></li>
                <li><span>Periodo de carencia OK</span><strong className={effectiveDecision.checks.waitingPeriodMet ? styles.okState : hasProcessedResult ? styles.badState : styles.pendingState}>{effectiveDecision.checks.waitingPeriodMet ? "OK" : hasProcessedResult ? "No cumple" : "Pendiente"}</strong></li>
                <li><span>Documentos completos</span><strong className={effectiveDecision.checks.documentsComplete ? styles.okState : hasProcessedResult ? styles.badState : styles.pendingState}>{effectiveDecision.checks.documentsComplete ? "OK" : hasProcessedResult ? "Incompleto" : "Pendiente"}</strong></li>
                <li><span>Sin pre-existencias excl.</span><strong className={!effectiveDecision.checks.excluded ? styles.okState : hasProcessedResult ? styles.badState : styles.pendingState}>{!effectiveDecision.checks.excluded ? "OK" : hasProcessedResult ? "Excluido" : "Pendiente"}</strong></li>
              </ul>
            </article>
          </aside>
        </div>
      </main>
    </div>
  );
}

