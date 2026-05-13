import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { CaseCreateForm } from "@/components/case-create-form";
import styles from "@/components/entity-form.module.css";
import { getDataSourceMode, listPolicies } from "@/lib/case-service";

export default async function NewCasePage() {
  const policies = await listPolicies();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="casos"
          items={[
            { key: "dashboard", label: "Dashboard", href: "/dashboard" },
            { key: "casos", label: "Casos", href: "/cases" },
            { key: "polizas", label: "Polizas", href: "/policies" },
            { key: "documentos", label: "Documentos", href: "/documents" },
            { key: "config", label: "Configuracion", href: "/settings" },
            { key: "auditoria", label: "Auditoria", href: "/audit" },
          ]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.canvas}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar poliza de referencia..."
              searchTargetPath="/policies"
              systemStatusLabel="Origen:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Notion activa" : "Modo mock"}
            />

            <section className={styles.headerBlock}>
              <h2 className={styles.title}>Nuevo caso</h2>
              <p className={styles.subtitle}>
                Crea un caso quirurgico real y guárdalo directamente en la base `Casos` de Notion.
              </p>
            </section>

            <section className={styles.card}>
              <CaseCreateForm policies={policies} />
            </section>

            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
