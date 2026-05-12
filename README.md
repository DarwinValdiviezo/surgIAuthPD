# SurgiAuth

## Descripcion

SurgiAuth es un agente de pre-autorizacion quirurgica en tiempo real. El objetivo del MVP es recibir un caso quirurgico, consultar la poliza del paciente en Notion, evaluar cobertura, carencia y documentos faltantes, y devolver una respuesta inmediata y explicable.

Estados de salida contemplados en esta fase:

- `Preaprobado`
- `Pendiente por documentos`
- `Rechazado por exclusion`
- `Revision manual`

## Stack elegido

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Notion API`
- `OpenAI API` como siguiente integracion

La base operativa del MVP es `Notion`. A nivel tecnico no se comporta como una base relacional tradicional. Para una version futura mas robusta, la evolucion natural seria `PostgreSQL`.

## Objetivo del MVP

La primera version debe cumplir este flujo:

1. Registrar o leer un caso quirurgico.
2. Consultar la poliza asociada en Notion.
3. Extraer informacion util del caso.
4. Aplicar reglas de cobertura, carencia, exclusiones y documentos requeridos.
5. Escribir la decision de vuelta en Notion.
6. Mostrar el resultado en un dashboard.

## Lo que ya se implemento

En esta rama ya existe una base funcional del proyecto con:

- `Next.js + TypeScript + Tailwind`
- Dashboard inicial en `/dashboard`
- Endpoint `GET/POST /api/process-case`
- Endpoint `GET /api/notion/health`
- Tipos base del dominio
- Motor de reglas inicial
- Integracion con Notion
- Integracion base con Gemini 2.5 Flash para extraccion estructurada
- Fallback a mocks si Notion no esta configurado o falla

## Estructura actual

```text
surgIAuthPD/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ notion/health/route.ts
│  │  │  └─ process-case/route.ts
│  │  ├─ dashboard/page.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ case-card.tsx
│  │  └─ status-badge.tsx
│  ├─ lib/
│  │  ├─ case-service.ts
│  │  ├─ extraction.ts
│  │  ├─ mock-data.ts
│  │  └─ notion.ts
│  ├─ rules/
│  │  └─ coverage.ts
│  └─ types/
│     └─ domain.ts
├─ .env.example
├─ .env.local
├─ package.json
└─ README.md
```

## Motor de reglas actual

La decision final vive en codigo, no en texto generado libremente por IA.

Reglas actualmente implementadas:

- Validacion de existencia de poliza
- Validacion de confianza minima de extraccion
- Validacion de documentos faltantes con equivalencias y alias
- Validacion de exclusiones
- Validacion de cobertura exacta, parcial y por categoria quirurgica
- Validacion de carencia usando `policyStartDate` y `waitingPeriodDays`

Escenarios mock ya cubiertos:

- Caso cubierto y completo
- Caso con documentos faltantes
- Caso rechazado por exclusion
- Caso que cae en revision manual por carencia

## Configuracion local

Instalar dependencias:

```powershell
npm.cmd install
```

Levantar el proyecto:

```powershell
npm.cmd run dev
```

Construccion de prueba:

```powershell
npm.cmd run build
```

Lint:

```powershell
npm.cmd run lint
```

## Variables de entorno

Archivo `.env.local`:

```env
NOTION_TOKEN=
NOTION_CASES_DATA_SOURCE_ID=
NOTION_POLICIES_DATA_SOURCE_ID=
NOTION_DOCUMENTS_DATA_SOURCE_ID=
GEMINI_API_KEY=
```

Si `GEMINI_API_KEY` no esta configurada o Gemini falla, el proyecto usa una extraccion mock como respaldo.

La UI del dashboard y del detalle de caso no dispara Gemini automaticamente. La llamada al modelo se reserva para el procesamiento explicito del caso, con el fin de evitar costos, timeouts y consumo innecesario de cuota.

## Configuracion de Notion

### Resumen de lo que se hizo

Se crearon dos bases de datos en Notion:

- `Casos Quirurgicos`
- `Polizas`

Luego se creo una conexion interna llamada `SurgiAuth`, se le dio acceso a ambas bases y se configuraron los IDs en `.env.local`.

### Nota importante sobre los IDs

En las URLs de Notion, el primer bloque largo corresponde al `database_id`, no siempre al `data_source_id`. El proyecto ya resuelve eso automaticamente.

Esto significa que en `.env.local` puedes colocar el ID que copias desde la URL de la base, y el backend se encarga de obtener el `data_source_id` real antes de consultar filas.

## Paso a paso para crear las bases en Notion

### Base 1: Casos Quirurgicos

Crear una base de datos tipo tabla con estas propiedades exactas:

- `case_id` -> `Title`
- `paciente` -> `Text`
- `aseguradora` -> `Text`
- `policy_id` -> `Text`
- `inicio_poliza` -> `Date`
- `diagnostico` -> `Text`
- `procedimiento_solicitado` -> `Text`
- `fecha_solicitud` -> `Date`
- `documentos_presentados` -> `Multi-select`
- `urgente` -> `Checkbox`
- `estado` -> `Status`
- `resultado_final` -> `Text`
- `motivo_decision` -> `Text`
- `documentos_faltantes` -> `Multi-select`
- `confianza_extraccion` -> `Number`

Opciones recomendadas para `estado`:

- `Nuevo`
- `En analisis`
- `Preaprobado`
- `Pendiente por documentos`
- `Rechazado por exclusion`
- `Revision manual`

### Base 2: Polizas

Crear una base de datos tipo tabla con estas propiedades exactas:

- `policy_id` -> `Title`
- `aseguradora` -> `Text`
- `procedimientos_cubiertos` -> `Multi-select`
- `exclusiones` -> `Multi-select`
- `dias_carencia` -> `Number`
- `documentos_requeridos` -> `Multi-select`

## Prompts usados para crear las bases con Notion AI

### Prompt para Casos Quirurgicos

```text
Crea una base de datos tipo tabla llamada Casos Quirurgicos para un sistema de preautorizacion quirurgica.

