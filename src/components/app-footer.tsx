import Link from "next/link";
import styles from "./app-shell.module.css";
import { footerNavigationItems } from "@/lib/app-navigation";

type AppFooterProps = {
  compact?: boolean;
};

export function AppFooter({ compact = false }: AppFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <p className={styles.footerTitle}>SurgiAuth</p>
        <p className={styles.footerCopy}>
          Casos, polizas y documentos conectados en un flujo claro de preautorizacion quirurgica.
        </p>
      </div>
      <div className={styles.footerLinks}>
        {footerNavigationItems.map((item) => (
          <Link key={item.key} href={item.href} className={styles.footerLink}>
            {item.label}
          </Link>
        ))}
        {!compact ? (
          <a href="/api/notion/health" className={styles.footerLink}>
            Estado del sistema
          </a>
        ) : null}
      </div>
    </footer>
  );
}
