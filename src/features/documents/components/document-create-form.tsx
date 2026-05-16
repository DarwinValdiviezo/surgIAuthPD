"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { CaseDocument, Policy, SurgicalCase } from "@/types/domain";
import styles from "@/components/entity-form.module.css";

type DocumentCreateFormProps = {
  cases: SurgicalCase[];
  policies: Policy[];
  initialCaseId?: string;
  initialDocument?: CaseDocument;
  mode?: "create" | "edit";
};

function getRequiredDocumentOptions(
  caseId: string,
  cases: SurgicalCase[],
  policies: Policy[],
  initialDocument?: CaseDocument,
  isEditMode?: boolean,
) {
  const selectedCase = cases.find((item) => item.caseId === caseId);
  const selectedPolicy = policies.find((item) => item.policyId === selectedCase?.policyId);
  const baseOptions = selectedPolicy?.requiredDocuments?.filter(Boolean) ?? [];

  if (isEditMode && initialDocument?.documentType && !baseOptions.includes(initialDocument.documentType)) {
    return [initialDocument.documentType, ...baseOptions];
  }

  return baseOptions;
}

export function DocumentCreateForm({
  cases,
  policies,
  initialCaseId,
  initialDocument,
  mode = "create",
}: DocumentCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = mode === "edit";
  const [formValues, setFormValues] = useState({
    documentId: initialDocument?.documentId ?? "",
    caseId:
      initialDocument?.caseId ??
      (initialCaseId && cases.some((item) => item.caseId === initialCaseId) ? initialCaseId : cases[0]?.caseId ?? ""),
    documentType: initialDocument?.documentType ?? "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const selectedCase = cases.find((item) => item.caseId === formValues.caseId);
  const requiredDocumentOptions = getRequiredDocumentOptions(
    formValues.caseId,
    cases,
    policies,
    initialDocument,
    isEditMode,
  );
  const documentTypeValue =
    formValues.documentType && requiredDocumentOptions.includes(formValues.documentType)
      ? formValues.documentType
      : requiredDocumentOptions[0] ?? "";

  function updateField(name: string, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleLocalFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setMessage("PDF cargado. Al guardar, el sistema extraera el texto y lo dejara listo para el analisis.");
      return;
    }

    try {
      await file.text();
      setMessage("Archivo cargado. Al guardar, el sistema procesara el contenido y lo vinculara al caso.");
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
      const payload = new FormData();
      if (formValues.documentId) {
        payload.set("documentId", formValues.documentId);
      }
      payload.set("caseId", formValues.caseId);
      payload.set("documentType", formValues.documentType);

      if (selectedFile) {
        payload.set("file", selectedFile);
      }

      const response = await fetch("/api/documents", {
        method: isEditMode ? "PUT" : "POST",
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el documento.");
        return;
      }

      setMessage(
        isEditMode
          ? `Documento actualizado en Notion: ${data.document.documentId}. Fuente de analisis: ${data.analysisSource}.`
          : `Documento creado en Notion: ${data.document.documentId}. Fuente de analisis: ${data.analysisSource}.`,
      );
      router.push(`/cases/${formValues.caseId}`);
      router.refresh();
    } catch {
      setError("Ocurrio un error al guardar el documento.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="document-case">Caso vinculado</label>
          <select
            id="document-case"
            value={formValues.caseId}
            onChange={(event) => {
              const nextCaseId = event.target.value;
              const nextOptions = getRequiredDocumentOptions(nextCaseId, cases, policies, initialDocument, isEditMode);
              setFormValues((current) => ({
                ...current,
                caseId: nextCaseId,
                documentType:
                  current.documentType && nextOptions.includes(current.documentType)
                    ? current.documentType
                    : nextOptions[0] ?? "",
              }));
            }}
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
          <select
            id="document-type"
            value={documentTypeValue}
            onChange={(event) => updateField("documentType", event.target.value)}
            required
          >
            <option value="">Selecciona el documento requerido</option>
            {requiredDocumentOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="document-local">Archivo del documento</label>
        <input id="document-local" type="file" accept=".pdf,.txt,.md,.json,.csv" onChange={handleLocalFile} />
        <small>Sube el soporte en PDF o texto. El sistema lo procesa al guardar y lo vincula al caso.</small>
      </div>

      <div className={styles.hintBox}>
        {selectedCase
          ? `Sube el soporte real de ${selectedCase.patientName} para el caso ${selectedCase.caseId}. El archivo quedara vinculado a este expediente y se preparara para el analisis del sistema.`
          : "Sube el soporte real del caso. El archivo quedara vinculado al expediente y se preparara para el analisis del sistema."}
      </div>

      {message ? <div className={styles.messageOk}>{message}</div> : null}
      {error ? <div className={styles.messageError}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? "Guardando..." : isEditMode ? "Guardar cambios y volver al caso" : "Subir documento y volver al caso"}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => router.push("/documents")}>
          Volver a documentos
        </button>
      </div>
    </form>
  );
}
