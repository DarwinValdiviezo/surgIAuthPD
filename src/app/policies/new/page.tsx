import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import styles from "@/components/entity-form.module.css";
import { PolicyCreateForm } from "@/components/policy-create-form";
import { getDataSourceMode } from "@/lib/case-service";

export default async function NewPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="polizas"
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
              searchPlaceholder="Buscar una poliza existente..."
              searchTargetPath="/policies"
              systemStatusLabel="Origen:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Notion activa" : "Modo mock"}
            />

            <section className={styles.headerBlock}>
              <h2 className={styles.title}>Nueva poliza</h2>
              <p className={styles.subtitle}>
                Registra una póliza nueva en Notion con cobertura, carencia, exclusiones y documentos requeridos.
              </p>
            </section>

            <section className={styles.card}>
              <PolicyCreateForm />
            </section>

            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