Necesito estas columnas exactas y con estos tipos:

- case_id: titulo
- paciente: texto
- aseguradora: texto
- policy_id: texto
- inicio_poliza: fecha
- diagnostico: texto
- procedimiento_solicitado: texto
- fecha_solicitud: fecha
- documentos_presentados: seleccion multiple
- urgente: casilla de verificacion
- estado: estado
- resultado_final: texto
- motivo_decision: texto
- documentos_faltantes: seleccion multiple
- confianza_extraccion: numero

En la propiedad estado crea estas opciones exactas:
Nuevo
En analisis
Preaprobado
Pendiente por documentos
Rechazado por exclusion
Revision manual

No agregues columnas extra. No cambies los nombres. Usa exactamente esos nombres.
```

### Prompt para Polizas

```text
Crea una base de datos tipo tabla llamada Polizas para un sistema de preautorizacion quirurgica.

Necesito estas columnas exactas y con estos tipos:

- policy_id: titulo
- aseguradora: texto
- procedimientos_cubiertos: seleccion multiple
- exclusiones: seleccion multiple
- dias_carencia: numero
- documentos_requeridos: seleccion multiple

No agregues columnas extra. No cambies los nombres. Usa exactamente esos nombres.
```

## Conexion interna en Notion

### Pasos realizados

1. Abrir el panel de conexiones internas de Notion.
2. Crear una conexion interna llamada `SurgiAuth`.
3. Copiar el token de acceso de la conexion.
4. Dar acceso a `Casos Quirurgicos` y `Polizas` desde la pestaña de acceso al contenido.

### Seguridad

Si el token se expone en el chat, en capturas o en commits, debe regenerarse inmediatamente.

## Como obtener los IDs desde Notion

Abrir la base en Notion y copiar la URL.

Ejemplo:

```text
https://www.notion.so/35e1c005c8cc8090bea1cd5327817512?v=35e1c005c8cc801e97f8000c473808df&source=copy_link
```

El valor que se usa en `.env.local` es el primer bloque largo:

```env
NOTION_CASES_DATA_SOURCE_ID=35e1c005c8cc8090bea1cd5327817512
```

El valor `v=` corresponde a la vista, no a la base.

## Comprobacion de conexion con Notion

Una vez configurado `.env.local`, se puede probar:

```text
http://localhost:3000/api/notion/health
```

Respuesta esperada cuando todo esta bien:

```json
{
  "ok": true,
  "mode": "notion",
  "config": {
    "configured": true,
    "hasToken": true,
    "hasCasesDataSource": true,
    "hasPoliciesDataSource": true,
    "hasDocumentsDataSource": false
  },
  "message": "La conexion con Notion esta lista.",
  "counts": {
    "cases": 4,
    "policies": 4
  }
}
```

## Problema que aparecio y como se resolvio

### Problema

Al consultar `Polizas`, Notion devolvia `object_not_found` aunque el ID se habia copiado desde la URL.

### Causa

Notion separa `database_id` y `data_source_id`. La URL entrega el `database_id`, pero el query de filas usa `data_source_id`.

### Solucion aplicada

Se actualizo [src/lib/notion.ts](C:\Users\ACER NITRO V15\Documents\GitHub\surgIAuthPD\src\lib\notion.ts) para:

- recibir el ID de la URL
- consultar la base con `notion.databases.retrieve`
- extraer el `data_source_id`
- ejecutar luego `notion.dataSources.query`

Con eso ya no es necesario buscar manualmente el `data_source_id` en la interfaz de Notion.

## Endpoints disponibles

### `GET /api/notion/health`

Sirve para validar si la conexion con Notion esta lista.

### `GET /api/process-case`

Devuelve un mensaje de ayuda y un ejemplo de payload.

### `POST /api/process-case`

Procesa un caso.

Payload:

```json
{
  "caseId": "CQ-2026-001"
}
```

Lo que hace:

1. busca el caso en Notion
2. busca la poliza asociada
3. ejecuta la extraccion inicial
4. aplica reglas de negocio
5. actualiza la decision en la pagina del caso

## Campos que actualiza en Notion

Cuando se procesa un caso, se actualizan estos campos de `Casos Quirurgicos`:

- `estado`
- `resultado_final`
- `motivo_decision`
- `documentos_faltantes`
- `confianza_extraccion`

## Flujo de prueba recomendado

1. Levantar la app con `npm.cmd run dev`
2. Probar `GET /api/notion/health`
3. Abrir `/dashboard`
4. Ejecutar `POST /api/process-case` con un `case_id` real
5. Verificar que la decision se escriba en Notion

## Progreso real del desarrollo

### Etapa 1

- Se creo el `README` inicial del proyecto
- Se definio el stack principal
- Se crearon ramas separadas para trabajo del equipo

### Etapa 2

- Se monto la base de `Next.js`
- Se creo la estructura del proyecto
- Se implemento el dashboard inicial
- Se agrego el endpoint base para procesamiento

### Etapa 3

- Se implementaron tipos de dominio
- Se agregaron mocks
- Se construyo el motor de reglas
- Se validaron cobertura, exclusiones, faltantes y carencia

### Etapa 4

- Se integro Notion
- Se agrego `GET /api/notion/health`
- Se implemento lectura de casos y polizas
- Se implemento escritura de decisiones en casos
- Se resolvio el manejo de `database_id` y `data_source_id`

### Etapa 5

- Se mejoro la logica de cobertura para aceptar categorias quirurgicas como `Cirugia General`
- Se agrego una taxonomia inicial de procedimientos hacia categorias
- Se mejoro el cruce de documentos requeridos contra documentos presentados usando alias y equivalencias

### Etapa 6

- Se agrego una integracion base con `Gemini 2.5 Flash`
- La extraccion de procedimiento, diagnostico y faltantes puede venir de Gemini
- Se dejo fallback a extraccion mock cuando la clave no existe o la llamada falla

## Siguiente paso recomendado

El siguiente bloque de trabajo recomendado es:

1. Probar `POST /api/process-case` con casos reales
2. Ajustar los datos reales de Notion para que produzcan decisiones consistentes
3. Reemplazar la extraccion mock por Gemini u OpenAI
4. Mejorar la UI del detalle de caso

## Nota de seguridad

Si una clave de API o token se expone en chat, capturas, commits o archivos compartidos, debe regenerarse de inmediato y reemplazarse en `.env.local`.

## Referencias tecnicas

- [Working with databases](https://developers.notion.com/guides/data-apis/working-with-databases)
- [Retrieve a database](https://developers.notion.com/reference/retrieve-a-database)
- [Query a data source](https://developers.notion.com/reference/query-a-data-source)
- [Internal integrations](https://developers.notion.com/guides/get-started/internal-integrations)
