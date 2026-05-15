"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { SurgicalCase } from "@/types/domain";
import styles from "./entity-form.module.css";

type DocumentCreateFormProps = {
  cases: SurgicalCase[];
};

export function DocumentCreateForm({ cases }: DocumentCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    documentId: "",
    caseId: cases[0]?.caseId ?? "",
    documentType: "",
    fileUrl: "",
    documentStatus: "Disponible",
    extractedText: "",
  });

  function updateField(name: string, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleLocalFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setFormValues((current) => ({
        ...current,
        extractedText: text.slice(0, 1900),
      }));
      setMessage("Se cargo el texto del archivo local para precargar el registro.");
      setError(null);
    } catch {
      setError("No se pudo leer el archivo local en el navegador.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear el documento.");
        return;
      }

      setMessage(`Documento creado en Notion: ${data.document.documentId}`);
      router.push("/documents");
      router.refresh();
    } catch {
      setError("Ocurrio un error al crear el documento.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="document-id">ID del documento</label>
          <input
            id="document-id"
            value={formValues.documentId}
            onChange={(event) => updateField("documentId", event.target.value)}
            placeholder="Opcional, se genera automaticamente"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="document-case">Caso vinculado</label>
          <select
            id="document-case"
            value={formValues.caseId}
            onChange={(event) => updateField("caseId", event.target.value)}
            required
          >
            <option value="">Selecciona un caso</option>
            {cases.map((item) => (
              <option key={item.caseId} value={item.caseId}>
                {item.caseId} - {item.patientName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="document-type">Tipo documental</label>
          <input
            id="document-type"
            value={formValues.documentType}
            onChange={(event) => updateField("documentType", event.target.value)}
            placeholder="Historia clínica, Orden médica, Exámenes preoperatorios"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="document-status">Estado</label>
          <select
            id="document-status"
            value={formValues.documentStatus}
            onChange={(event) => updateField("documentStatus", event.target.value)}
          >
            <option value="Disponible">Disponible</option>
            <option value="Procesado">Procesado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="document-url">URL del archivo</label>
        <input
          id="document-url"
          type="url"
          value={formValues.fileUrl}
          onChange={(event) => updateField("fileUrl", event.target.value)}
          placeholder="https://..."
        />
        <small>Si ya tienes el archivo publicado, pega aquí su enlace para que quede guardado en Notion.</small>
      </div>

      <div className={styles.field}>
        <label htmlFor="document-local">Archivo local opcional</label>
        <input id="document-local" type="file" accept=".txt,.md,.json,.csv" onChange={handleLocalFile} />
        <small>Lee texto simple en el navegador para precargar `texto_extraido`. No sustituye una URL pública del archivo.</small>
      </div>

      <div className={styles.field}>
        <label htmlFor="document-text">Texto extraido</label>
        <textarea
          id="document-text"
          value={formValues.extractedText}
          onChange={(event) => updateField("extractedText", event.target.value)}
          placeholder="Pega o revisa aquí el texto que quedará guardado en Notion."
        />
      </div>

      <div className={styles.hintBox}>
        Este formulario crea el registro del documento directamente en Notion. Si quieres que además exista un enlace
        abrible, debes completar `URL del archivo`.
      </div>

      {message ? <div className={styles.messageOk}>{message}</div> : null}
      {error ? <div className={styles.messageError}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear documento en Notion"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/documents")}>
          Volver a documentos
        </button>
      </div>
    </form>
  );
}
