# SurgiAuth

## Descripcion

SurgiAuth es un agente de pre-autorizacion quirurgica en tiempo real. Su objetivo es recibir un informe medico digital generado por un hospital y la poliza del paciente registrada por la aseguradora, analizar si el procedimiento esta cubierto, validar requisitos de carencia y emitir una respuesta inmediata.

La salida del sistema debe ser una de estas cuatro:

- `Preaprobado`
- `Pendiente por documentos`
- `Rechazado por exclusion`
- `Revision manual`

La idea del proyecto es resolver el flujo minimo que pide el reto, sin agregar modulos innecesarios en la primera etapa.

## Objetivo del MVP

La primera version debe cumplir exactamente con este flujo:

1. El hospital registra una solicitud quirurgica.
2. La aseguradora tiene la poliza del paciente cargada en Notion.
3. El sistema analiza el informe medico.
4. El sistema consulta la poliza.
5. El sistema valida cobertura, carencia y documentos requeridos.
6. El sistema responde de forma instantanea con una preaprobacion o con una solicitud de documentos faltantes.

No se busca en esta fase resolver todos los casos reales del sector salud. Se busca una solucion clara, demostrable y bien delimitada.

## Alcance inicial

El MVP incluira:

- Registro de casos quirurgicos
- Consulta de polizas desde Notion
- Extraccion de informacion del informe medico con IA
- Motor de reglas para decidir cobertura
- Actualizacion del resultado en Notion
- Panel simple para visualizar casos y decisiones

No incluira en la primera etapa:

- Integracion con aseguradoras reales
- OCR avanzado para documentos escaneados complejos
- Firma electronica
- Multi-tenant empresarial
- Sistema completo de auditoria legal
- Integracion con HIS o ERP hospitalarios reales

## Stack recomendado

La recomendacion para este proyecto es usar `Next.js` con `React` y `TypeScript`.

### Por que Next.js

Este proyecto no necesita solo una interfaz. Necesita tambien backend, integracion con APIs, procesamiento de documentos y un flujo de negocio centralizado. `Next.js` permite resolver todo eso en un solo repositorio y con una sola base tecnica.

Ventajas para este caso:

- Permite construir frontend y backend en el mismo proyecto
- Facilita crear endpoints para procesar casos
- Se integra bien con Notion API y OpenAI API
- Se despliega rapido
- Escala bien para pasar de MVP a producto

### Tecnologias propuestas

