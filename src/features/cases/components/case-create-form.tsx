"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Policy } from "@/types/domain";
import styles from "@/components/entity-form.module.css";

type CaseCreateFormProps = {
  policies: Policy[];
};

const diagnosisSuggestionsByProcedure: Array<{ procedure: string; diagnosis: string }> = [
  { procedure: "Hernioplastia inguinal con malla", diagnosis: "Hernia inguinal derecha complicada" },
  { procedure: "Colecistectomía laparoscópica", diagnosis: "Colelitiasis sintomática" },
  { procedure: "Apendicectomía laparoscópica", diagnosis: "Apendicitis aguda" },
];

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
  const diagnosisSuggestions = diagnosisSuggestionsByProcedure
    .filter((item) => !formValues.requestedProcedure || item.procedure === formValues.requestedProcedure)
    .map((item) => item.diagnosis);

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
            const suggestedDiagnosis = diagnosisSuggestionsByProcedure.find((item) => item.procedure === nextProcedure)?.diagnosis;

            setFormValues((current) => ({
              ...current,
              requestedProcedure: nextProcedure,
              diagnosis: current.diagnosis || !suggestedDiagnosis ? current.diagnosis : suggestedDiagnosis,
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
        <label htmlFor="case-diagnosis">Diagnostico</label>
        <input
          id="case-diagnosis"
          list="case-diagnosis-options"
          value={formValues.diagnosis}
          onChange={(event) => updateField("diagnosis", event.target.value)}
          placeholder="Selecciona o escribe el diagnostico"
          required
        />
        <datalist id="case-diagnosis-options">
          {diagnosisSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
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
