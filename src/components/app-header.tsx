import Link from "next/link";
import { Suspense } from "react";
import styles from "./app-shell.module.css";
import { DashboardSearchInput } from "./dashboard-search-input";

type HeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type AppHeaderProps = {
  variant?: "default" | "dashboard";
  title?: string;
  subtitle?: string;
  showBrand?: boolean;
  backHref?: string;
  backLabel?: string;
  actions?: HeaderAction[];
  searchPlaceholder?: string;
  searchTargetPath?: string;
  searchQueryKey?: string;
  systemStatusLabel?: string;
  systemStatusValue?: string;
};

export function AppHeader({
  variant = "default",
  title,
  subtitle,
  showBrand = false,
  backHref,
  backLabel,
  actions = [],
  searchPlaceholder = "Buscar...",
  searchTargetPath,
  searchQueryKey = "q",
  systemStatusLabel = "Estado del sistema",
  systemStatusValue = "Operativo",
}: AppHeaderProps) {
  if (variant === "dashboard") {
    return (
      <header className={styles.dashboardHeader}>
        <div className={styles.dashboardSearchWrap}>
          <Suspense fallback={<input className={styles.dashboardSearchInput} placeholder={searchPlaceholder} type="text" />}>
            <DashboardSearchInput
              placeholder={searchPlaceholder}
              targetPath={searchTargetPath}
              queryKey={searchQueryKey}
            />
          </Suspense>
        </div>
        <div className={styles.dashboardHeaderRight}>
          <div className={styles.dashboardSystemStatus}>
            <span className={styles.dashboardSystemLabel}>{systemStatusLabel}</span>
            <span className={styles.dashboardSystemPill}>
              <span className={styles.dashboardSystemDot} />
              {systemStatusValue}
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {showBrand ? (
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>SA</span>
            <span className={styles.brandCopy}>
              <span className={styles.brandTitle}>SurgiAuth</span>
              <span className={styles.brandSubtitle}>Preautorizacion quirurgica en tiempo real</span>
            </span>
          </Link>
        ) : null}

        {backHref && backLabel ? (
          <Link href={backHref} className={styles.backLink}>
            {backLabel}
          </Link>
        ) : null}

        {title ? (
          <div>
            <h1 className={styles.headerTitle}>{title}</h1>
            {subtitle ? <p className={styles.headerSubtitle}>{subtitle}</p> : null}
          </div>
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div className={styles.headerActions}>
          {actions.map((action) => (
            <a
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={action.variant === "secondary" ? styles.headerLinkSecondary : styles.headerLink}
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}
