import Link from "next/link";
import { getDataSourceMode, listCases, listDocuments, listPolicies } from "@/lib/case-service";
import styles from "./app-home.module.css";

type AppHomeProps = {
  compact?: boolean;
};

export async function AppHome({ compact = false }: AppHomeProps) {
  const [cases, policies, documents] = await Promise.all([listCases(), listPolicies(), listDocuments()]);
  const notionMode = getDataSourceMode() === "notion";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>SA</div>
            <div>
              <p className={styles.brandTitle}>SurgiAuth</p>
              <p className={styles.brandSubtitle}>Preautorizacion quirurgica en tiempo real</p>
            </div>
          </div>

          <div className={styles.topbarLinks}>
            <a href="/api/notion/health" className={styles.topbarLinkSecondary}>
              Estado del sistema
            </a>
            <Link href="/cases" className={styles.topbarLink}>
              Ir a casos
            </Link>
          </div>
        </header>

        <section className={styles.hero}>
          <article className={styles.heroCard}>
            <p className={styles.eyebrow}>Flujo principal</p>
            <h1 className={styles.headline}>
              El usuario entra, revisa los casos y deja una preaprobacion o solicitud de documentos faltantes en minutos.
            </h1>
            <p className={styles.subhead}>
              SurgiAuth toma el informe medico del hospital, la poliza de la aseguradora y los documentos asociados en
              Notion. Luego valida cobertura, carencia, exclusiones y soporte documental para dar una respuesta clara y
              auditable.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/cases" className={styles.primaryButton}>
                Empezar con los casos
              </Link>
              <a href="/api/notion/health" className={styles.secondaryButton}>
                Ver integraciones
              </a>
            </div>

            <div className={styles.miniStats}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Casos cargados</span>
                <strong className={styles.statValue}>{cases.length}</strong>
                <p className={styles.statNote}>Solicitudes disponibles para revisar ahora mismo.</p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Polizas disponibles</span>
                <strong className={styles.statValue}>{policies.length}</strong>
                <p className={styles.statNote}>Base actual que se usa para validar cobertura y carencia.</p>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Documentos asociados</span>
                <strong className={styles.statValue}>{documents.length}</strong>
                <p className={styles.statNote}>Soportes que ya pueden alimentar el analisis del agente.</p>
              </div>
            </div>
          </article>

          <article className={styles.heroCard}>
            <p className={styles.eyebrow}>Estado actual</p>
            <h2 className={styles.sectionTitle}>Lo que el sistema ya hace hoy</h2>
            <div className={styles.supportList}>
              <div className={styles.supportItem}>
                <span>Fuente de datos</span>
                <strong>{notionMode ? "Notion en vivo" : "Modo mock"}</strong>
              </div>
              <div className={styles.supportItem}>
                <span>Procesamiento de casos</span>
                <strong>Disponible</strong>
              </div>
              <div className={styles.supportItem}>
                <span>Lectura de documentos</span>
                <strong>{documents.length > 0 ? "Activa" : "Sin documentos"}</strong>
              </div>
              <div className={styles.supportItem}>
                <span>Ruta principal del usuario</span>
                <strong>Casos</strong>
              </div>
            </div>
            {!compact && (
              <p className={styles.footerNote}>
                El foco no es llenar la pantalla de widgets, sino llevar al usuario directo a la cola de casos y luego
                al detalle donde se toma la decision.
              </p>
            )}
          </article>
        </section>

        {!compact && (
          <>
            <section className={styles.flowSection}>
              <div>
                <p className={styles.eyebrow}>Experiencia propuesta</p>
                <h2 className={styles.sectionTitle}>Asi deberia usarlo el cliente</h2>
                <p className={styles.sectionCopy}>
                  El sistema debe sentirse directo: entrar, ubicar el caso, entender el analisis y actuar. No necesita
                  dashboards pesados, sino un flujo corto y claro.
                </p>
              </div>

              <div className={styles.steps}>
                <article className={styles.stepCard}>
                  <span className={styles.stepNumber}>01</span>
                  <h3 className={styles.stepTitle}>Entrar al inicio</h3>
                  <p className={styles.stepText}>
                    Ver el estado general de la plataforma y acceder de inmediato a la lista de casos sin distracciones.
                  </p>
                </article>
                <article className={styles.stepCard}>
                  <span className={styles.stepNumber}>02</span>
                  <h3 className={styles.stepTitle}>Abrir un caso</h3>
                  <p className={styles.stepText}>
                    Revisar paciente, poliza, documentos, analisis de IA y checks operativos en una sola pantalla.
                  </p>
                </article>
                <article className={styles.stepCard}>
                  <span className={styles.stepNumber}>03</span>
                  <h3 className={styles.stepTitle}>Emitir respuesta</h3>
                  <p className={styles.stepText}>
                    Procesar el caso y devolver preaprobacion o solicitud de faltantes con trazabilidad clara.
                  </p>
                </article>
              </div>
            </section>

            <section className={styles.supportGrid}>
              <article className={styles.supportCard}>
                <h3 className={styles.supportTitle}>Pantallas realmente necesarias</h3>
                <div className={styles.supportList}>
                  <div className={styles.supportItem}>
                    <span>Inicio</span>
                    <strong>Portada y acceso</strong>
                  </div>
                  <div className={styles.supportItem}>
                    <span>Casos</span>
                    <strong>Cola principal de trabajo</strong>
                  </div>
                  <div className={styles.supportItem}>
                    <span>Detalle del caso</span>
                    <strong>Pantalla clave de decision</strong>
                  </div>
                  <div className={styles.supportItem}>
                    <span>Configuracion</span>
                    <strong>Health check e integraciones</strong>
                  </div>
                </div>
              </article>

              <article className={styles.supportCard}>
                <h3 className={styles.supportTitle}>Lo que evitamos</h3>
                <div className={styles.supportList}>
                  <div className={styles.supportItem}>
                    <span>Widgets falsos</span>
                    <strong>Eliminados</strong>
                  </div>
                  <div className={styles.supportItem}>
                    <span>Navegacion inflada</span>
                    <strong>Reducida</strong>
                  </div>
                  <div className={styles.supportItem}>
                    <span>Duplicacion entre vistas</span>
                    <strong>En correccion</strong>
                  </div>
                  <div className={styles.supportItem}>
                    <span>Foco del usuario</span>
                    <strong>Centrado en los casos</strong>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
