"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import styles from "@/components/entity-form.module.css";
import { normalizeMedicalText } from "@/lib/medical-taxonomy";
import { Policy } from "@/types/domain";

type CaseCreateFormProps = {
  policies: Policy[];
};

const diagnosisSuggestionsByProcedure: Array<{ procedure: string; diagnosis: string }> = [
  { procedure: "Hernioplastia inguinal con malla", diagnosis: "Hernia inguinal derecha complicada" },
  { procedure: "Colecistectomia laparoscopica", diagnosis: "Colelitiasis sintomatica" },
  { procedure: "Apendicectomia laparoscopica", diagnosis: "Apendicitis aguda" },
  { procedure: "Cirugia laparoscopica digestiva", diagnosis: "Colelitiasis sintomatica" },
  { procedure: "Cirugia laparoscopica digestiva", diagnosis: "Apendicitis aguda" },
  { procedure: "Cirugia general", diagnosis: "Hernia inguinal derecha complicada" },
  { procedure: "Cirugia general", diagnosis: "Colelitiasis sintomatica" },
];

const diagnosisSuggestionsByKeyword: Array<{ keywords: string[]; diagnoses: string[] }> = [
  {
    keywords: ["digestiva", "laparoscopica"],
    diagnoses: ["Colelitiasis sintomatica", "Apendicitis aguda"],
  },
  {
    keywords: ["hernio", "inguinal"],
    diagnoses: ["Hernia inguinal derecha complicada"],
  },
  {
    keywords: ["colecistectomia", "vesicula", "biliar"],
    diagnoses: ["Colelitiasis sintomatica"],
  },
  {
    keywords: ["apendicectomia", "apendice"],
    diagnoses: ["Apendicitis aguda"],
  },
];

function getDiagnosisSuggestionsForProcedure(procedure: string) {
  if (!procedure) {
    return [];
  }

  const normalizedProcedure = normalizeMedicalText(procedure);

  const exactMatches = diagnosisSuggestionsByProcedure
    .filter((item) => normalizeMedicalText(item.procedure) === normalizedProcedure)
    .map((item) => item.diagnosis);

  if (exactMatches.length > 0) {
    return Array.from(new Set(exactMatches));
  }

  const keywordMatches = diagnosisSuggestionsByKeyword
    .filter((rule) => rule.keywords.some((keyword) => normalizedProcedure.includes(normalizeMedicalText(keyword))))
    .flatMap((rule) => rule.diagnoses);

  if (keywordMatches.length > 0) {
    return Array.from(new Set(keywordMatches));
  }

  return [];
}

export function CaseCreateForm({ policies }: CaseCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.policyId ?? "");
  const [formValues, setFormValues] = useState({
    patientName: "",
    policyStartDate: new Date().toISOString().slice(0, 10),
    diagnosis: "",
    requestedProcedure: "",
    requestDate: new Date().toISOString().slice(0, 10),
    isUrgent: false,
  });

  const selectedPolicy = useMemo(
    () => policies.find((policy) => policy.policyId === selectedPolicyId),
    [policies, selectedPolicyId],
  );

  const procedureOptions = selectedPolicy?.coveredProcedures.filter(Boolean) ?? [];

  const diagnosisSuggestions = useMemo(() => {
    return getDiagnosisSuggestionsForProcedure(formValues.requestedProcedure);
  }, [formValues.requestedProcedure]);

  function updateField(name: string, value: string | boolean) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formValues,
          insurerName: selectedPolicy?.insurerName ?? "",
          policyId: selectedPolicyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear el caso.");
        return;
      }

      setMessage(`Caso creado en Notion: ${data.case.caseId}`);
      router.push(`/documents/new?caseId=${encodeURIComponent(data.case.caseId)}`);
      router.refresh();
    } catch {
      setError("Ocurrio un error al crear el caso.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="case-patient">Paciente</label>
          <input
            id="case-patient"
            value={formValues.patientName}
            onChange={(event) => updateField("patientName", event.target.value)}
            placeholder="Nombre completo del paciente"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="case-policy">Poliza vinculada</label>
          <select
            id="case-policy"
            value={selectedPolicyId}
            onChange={(event) => {
              const nextPolicyId = event.target.value;
              setSelectedPolicyId(nextPolicyId);
              setFormValues((current) => ({
                ...current,
                requestedProcedure: "",
                diagnosis: "",
              }));
            }}
            required
          >
            <option value="">Selecciona una poliza</option>
            {policies.map((policy) => (
              <option key={policy.policyId} value={policy.policyId}>
                {policy.policyId} - {policy.insurerName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="case-policy-start">Inicio de poliza</label>
          <input
            id="case-policy-start"
            type="date"
            value={formValues.policyStartDate}
            onChange={(event) => updateField("policyStartDate", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="case-request-date">Fecha de solicitud</label>
          <input
            id="case-request-date"
            type="date"
            value={formValues.requestDate}
            onChange={(event) => updateField("requestDate", event.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="case-procedure">Procedimiento solicitado</label>
        <select
          id="case-procedure"
          value={formValues.requestedProcedure}
          onChange={(event) => {
            const nextProcedure = event.target.value;
            const suggestedDiagnosis = getDiagnosisSuggestionsForProcedure(nextProcedure)[0] ?? "";

            setFormValues((current) => ({
              ...current,
              requestedProcedure: nextProcedure,
              diagnosis: suggestedDiagnosis ?? "",
            }));
          }}
          required
        >
          <option value="">Selecciona el procedimiento cubierto</option>
          {procedureOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Diagnostico</label>
        {diagnosisSuggestions.length > 0 ? (
          <div className={styles.chipList}>
            {diagnosisSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className={formValues.diagnosis === item ? styles.chipButtonActive : styles.chipButton}
                onClick={() => updateField("diagnosis", item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
        <input
          id="case-diagnosis"
          value={formValues.diagnosis}
          onChange={(event) => updateField("diagnosis", event.target.value)}
          placeholder={
            formValues.requestedProcedure
              ? "Elige una sugerencia o escribe otro diagnostico"
              : "Primero selecciona el procedimiento"
          }
          required
        />
        <small>
          {diagnosisSuggestions.length > 0
            ? "Elige una opcion sugerida o escribe un diagnostico manual."
            : "Selecciona primero el procedimiento para ver diagnosticos sugeridos."}
        </small>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={formValues.isUrgent}
          onChange={(event) => updateField("isUrgent", event.target.checked)}
        />
        <span>Marcar como caso urgente</span>
      </label>

      <div className={styles.hintBox}>
        Registra el caso y continua de una vez a la carga de documentos del mismo expediente.
      </div>

      {message ? <div className={styles.messageOk}>{message}</div> : null}
      {error ? <div className={styles.messageError}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear caso"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/cases")}>
          Volver a casos
        </button>
      </div>
    </form>
  );
}
