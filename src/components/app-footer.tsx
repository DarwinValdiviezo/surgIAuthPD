import Link from "next/link";
import styles from "./app-shell.module.css";

type AppFooterProps = {
  compact?: boolean;
};

export function AppFooter({ compact = false }: AppFooterProps) {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerCopy}>
        SurgiAuth centraliza casos, polizas y documentos para acelerar la preautorizacion quirurgica con trazabilidad
        clara.
      </p>
      <div className={styles.footerLinks}>
        {!compact ? (
          <Link href="/" className={styles.footerLink}>
            Inicio
          </Link>
        ) : null}
        <Link href="/cases" className={styles.footerLink}>
          Casos
        </Link>
        <a href="/api/notion/health" className={styles.footerLink}>
          Estado del sistema
        </a>
      </div>
    </footer>
  );
}
