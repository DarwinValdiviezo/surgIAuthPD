import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import styles from "@/components/entity-form.module.css";
import { DocumentCreateForm } from "@/features/documents/components/document-create-form";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { getDataSourceMode, listCases, listPolicies } from "@/lib/case-service";

type NewDocumentPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const [cases, policies] = await Promise.all([listCases(), listPolicies()]);
  const initialCaseId = typeof resolvedSearchParams.caseId === "string" ? resolvedSearchParams.caseId : "";
  const sourceMode = getDataSourceMode();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="documentos"
          items={[...workspaceNavigationItems]}
          profileName="Darwin Valdiviezo"
          profileRole="Acceso administrador"
        />

        <main className={styles.main}>
          <div className={styles.fullWidthHeader}>
            <AppHeader
              variant="dashboard"
              searchPlaceholder="Buscar documentos, casos o pacientes..."
              searchTargetPath="/documents"
              systemStatusLabel="Fuente documental:"
              systemStatusValue={sourceMode === "notion" ? "Notion activa" : "Notion no configurada"}
            />
          </div>

          <div className={styles.canvas}>
            <AppHeader
              title="Nuevo documento"
              subtitle="Paso 2"
              actions={[{ href: "/documents", label: "Volver a documentos", variant: "secondary" }]}
            />

            <section className={styles.card}>
              <DocumentCreateForm cases={cases} policies={policies} initialCaseId={initialCaseId} />
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
