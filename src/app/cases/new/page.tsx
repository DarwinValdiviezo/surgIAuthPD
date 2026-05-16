import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import styles from "@/components/entity-form.module.css";
import { CaseCreateForm } from "@/features/cases/components/case-create-form";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { getDataSourceMode, listPolicies } from "@/lib/case-service";

export default async function NewCasePage() {
  const policies = await listPolicies();
  const sourceMode = getDataSourceMode();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="casos"
          items={[...workspaceNavigationItems]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.fullWidthHeader}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar casos, pacientes o polizas..."
              searchTargetPath="/cases"
              systemStatusLabel="Estado del sistema:"
              systemStatusValue={sourceMode === "notion" ? "Notion activa" : "Notion no configurada"}
            />
          </div>

          <div className={styles.canvas}>
            <AppHeader
              title="Nuevo caso"
              subtitle="Paso 1"
              actions={[{ href: "/cases", label: "Volver a casos", variant: "secondary" }]}
            />

            <section className={styles.card}>
              <CaseCreateForm policies={policies} />
            </section>
          </div>

          <div className={styles.fullWidthFooter}>
            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
