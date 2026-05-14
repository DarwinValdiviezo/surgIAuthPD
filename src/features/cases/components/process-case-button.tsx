"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./process-case-button.module.css";

type ProcessCaseButtonProps = {
  caseId: string;
  compact?: boolean;
  hideMessage?: boolean;
};

type ProcessResponse = {
  case: {
    caseId: string;
  };
  decision: {
    status: string;
    reason: string;
    missingDocuments: string[];
    checks: Record<string, boolean>;
  };
};

const checkLabels: Record<string, string> = {
  policyFound: "Poliza encontrada",
  confidenceAccepted: "Lectura suficiente para decidir",
  waitingPeriodMet: "Carencia cumplida",
  covered: "Cobertura valida",
  excluded: "Sin exclusion aplicable",
  documentsComplete: "Documentacion completa",
};

function isCheckPassing(key: string, value: boolean) {
  if (key === "excluded") {
    return !value;
  }

  return value;
}

function getCheckCopy(key: string, value: boolean) {
  if (key === "excluded") {
    return value ? "Hay exclusion aplicable" : "Cumplido";
  }

  return value ? "Cumplido" : "Requiere atencion";
}

const baseSteps = [
  "Buscando el caso y la poliza",
  "Revisando documentos del expediente",
  "Validando cobertura y carencia",
  "Preparando la decision final",
];

export function ProcessCaseButton({ caseId, compact = false, hideMessage = false }: ProcessCaseButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current < baseSteps.length - 1 ? current + 1 : current));
    }, 700);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const nextActionCopy = useMemo(() => {
    if (!result) {
      return "";
    }

    const status = result.decision.status;

    if (status === "Preaprobado") {
      return "El caso ya puede continuar sin pedir soporte adicional.";
    }

    if (status === "Pendiente por documentos") {
      return "Sube los documentos faltantes y vuelve a procesar el caso para intentar la preaprobacion.";
    }

    if (status === "Revision manual") {
      return "Este caso necesita revision humana porque una regla clave no permitio decidir automaticamente.";
    }

    return "El caso no puede continuar automatico con la configuracion actual y requiere validacion administrativa.";
  }, [result]);

  async function handleClick() {
    setIsOpen(true);
    setIsLoading(true);
    setMessage(null);
    setError(null);
    setResult(null);
    setActiveStep(0);

    try {
      const response = await fetch("/api/process-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ caseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo procesar el caso.");
        setMessage(data.error ?? "No se pudo procesar el caso.");
        return;
      }

      setResult(data);
      setMessage(`Caso procesado: ${data.decision.status}`);
      router.refresh();
    } catch {
      setError("Ocurrio un error al procesar el caso.");
      setMessage("Ocurrio un error al procesar el caso.");
    } finally {
      setActiveStep(baseSteps.length - 1);
      setIsLoading(false);
    }
  }

  function closeModal() {
    if (isLoading) {
      return;
    }

    setIsOpen(false);
  }

  const isApproved = result?.decision.status === "Preaprobado";

  return (
    <>
      <div className={styles.wrap}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className={compact ? styles.buttonCompact : styles.buttonDefault}
        >
          {isLoading ? "Procesando..." : "Procesar caso"}
        </button>
        {!hideMessage && message ? <p className={styles.message}>{message}</p> : null}
      </div>

      {isOpen ? (
        <div className={styles.overlay} role="presentation" onClick={closeModal}>
          <div className={styles.dialog} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.header}>
              <div>
                <h3 className={styles.title}>Procesando caso</h3>
                <p className={styles.subtitle}>Te mostramos en que paso va el analisis y por que sale cada decision.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeModal} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className={styles.body}>
              <section className={styles.progressCard}>
                <div className={styles.progressList}>
                  {baseSteps.map((step, index) => {
                    const stepClass =
                      index < activeStep || (!!result && !isLoading)
                        ? styles.stepDotDone
                        : index === activeStep && isLoading
                          ? styles.stepDotActive
                          : styles.stepDot;

                    return (
                      <div key={step} className={styles.progressItem}>
                        <span className={stepClass}>{index < activeStep || (!!result && !isLoading) ? "OK" : index + 1}</span>
                        <div>
                          <p className={styles.stepTitle}>{step}</p>
                          <p className={styles.stepCopy}>
                            {index === 0 && "Ubicamos el caso, la poliza y el contexto base del expediente."}
                            {index === 1 && "Miramos lo que ya tiene el expediente y lo que sigue faltando."}
                            {index === 2 && "Comparamos cobertura, exclusiones y carencia contra la poliza real."}
                            {index === 3 && "Consolidamos una respuesta que te diga que hacer despues."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {error ? (
                <section className={styles.resultCard}>
                  <div className={styles.resultTop}>
                    <div className={styles.resultIconWarn}>!</div>
                    <div>
                      <h4 className={styles.resultTitle}>No se pudo completar el proceso</h4>
                      <p className={styles.resultReason}>{error}</p>
                    </div>
                  </div>
                </section>
              ) : null}

              {result ? (
                <>
                  <section className={styles.resultCard}>
                    <div className={styles.resultTop}>
                      <div className={isApproved ? styles.resultIcon : styles.resultIconWarn}>{isApproved ? "✓" : "!"}</div>
                      <div>
                        <h4 className={styles.resultTitle}>{result.decision.status}</h4>
                        <p className={styles.resultReason}>{result.decision.reason}</p>
                      </div>
                    </div>

                    {result.decision.missingDocuments.length > 0 ? (
                      <div>
                        <p className={styles.stepTitle}>Documentos que debes subir</p>
                        <div className={styles.tagList}>
                          {result.decision.missingDocuments.map((item) => (
                            <span key={item} className={styles.tag}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className={styles.checksGrid}>
                      {Object.entries(result.decision.checks).map(([key, value]) => {
                        const passing = isCheckPassing(key, value);

                        return (
                          <div key={key} className={styles.checkRow}>
                            <span className={styles.checkLabel}>{checkLabels[key] ?? key}</span>
                            <span className={passing ? styles.checkValueOk : styles.checkValueWarn}>
                              {getCheckCopy(key, value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className={styles.nextCard}>
                    <h4 className={styles.nextTitle}>Que sigue</h4>
                    <p className={styles.nextCopy}>{nextActionCopy}</p>
                  </section>
                </>
              ) : null}
            </div>

            <div className={styles.footer}>
              {result?.decision.missingDocuments.length ? (
                <a href={`/documents/new?caseId=${encodeURIComponent(caseId)}`} className={styles.linkButton}>
                  Subir documentos
                </a>
              ) : null}
              <a href={`/cases/${encodeURIComponent(caseId)}`} className={styles.linkButton}>
                Ver detalle del caso
              </a>
              {!isLoading ? (
                <button type="button" className={styles.primaryLink} onClick={closeModal}>
                  Cerrar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
