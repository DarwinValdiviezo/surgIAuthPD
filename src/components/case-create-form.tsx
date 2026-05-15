"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Policy } from "@/types/domain";
import styles from "./entity-form.module.css";

type CaseCreateFormProps = {
  policies: Policy[];
};

export function CaseCreateForm({ policies }: CaseCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.policyId ?? "");
  const [formValues, setFormValues] = useState({
    caseId: "",
    patientName: "",
    policyStartDate: new Date().toISOString().slice(0, 10),
    diagnosis: "",
    requestedProcedure: "",
    requestDate: new Date().toISOString().slice(0, 10),
    submittedDocuments: "",
    isUrgent: false,
  });

  const selectedPolicy = useMemo(
    () => policies.find((policy) => policy.policyId === selectedPolicyId),
    [policies, selectedPolicyId],
  );

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
      router.push(`/cases/${data.case.caseId}`);
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
          <label htmlFor="case-id">ID del caso</label>
          <input
            id="case-id"
            value={formValues.caseId}
            onChange={(event) => updateField("caseId", event.target.value)}
            placeholder="Opcional, se genera automaticamente"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="case-patient">Paciente</label>
          <input
            id="case-patient"
            value={formValues.patientName}
            onChange={(event) => updateField("patientName", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="case-policy">Poliza vinculada</label>
          <select
            id="case-policy"
            value={selectedPolicyId}
            onChange={(event) => setSelectedPolicyId(event.target.value)}
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
          <label htmlFor="case-insurer">Aseguradora</label>
          <input id="case-insurer" value={selectedPolicy?.insurerName ?? ""} readOnly />
          <small>Se completa automaticamente segun la poliza elegida.</small>
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
        <label htmlFor="case-diagnosis">Diagnostico</label>
        <textarea
          id="case-diagnosis"
          value={formValues.diagnosis}
          onChange={(event) => updateField("diagnosis", event.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="case-procedure">Procedimiento solicitado</label>
        <textarea
          id="case-procedure"
          value={formValues.requestedProcedure}
          onChange={(event) => updateField("requestedProcedure", event.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="case-documents">Documentos declarados</label>
        <input
          id="case-documents"
          value={formValues.submittedDocuments}
          onChange={(event) => updateField("submittedDocuments", event.target.value)}
          placeholder="Historia clínica, Orden médica, Consentimiento informado"
        />
        <small>Separa cada documento con coma.</small>
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
        Este formulario crea el registro del caso directamente en la base de Notion de `Casos`.
      </div>

      {message ? <div className={styles.messageOk}>{message}</div> : null}
      {error ? <div className={styles.messageError}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear caso en Notion"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/cases")}>
          Volver a casos
        </button>
      </div>
    </form>
  );
}
