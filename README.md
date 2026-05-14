# SurgiAuth

SurgiAuth resuelve el cuello de botella de preautorizacion quirurgica entre hospital y aseguradora.

Recibe un caso clinico en Notion, consulta la poliza del paciente, extrae datos clave del informe medico con IA y aplica reglas de negocio para devolver una salida clara:

- `Preaprobado`
- `Pendiente por documentos`
- `Rechazado por exclusion`
- `Revision manual`

## Flujo del MVP

`Notion -> leer caso -> leer poliza -> Gemini extrae -> motor de reglas decide -> actualizar Notion -> dashboard`

Notas del MVP:

- No login
- No OCR
- No base de datos adicional
- No ejecucion automatica de IA al abrir detalle

## Bases de Notion

### Base 1: `Casos Quirurgicos`

- `case_id` (`title`)
- `paciente` (`rich_text`)
- `documento_identidad` (`rich_text`)
- `policy_id` (`rich_text`)
- `diagnostico` (`rich_text`)
- `procedimiento_solicitado` (`rich_text`)
- `fecha_solicitud` (`date`)
- `informe_medico` (`rich_text`)
- `documentos_presentados` (`multi_select`)
- `estado` (`status` o `select`)
- `resultado_final` (`select` o `rich_text`)
- `motivo_decision` (`rich_text`)
- `documentos_faltantes` (`rich_text` o `multi_select`)
- `confianza_extraccion` (`number`)
- `fecha_procesamiento` (`date`)

### Base 2: `Polizas`

- `policy_id` (`title`)
- `aseguradora` (`rich_text`)
- `plan` (`rich_text`)
- `fecha_inicio` (`date`)
- `procedimientos_cubiertos` (`multi_select`)
- `exclusiones` (`multi_select`)
- `dias_carencia` (`number`)
- `documentos_requeridos` (`multi_select`)
- `reglas_especiales` (`rich_text`)

## Variables de entorno

Crear `.env.local`:

```env
NOTION_TOKEN=
NOTION_CASES_DATA_SOURCE_ID=
NOTION_POLICIES_DATA_SOURCE_ID=
NOTION_DOCUMENTS_DATA_SOURCE_ID=
GEMINI_API_KEY=
```

`NOTION_DOCUMENTS_DATA_SOURCE_ID` es opcional y no bloquea el flujo principal.

## Ejecutar local

```bash
npm install
npm run dev
```

Validacion de calidad:

```bash
npm run lint
npm run build
```

## Como probar los 4 casos demo

1. Abrir `/cases`.
2. Elegir `CASE-001`, `CASE-002`, `CASE-003` o `CASE-004`.
3. Entrar al detalle y presionar `Procesar caso con IA`.
4. Verificar resultado en UI y en Notion (`estado`, `resultado_final`, `motivo_decision`, `documentos_faltantes`, `confianza_extraccion`, `fecha_procesamiento`).

## Reglas de decision

Orden aplicado:

1. Sin poliza -> `Revision manual`
2. Confianza IA < `0.75` -> `Revision manual`
3. Procedimiento en exclusiones -> `Rechazado por exclusion`
4. Faltan documentos requeridos -> `Pendiente por documentos`
5. No cubierto -> `Revision manual`
6. No cumple carencia -> `Revision manual`
7. Si todo cumple -> `Preaprobado`

Carencia:

- inicio: `Polizas.fecha_inicio`
- solicitud: `Casos Quirurgicos.fecha_solicitud`
- cumple cuando `dias_transcurridos >= dias_carencia`

## Deploy en Vercel

1. Subir repo a GitHub.
2. Crear proyecto en Vercel e importar repo.
3. Configurar las mismas variables de entorno.
4. Deploy.
5. Probar `POST /api/process-case` y pantalla `/cases`.
