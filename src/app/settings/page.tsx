import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { getDataSourceMode, getNotionSetupStatus, listCases, listDocuments, listPolicies } from "@/lib/case-service";
import styles from "./settings.module.css";

function getHealthLabel(value: boolean) {
  return value ? "Conectado" : "Pendiente";
}

function getHealthClass(value: boolean, classes: Record<string, string>) {
  return value ? classes.healthOk : classes.healthPending;
}

export default async function SettingsPage() {
  const [cases, policies, documents] = await Promise.all([listCases(), listPolicies(), listDocuments()]);
  const notion = getNotionSetupStatus();

  const integrations = [
    { label: "Token de Notion", value: notion.hasToken },
    { label: "Base de casos", value: notion.hasCasesDataSource },
    { label: "Base de polizas", value: notion.hasPoliciesDataSource },
    { label: "Base de documentos", value: notion.hasDocumentsDataSource },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppSidebar
          variant="dashboard"
          activeKey="config"
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
              searchPlaceholder="Buscar ajuste o integracion..."
              searchTargetPath="/settings"
              systemStatusLabel="Modo actual:"
              systemStatusValue={getDataSourceMode() === "notion" ? "Produccion con Notion" : "Modo mock"}
            />

            <section className={styles.headerBlock}>
              <div>
                <h2 className={styles.title}>Configuracion del sistema</h2>
                <p className={styles.subtitle}>
                  Estado de integraciones, disponibilidad operativa y bases conectadas para la preautorizacion.
                </p>
              </div>
            </section>

            <section className={styles.metrics}>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Casos visibles</span>
                <strong className={styles.metricValue}>{cases.length}</strong>
                <p className={styles.metricCopy}>Carga operativa disponible desde la fuente configurada.</p>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Polizas activas</span>
                <strong className={styles.metricValue}>{policies.length}</strong>
                <p className={styles.metricCopy}>Catalogo tecnico listo para validacion de cobertura.</p>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Documentos cargados</span>
                <strong className={styles.metricValue}>{documents.length}</strong>
                <p className={styles.metricCopy}>Soportes actualmente expuestos al motor de analisis.</p>
              </article>
            </section>

            <section className={styles.grid}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Integraciones</p>
                    <h3 className={styles.panelTitle}>Estado de conexion</h3>
                  </div>
                </div>
                <div className={styles.integrationList}>
                  {integrations.map((item) => (
                    <div key={item.label} className={styles.integrationRow}>
                      <div>
                        <p className={styles.integrationLabel}>{item.label}</p>
                        <p className={styles.integrationHint}>Validacion directa contra variables y disponibilidad de origen.</p>
                      </div>
                      <span className={getHealthClass(item.value, styles)}>{getHealthLabel(item.value)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Motor</p>
                    <h3 className={styles.panelTitle}>Lectura operativa</h3>
                  </div>
                </div>
                <div className={styles.stack}>
                  <div className={styles.stackItem}>
                    <span className={styles.stackLabel}>Fuente de datos</span>
                    <strong className={styles.stackValue}>{getDataSourceMode() === "notion" ? "Notion" : "Mock local"}</strong>
                  </div>
                  <div className={styles.stackItem}>
                    <span className={styles.stackLabel}>Gemini</span>
                    <strong className={styles.stackValue}>Disponible cuando la extraccion IA es requerida</strong>
                  </div>
                  <div className={styles.stackItem}>
                    <span className={styles.stackLabel}>Persistencia de decision</span>
                    <strong className={styles.stackValue}>
                      {notion.configured ? "Actualizacion de casos habilitada" : "Solo simulacion local"}
                    </strong>
                  </div>
                </div>
              </article>
            </section>

            <section className={styles.bottomGrid}>
              <article className={styles.noteCard}>
                <span className={styles.noteLabel}>Cobertura tecnica</span>
                <p className={styles.noteText}>
                  El sistema ya puede consultar casos, polizas y documentos; evaluar cobertura; y actualizar el resultado del caso cuando Notion esta correctamente conectado.
                </p>
              </article>
              <article className={styles.highlightCard}>
                <div className={styles.highlightContent}>
                  <h4>Panel listo para demostracion</h4>
                  <p>La configuracion actual prioriza claridad operativa y validacion directa del flujo real del agente.</p>
                </div>
              </article>
            </section>

            <AppFooter compact />
          </div>
        </main>
      </div>
    </div>
  );
}