- `Next.js`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Notion API`
- `OpenAI API`
- `Zod` para validaciones
- `Vercel` para despliegue del MVP

## Base de datos: relacional o no relacional

Para este proyecto hay que separar dos cosas: la base operativa del MVP y la base ideal para una version mas madura.

### En el MVP

La base principal operativa sera `Notion`, porque el enunciado pide que el informe medico y la poliza del paciente esten en una base de datos de Notion.

Desde un punto de vista tecnico, **Notion no es una base de datos relacional tradicional**. Es una base orientada a paginas y propiedades, con relaciones entre registros, pero no funciona como un motor relacional como PostgreSQL o MySQL.

Entonces, para el MVP:

- La fuente operativa principal sera `Notion`
- El modelo se comporta mas como una solucion semiestructurada o no relacional
- Se pueden usar relaciones entre bases de Notion, pero no reemplazan una base relacional completa

### En una version posterior

Si el proyecto crece y necesita trazabilidad fuerte, auditoria, historico de decisiones, permisos avanzados y mejor rendimiento, lo recomendable es agregar una base `relacional`, idealmente `PostgreSQL`.

### Decision recomendada

Para cumplir el reto al pie de la letra:

- `Notion` en el MVP
- `PostgreSQL` como evolucion natural cuando el proyecto madure

## Arquitectura funcional

El sistema se divide en cuatro bloques.

### 1. Ingreso del caso

El hospital registra o envia:

- Datos del paciente
- Diagnostico
- Procedimiento solicitado
- Informe medico digital
- Fecha de solicitud

Ese caso se guarda en Notion y queda listo para ser procesado.

### 2. Consulta de poliza

El sistema busca la poliza del paciente en Notion y recupera:

- Plan
- Procedimientos cubiertos
- Exclusiones
- Dias de carencia
- Documentos obligatorios
- Reglas especiales

### 3. Analisis del informe medico

La IA se usa para leer el informe y extraer informacion util. No debe ser quien decida la aprobacion por si sola.

La IA debe devolver campos estructurados como:

- Procedimiento identificado
- Diagnostico principal
- Nivel de urgencia
- Medico tratante
- Documentos detectados
- Documentos faltantes
- Confianza de extraccion

### 4. Motor de decision

La decision final debe vivir en codigo, no en texto libre generado por la IA.

El motor evaluara:

- Si la poliza existe
- Si el procedimiento esta cubierto
- Si existe una exclusion
- Si se cumple la carencia
- Si faltan documentos
- Si la confianza de extraccion es suficiente

Con eso devolvera un estado final y una justificacion clara.

## Regla central del proyecto

La IA interpreta y estructura informacion. La logica del negocio decide.

Esto es importante por tres razones:

- Reduce errores
- Hace el sistema auditable
- Permite explicar por que un caso fue aprobado o rechazado

## Estados del sistema

Se recomienda manejar solo estos estados en la primera version:

- `Nuevo`
- `En analisis`
- `Preaprobado`
- `Pendiente por documentos`
- `Rechazado por exclusion`
- `Revision manual`

Con esto es suficiente para una demo funcional y entendible.

## Logica minima de negocio

La logica inicial puede ser esta:

- Si no existe poliza asociada, el caso pasa a `Revision manual`
- Si falta el informe medico o un documento obligatorio, el caso pasa a `Pendiente por documentos`
- Si el procedimiento esta en exclusiones, el caso pasa a `Rechazado por exclusion`
- Si no cumple dias de carencia, el caso pasa a `Revision manual` o `Rechazado`, segun la regla definida
- Si el procedimiento esta cubierto y cumple reglas, el caso pasa a `Preaprobado`
- Si la IA no puede extraer con confianza suficiente, el caso pasa a `Revision manual`

## Estructura recomendada en Notion

Se proponen tres bases principales.

### 1. Casos Quirurgicos

Campos sugeridos:

- `case_id`
- `paciente`
- `documento_identidad`
- `aseguradora`
- `policy_id`
- `diagnostico`
- `procedimiento_solicitado`
- `fecha_solicitud`
- `estado`
- `resultado_final`
- `motivo_decision`
- `documentos_faltantes`
- `confianza_extraccion`

### 2. Polizas

Campos sugeridos:

- `policy_id`
- `aseguradora`
- `plan`
- `procedimientos_cubiertos`
- `exclusiones`
- `dias_carencia`
- `documentos_requeridos`
- `reglas_especiales`

### 3. Documentos

Campos sugeridos:

- `document_id`
- `case_id`
- `tipo_documento`
- `archivo_url`
- `estado_documento`
- `texto_extraido`

## Flujo tecnico del sistema

1. Un usuario carga o registra un caso quirurgico.
2. El sistema crea el registro en Notion.
3. El backend toma el caso para procesarlo.
4. Se consulta la poliza del paciente en Notion.
5. Se envia el informe medico a OpenAI para extraer datos estructurados.
6. El motor de reglas evalua cobertura, carencia y faltantes.
7. El resultado se escribe de vuelta en Notion.
8. El panel muestra el estado final del caso.

## Arquitectura tecnica recomendada

### Frontend

Panel administrativo con estas vistas minimas:

- Lista de casos
- Detalle de un caso
- Estado de decision
- Resultado y motivo

### Backend

API interna para:

- Crear casos
- Procesar casos
- Consultar polizas
- Actualizar resultados
- Recibir eventos desde Notion si luego se usan webhooks

### IA

La IA debe trabajar con salida estructurada para evitar respuestas ambiguas. No se debe usar para devolver un texto largo sin esquema.

### Reglas

Las reglas del negocio deben estar separadas en modulos claros y faciles de probar.

## Estructura sugerida del proyecto

```text
surgIAuthPD/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ cases/
│  │  │  ├─ process-case/
│  │  │  └─ notion/
│  │  ├─ dashboard/
│  │  └─ page.tsx
│  ├─ components/
│  ├─ lib/
│  │  ├─ notion.ts
│  │  ├─ openai.ts
│  │  └─ validators.ts
│  ├─ rules/
│  │  └─ coverage.ts
│  ├─ types/
│  └─ utils/
├─ .env.local
├─ package.json
└─ README.md
```

## Modulos principales

### `lib/notion.ts`

Encargado de:

- Leer casos
- Leer polizas
- Crear registros
- Actualizar decisiones

### `lib/openai.ts`

Encargado de:

- Enviar el informe medico
- Solicitar extraccion estructurada
- Devolver JSON validado

### `rules/coverage.ts`

Encargado de:

- Aplicar reglas de cobertura
- Validar carencia
- Detectar exclusiones
- Generar resultado final

### `app/api/process-case`

Encargado de:

- Orquestar todo el flujo
- Consultar caso
- Consultar poliza
- Llamar IA
- Ejecutar reglas
- Persistir resultado

## Pantallas minimas del MVP

### Dashboard principal

Debe mostrar:

- Total de casos
- Casos pendientes
- Casos preaprobados
- Casos en revision

### Lista de casos

Debe mostrar:

- Paciente
- Procedimiento
- Aseguradora
- Estado
- Fecha

### Detalle del caso

Debe mostrar:

- Informe medico resumido
- Datos extraidos por IA
- Poliza aplicada
- Resultado de la evaluacion
- Motivo de la decision

## Integraciones necesarias

### Notion API

Se usara para:

- Leer y actualizar las bases de datos
- Guardar casos
- Consultar polizas

### OpenAI API

Se usara para:

- Interpretar el informe medico
- Extraer datos clinicos relevantes
- Generar respuestas estructuradas y consistentes

## Seguridad minima recomendada

Aunque el MVP sea simple, conviene contemplar desde el inicio:

- Variables de entorno para claves
- No exponer secretos en frontend
- Registrar decisiones importantes
- Separar claramente datos del paciente y resultado del analisis

## Roadmap de construccion

### Fase 1. Base del proyecto

- Crear proyecto con Next.js y TypeScript
- Configurar Tailwind
- Configurar variables de entorno
- Preparar estructura de carpetas

### Fase 2. Notion como fuente operativa

- Crear bases en Notion
- Conectar Notion API
- Probar lectura y escritura de casos y polizas

### Fase 3. Analisis del informe medico

- Definir esquema de salida
- Conectar OpenAI API
- Validar extraccion estructurada

### Fase 4. Motor de reglas

- Implementar reglas de cobertura
- Implementar validacion de carencia
- Implementar manejo de documentos faltantes

### Fase 5. Interfaz

- Crear dashboard
- Crear lista de casos
- Crear vista de detalle

### Fase 6. Cierre del MVP

- Probar casos simulados
- Ajustar mensajes
- Dejar la demo lista para presentar

## Casos de prueba recomendados

Para la primera demo conviene tener al menos estos escenarios:

- Caso cubierto y completo: debe terminar en `Preaprobado`
- Caso con documento faltante: debe terminar en `Pendiente por documentos`
- Caso con exclusion: debe terminar en `Rechazado por exclusion`
- Caso ambiguo o con poca confianza: debe terminar en `Revision manual`

## Criterio de exito

El proyecto estara bien resuelto si logra demostrar lo siguiente:

- Recibe un caso quirurgico
- Consulta una poliza en Notion
- Analiza el informe medico con IA
- Aplica reglas claras
- Emite una respuesta inmediata y explicable

## Conclusion

La mejor forma de construir SurgiAuth en esta etapa es con una arquitectura simple, demostrable y enfocada. La recomendacion es desarrollar el MVP con `Next.js`, usar `Notion` como base operativa porque asi lo pide el reto, apoyarse en `OpenAI` para interpretar el informe medico y dejar la decision final en un motor de reglas escrito en codigo.

En resumen:

- Frontend y backend con `Next.js`
- Base operativa en `Notion`
- IA para extraccion, no para decidir por si sola
- Reglas de negocio en codigo
- Alcance controlado y listo para demo
