"use client";

import { useEffect, useState } from "react";
import styles from "./document-file-preview.module.css";

type DocumentFilePreviewProps = {
  fileUrl?: string;
  documentId: string;
};

export function DocumentFilePreview({ fileUrl, documentId }: DocumentFilePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!fileUrl) {
    return <span className={styles.disabledButton}>Sin archivo</span>;
  }

  return (
    <>
      <button type="button" className={styles.triggerButton} onClick={() => setIsOpen(true)}>
        Ver archivo
      </button>

      {isOpen ? (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} role="presentation">
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`document-preview-title-${documentId}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <div className={styles.headerText}>
                <h3 id={`document-preview-title-${documentId}`} className={styles.title}>
                  Vista del archivo
                </h3>
                <p className={styles.subtitle}>{documentId}</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Cerrar vista">
                ×
              </button>
            </div>

            <div className={styles.body}>
              <iframe src={fileUrl} title={`Archivo ${documentId}`} className={styles.frame} />
            </div>

            <div className={styles.footer}>
              <p className={styles.footerCopy}>
                Si el archivo no se muestra dentro del modal, puedes abrirlo en una pestaña aparte.
              </p>
              <div className={styles.footerActions}>
                <a href={fileUrl} target="_blank" rel="noreferrer" className={styles.secondaryLink}>
                  Abrir en pestaña
                </a>
                <button type="button" className={styles.primaryLink} onClick={() => setIsOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
