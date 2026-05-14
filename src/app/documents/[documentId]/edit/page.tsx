import { notFound } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import styles from "@/components/entity-form.module.css";
import { DocumentCreateForm } from "@/features/documents/components/document-create-form";
import { workspaceNavigationItems } from "@/lib/app-navigation";
import { findDocumentById, getDataSourceMode, listCases, listPolicies } from "@/lib/case-service";

type EditDocumentPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const { documentId } = await params;
  const [cases, policies, document] = await Promise.all([listCases(), listPolicies(), findDocumentById(documentId)]);
  const sourceMode = getDataSourceMode();

  if (!document) {
    notFound();
  }

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
              title={`Editar documento ${document.documentId}`}
              subtitle="Paso 2"
              actions={[{ href: `/cases/${document.caseId}`, label: "Volver al caso", variant: "secondary" }]}
            />

            <section className={styles.card}>
              <DocumentCreateForm cases={cases} policies={policies} initialDocument={document} mode="edit" />
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
