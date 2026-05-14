# SurgiAuth

SurgiAuth es un portal de preautorización quirúrgica que conecta hospital, póliza y documentos para responder de forma clara si un caso puede continuar, si falta soporte o si requiere revisión manual.

## Qué hace hoy

El flujo actual del sistema es:

1. El hospital crea un caso.
2. Se vincula la póliza real del paciente desde Notion.
3. El hospital sube documentos PDF o texto al expediente.
4. El sistema extrae información del documento.
5. SurgiAuth evalúa cobertura, carencia, exclusiones y faltantes.
6. Se devuelve una decisión explicable:
   - `Preaprobado`
   - `Pendiente por documentos`
   - `Rechazado por exclusión`
   - `Revisión manual`

## Estado actual del proyecto

Hoy el proyecto ya tiene:

- datos reales conectados desde Notion para `Casos`, `Pólizas` y `Documentos`
- formularios simplificados para crear casos y subir documentos
- carga de PDF desde la web
- extracción de texto en servidor
- procesamiento del caso con reglas reales
- modal de procesamiento paso a paso en el detalle del caso
- dashboard, casos, pólizas y documentos con navegación y layout más limpios

## Cómo funciona la decisión

La decisión no sale de texto libre. El motor aplica reglas concretas sobre:

- el caso
- la póliza
- los documentos asociados
- la extracción de procedimiento y diagnóstico

La lógica principal revisa:

1. si existe la póliza
2. si hay lectura suficiente para decidir
3. si faltan documentos requeridos
4. si el procedimiento está cubierto
5. si cae en exclusiones
6. si cumple carencia

## Fuente de datos

La fuente principal es Notion.

El proyecto espera estas bases:

- `Casos Quirúrgicos`
- `Pólizas`
- `Documentos`

No se incluyen tokens ni IDs reales en este `README`.

## Modo de IA

El sistema soporta dos caminos:

- `rules`
  Usa extracción y evaluación basada en datos reales y reglas del sistema.
- `gemini`
  Puede usarse cuando exista saldo y configuración válida del proveedor.

En este momento el flujo está preparado para trabajar bien con `rules`, evitando depender de cuota externa para las pruebas del MVP.

## Estructura recomendada

La arquitectura actual ya está más ordenada por dominio:

```text
src/
  app/
    api/
    cases/
    dashboard/
    documents/
    policies/
  components/
    app-footer.tsx
    app-header.tsx
    app-sidebar.tsx
    entity-form.module.css
  features/
    cases/
      components/
        case-create-form.tsx
        cases-filters.tsx
        process-case-button.tsx
    documents/
      components/
        document-create-form.tsx
        document-file-preview.tsx
        documents-filters.tsx
    policies/
      components/
        policies-filters.tsx
        policy-create-form.tsx
  lib/
    app-navigation.ts
    case-evaluation.ts
    case-service.ts
    document-processing.ts
    extraction.ts
    gemini.ts
    medical-taxonomy.ts
    notion.ts
  rules/
    coverage.ts
  types/
    domain.ts
```

## Variables de entorno

Usa un archivo `.env.local` con variables como estas:

```env
NOTION_TOKEN=
NOTION_CASES_DATA_SOURCE_ID=
NOTION_POLICIES_DATA_SOURCE_ID=
NOTION_DOCUMENTS_DATA_SOURCE_ID=
GEMINI_API_KEY=
AI_PROVIDER=rules
```

Notas:

- `.env.local` no debe subirse
- `.env.example` sí puede quedarse versionado como referencia

## Scripts útiles

Instalar dependencias:

```powershell
npm install
```

Levantar la app:

```powershell
npm run dev
```

Lint:

```powershell
npm run lint
```

Build:

```powershell
npm run build
```

Generar PDFs requeridos según Notion:

```powershell
npm run generate:required-pdfs
```

## Rutas principales

- `/dashboard`
- `/cases`
- `/cases/new`
- `/cases/[caseId]`
- `/documents`
- `/documents/new`
- `/policies`

## Endpoints principales

- `GET /api/notion/health`
- `POST /api/process-case`
- `POST /api/documents`
- `PUT /api/documents`
- `POST /api/cases`
- `POST /api/policies`

## Cómo probar el sistema

### Flujo general

1. Ejecuta `npm run dev`.
2. Verifica la conexión en `/api/notion/health`.
3. Entra a `/cases`.
4. Abre un caso real.
5. Si falta soporte, sube el documento desde `/documents/new`.
6. Vuelve al caso.
7. Presiona `Procesar caso`.
8. Revisa el modal de procesamiento y la nueva decisión.

### Caso recomendado para demo

Caso de prueba listo:

- `CASE-20260514-M5L0I`
- paciente: `Darwin Valdiviezo`
- aseguradora: `Sanitas`
- póliza: `POL-456321`
- diagnóstico: `Colelitiasis sintomática`
- procedimiento: `Colecistectomía laparoscópica`
- estado actual: `Pendiente por documentos`
- faltante principal: `Consentimiento informado`

### Pasos exactos para esta prueba

1. Busca `CASE-20260514-M5L0I` en `Casos`.
2. Abre el detalle y confirma que el faltante es `Consentimiento informado`.
3. Ve a `Subir documento`.
4. Selecciona:
   - caso: `CASE-20260514-M5L0I`
   - tipo documental: `Consentimiento informado`
5. Sube el PDF generado para esta prueba.
6. Guarda el documento.
7. Regresa al detalle del caso.
8. Presiona `Procesar caso`.
9. Valida el resultado y la explicación del modal.

## PDFs de prueba generados para ese caso

Se dejaron estos archivos en:

[generated-documents/CASE-20260514-M5L0I](</C:/Users/ACER NITRO V15/Documents/GitHub/surgIAuthPD/generated-documents/CASE-20260514-M5L0I>)

Archivos:

- `consentimiento-informado.pdf`
- `guia-de-prueba-del-caso.pdf`

Uso recomendado:

- `consentimiento-informado.pdf`
  Súbelo al expediente para cubrir el faltante real.
- `guia-de-prueba-del-caso.pdf`
  Compártelo con cualquier persona que vaya a probar el sistema para que siga el flujo sin perderse.

## Qué no subir al repositorio

El `.gitignore` ya está preparado para excluir:

- `.env.local`
- `node_modules`
- `.next`
- logs
- archivos temporales
- PDFs generados dentro de `generated-documents/`

Se conserva únicamente `generated-documents/README.md` como referencia.

## Próximas mejoras recomendadas

1. Terminar de ordenar la arquitectura hacia `features` y `shared`.
2. Mejorar la taxonomía de diagnósticos y procedimientos.
3. Añadir más plantillas de PDF por tipo documental.
4. Incorporar trazabilidad de eventos por caso.
5. Reintroducir IA externa solo cuando la cuenta y la cuota estén listas para producción.
