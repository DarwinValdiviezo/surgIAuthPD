"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./entity-form.module.css";

export function PolicyCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    policyId: "",
    insurerName: "",
    coveredProcedures: "",
    exclusions: "",
    waitingPeriodDays: "0",
    requiredDocuments: "",
  });

  function updateField(name: string, value: string) {
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
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la poliza.");
        return;
      }

      setMessage(`Poliza creada en Notion: ${data.policy.policyId}`);
      router.push("/policies");
      router.refresh();
    } catch {
      setError("Ocurrio un error al crear la poliza.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="policy-id">ID de poliza</label>
          <input
            id="policy-id"
            value={formValues.policyId}
            onChange={(event) => updateField("policyId", event.target.value)}
            placeholder="Opcional, se genera automaticamente"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="policy-insurer">Aseguradora</label>
          <input
            id="policy-insurer"
            value={formValues.insurerName}
            onChange={(event) => updateField("insurerName", event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="policy-waiting">Dias de carencia</label>
          <input
            id="policy-waiting"
            type="number"
            min="0"
            value={formValues.waitingPeriodDays}
            onChange={(event) => updateField("waitingPeriodDays", event.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="policy-covered">Procedimientos cubiertos</label>
        <textarea
          id="policy-covered"
          value={formValues.coveredProcedures}
          onChange={(event) => updateField("coveredProcedures", event.target.value)}
          placeholder="Cirugía General, Cirugía Ortopédica, Cirugía Urológica"
          required
        />
        <small>Separa cada cobertura con coma.</small>
      </div>

      <div className={styles.field}>
        <label htmlFor="policy-documents">Documentos requeridos</label>
        <textarea
          id="policy-documents"
          value={formValues.requiredDocuments}
          onChange={(event) => updateField("requiredDocuments", event.target.value)}
          placeholder="Historia clínica, Orden médica, Consentimiento informado"
          required
        />
        <small>Estos documentos se guardan en la póliza real de Notion.</small>
      </div>

      <div className={styles.field}>
        <label htmlFor="policy-exclusions">Exclusiones</label>
        <textarea
          id="policy-exclusions"
          value={formValues.exclusions}
          onChange={(event) => updateField("exclusions", event.target.value)}
          placeholder="Procedimientos estéticos, Enfermedades preexistentes"
        />
        <small>Opcional. Separa cada exclusión con coma.</small>
      </div>

      <div className={styles.hintBox}>
        Esta pantalla crea una poliza nueva dentro de la base `Polizas` de Notion con sus reglas principales.
      </div>

      {message ? <div className={styles.messageOk}>{message}</div> : null}
      {error ? <div className={styles.messageError}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear poliza en Notion"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/policies")}>
          Volver a polizas
        </button>
      </div>
    </form>
  );
}
