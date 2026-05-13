import Link from "next/link";
import styles from "./app-shell.module.css";

type SidebarItem = {
  label: string;
  href: string;
  key: string;
};

type SidebarStat = {
  label: string;
  value: string;
};

type AppSidebarProps = {
  variant?: "default" | "dashboard";
  activeKey: string;
  items?: SidebarItem[];
  stats?: SidebarStat[];
  profileName?: string;
  profileRole?: string;
};

const defaultItems: SidebarItem[] = [
  { key: "inicio", label: "Inicio", href: "/" },
  { key: "casos", label: "Casos", href: "/cases" },
  { key: "estado", label: "Estado del sistema", href: "/api/notion/health" },
];

export function AppSidebar({
  variant = "default",
  activeKey,
  items = defaultItems,
  stats = [],
  profileName = "Darwin Valdiviezo",
  profileRole = "Acceso administrador",
}: AppSidebarProps) {
  if (variant === "dashboard") {
    return (
      <aside className={styles.dashboardSidebar}>
        <div className={styles.dashboardSidebarBrand}>
          <div className={styles.dashboardBrandMark}>SA</div>
          <div>
            <h1 className={styles.dashboardBrandTitle}>SurgiAuth</h1>
            <p className={styles.dashboardBrandSubtitle}>Pre-Auth Portal</p>
          </div>
        </div>

        <div className={styles.dashboardNavSection}>
          {items.map((item) => {
            const className = item.key === activeKey ? styles.dashboardNavItemActive : styles.dashboardNavItem;

            return (
              <Link key={item.key} href={item.href} className={className}>
                <span className={styles.dashboardNavIcon}>{item.label.slice(0, 1)}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className={styles.dashboardSidebarProfile}>
          <div className={styles.dashboardProfileAvatar}>DV</div>
          <div className={styles.dashboardProfileCopy}>
            <p className={styles.dashboardProfileName}>{profileName}</p>
            <p className={styles.dashboardProfileRole}>{profileRole}</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandMark}>SA</span>
        <span className={styles.brandCopy}>
          <span className={styles.brandTitle}>SurgiAuth</span>
          <span className={styles.brandSubtitle}>Mesa operativa</span>
        </span>
      </Link>

      <div className={styles.navSection}>
        {items.map((item, index) => {
          const className = item.key === activeKey ? styles.navItemActive : styles.navItem;

          return (
            <Link key={item.key} href={item.href} className={className}>
              <span className={styles.navIcon}>{String(index + 1).padStart(2, "0")}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {stats.length > 0 ? (
        <div className={styles.sidebarFooter}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.sidebarStat}>
              <span className={styles.sidebarStatLabel}>{stat.label}</span>
              <strong className={styles.sidebarStatValue}>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
