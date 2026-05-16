import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "@notionhq/client";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const OUTPUT_ROOT = path.join(process.cwd(), "generated-documents");
const FONT_PATH = "C:\\Windows\\Fonts\\arial.ttf";
const FONT_BOLD_PATH = "C:\\Windows\\Fonts\\arialbd.ttf";
const TODAY = "2026-05-14";

const CANONICAL_DOCUMENT_LABELS = {
  "historia clinica": "Historia clínica",
  "orden medica": "Orden médica",
  "consentimiento informado": "Consentimiento informado",
  "examenes preoperatorios": "Exámenes preoperatorios",
  "valoracion anestesica": "Valoración anestésica",
  "valoracion preanestesica": "Valoración preanestésica",
  "estudios de imagenes": "Estudios de imágenes",
  "imagenes diagnosticas": "Imágenes diagnósticas",
  "resultados de laboratorio": "Resultados de laboratorio",
  "examenes de laboratorio": "Exámenes de laboratorio",
  "cedula del paciente": "Cédula del paciente",
  "carnet de aseguradora": "Carnet de aseguradora",
};

const KNOWN_TEXT_REPAIRS = {
  "orden medica": "Orden médica",
  "historia clinica": "Historia clínica",
  "valoracion anestesica": "Valoración anestésica",
  "valoracion preanestesica": "Valoración preanestésica",
  "imagenes diagnosticas": "Imágenes diagnósticas",
  "examenes de laboratorio": "Exámenes de laboratorio",
  "cedula del paciente": "Cédula del paciente",
  "estudios de imagenes": "Estudios de imágenes",
  "examenes preoperatorios": "Exámenes preoperatorios",
};

function loadEnv(filePath) {
  return fs.readFile(filePath, "utf8").then((content) => {
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        continue;
      }

      process.env[match[1]] = match[2].trim();
    }
  });
}

function repairText(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  const knownRepair = KNOWN_TEXT_REPAIRS[text.toLowerCase()];
  if (knownRepair) {
    return knownRepair;
  }

  if (/[ÃÂâ€™â€œâ€â€\?]/.test(text)) {
    try {
      const repaired = Buffer.from(text, "latin1").toString("utf8").trim();
      if (repaired) {
        return repaired;
      }
    } catch {
      return text;
    }
  }

  return text;
}

function normalizeText(value) {
  return repairText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeFileName(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function title(property) {
  return repairText(property?.title?.map((item) => item.plain_text).join("").trim() || "");
}

function richText(property) {
  return repairText(property?.rich_text?.map((item) => item.plain_text).join("").trim() || "");
}

function multiSelect(property) {
  return (property?.multi_select?.map((item) => canonicalDocumentLabel(item.name)) || []).filter(Boolean);
}

function canonicalDocumentLabel(value) {
  const repaired = repairText(value);
  const normalized = normalizeText(repaired);
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  if (CANONICAL_DOCUMENT_LABELS[normalized]) {
    return CANONICAL_DOCUMENT_LABELS[normalized];
  }

  if (compact.includes("historia") && compact.includes("clnic")) {
    return "Historia clínica";
  }

  if (compact.includes("orden") && compact.includes("dica")) {
    return "Orden médica";
  }

  if (normalized.includes("consentimiento")) {
    return "Consentimiento informado";
  }

  if (compact.includes("preoperator")) {
    return "Exámenes preoperatorios";
  }

  if (compact.includes("valor") && compact.includes("anest")) {
    if (compact.includes("preanest")) {
      return "Valoración preanestésica";
    }

    return "Valoración anestésica";
  }

  if (compact.includes("estudios") && compact.includes("imgen")) {
    return "Estudios de imágenes";
  }

  if (compact.includes("imgen") && compact.includes("diagn")) {
    return "Imágenes diagnósticas";
  }

  if (normalized.includes("resultados") && normalized.includes("laboratorio")) {
    return "Resultados de laboratorio";
  }

  if (normalized.includes("laboratorio")) {
    return "Exámenes de laboratorio";
  }

  if (compact.includes("dula") && compact.includes("paciente")) {
    return "Cédula del paciente";
  }

  if (normalized.includes("carnet") && normalized.includes("aseguradora")) {
    return "Carnet de aseguradora";
  }

  return repaired;
}

async function resolveDataSourceId(notion, configuredId) {
  try {
    const database = await notion.databases.retrieve({ database_id: configuredId });
    return database.data_sources[0].id;
  } catch {
    return configuredId;
  }
}

function buildDocumentSections(documentType, context) {
  const normalizedType = normalizeText(documentType);

  const sections = [
    {
      label: "Resumen del caso",
      body: `Paciente ${context.patientName}, asegurado por ${context.insurerName} bajo la póliza ${context.policyId}, con diagnóstico de ${context.diagnosis}. Se solicita ${context.requestedProcedure}.`,
    },
  ];

  if (normalizedType.includes("historia clinica")) {
    sections.push(
      {
        label: "Evolución clínica",
        body: `Se documenta la evolución clínica reciente del paciente, con signos y síntomas concordantes con ${context.diagnosis}. La valoración médica respalda la conducta quirúrgica propuesta.`,
      },
      {
        label: "Impresión diagnóstica",
        body: `Con base en el examen clínico y la información disponible, se considera indicada la realización de ${context.requestedProcedure}.`,
      },
    );
  } else if (normalizedType.includes("orden medica")) {
    sections.push(
      {
        label: "Orden del procedimiento",
        body: `Por medio del presente documento se ordena ${context.requestedProcedure} para el paciente ${context.patientName}.`,
      },
      {
        label: "Justificación médica",
        body: `La orden se fundamenta en el diagnóstico de ${context.diagnosis} y en la valoración del servicio tratante, que recomienda resolución quirúrgica.`,
      },
    );
  } else if (normalizedType.includes("consentimiento informado")) {
    sections.push(
      {
        label: "Información entregada",
        body: `Se explican al paciente los objetivos, beneficios, riesgos, posibles complicaciones y alternativas del procedimiento ${context.requestedProcedure}.`,
      },
      {
        label: "Manifestación de aceptación",
        body: "El paciente deja constancia de haber comprendido la información suministrada y autoriza el procedimiento de manera libre y voluntaria.",
      },
    );
  } else if (normalizedType.includes("examenes preoperatorios")) {
    sections.push(
      {
        label: "Soporte preoperatorio",
        body: "Se anexan exámenes preoperatorios requeridos para la preparación quirúrgica y la valoración integral del riesgo perioperatorio.",
      },
      {
        label: "Contenido esperado",
        body: "Incluye hemograma, química sanguínea básica y pruebas de coagulación, según criterio del equipo médico.",
      },
    );
  } else if (normalizedType.includes("valoracion anestesica") || normalizedType.includes("preanestesica")) {
    sections.push(
      {
        label: "Valoración anestésica",
        body: `Se realiza evaluación preanestésica del paciente ${context.patientName}, revisando antecedentes, estado general y condiciones para ${context.requestedProcedure}.`,
      },
      {
        label: "Conclusión",
        body: "No se identifican contraindicaciones mayores para continuar el trámite de autorización y la programación del procedimiento, sujeto a confirmación final del especialista.",
      },
    );
  } else if (normalizedType.includes("estudios de imagenes") || normalizedType.includes("imagenes diagnosticas")) {
    sections.push(
      {
        label: "Soporte imagenológico",
        body: `Se adjuntan estudios de imágenes relacionados con ${context.diagnosis}, como soporte objetivo para la indicación de ${context.requestedProcedure}.`,
      },
      {
        label: "Utilidad clínica",
        body: "Los hallazgos complementan la evaluación médica y fortalecen la justificación del manejo quirúrgico solicitado.",
      },
    );
  } else if (normalizedType.includes("resultados de laboratorio")) {
    sections.push(
      {
        label: "Resultados de laboratorio",
        body: `Se registran resultados de laboratorio del paciente ${context.patientName} como parte del soporte prequirúrgico del caso ${context.caseId}.`,
      },
      {
        label: "Interpretación",
        body: "Los exámenes se aportan para valoración médica y administrativa dentro del expediente clínico y de autorización.",
      },
    );
  } else if (normalizedType.includes("cedula del paciente")) {
    sections.push(
      {
        label: "Identificación",
        body: `Se adjunta copia del documento de identidad del paciente ${context.patientName} para validación administrativa y confirmación de titularidad del caso.`,
      },
      {
        label: "Uso del documento",
        body: "Este soporte se utiliza para el cruce de datos del expediente, validación con la aseguradora y continuidad del trámite de preautorización.",
      },
    );
  } else if (normalizedType.includes("carnet de aseguradora")) {
    sections.push(
      {
        label: "Soporte de aseguramiento",
        body: `Se adjunta copia del carnet de la aseguradora ${context.insurerName}, vinculado a la póliza ${context.policyId}.`,
      },
      {
        label: "Uso del documento",
        body: "Este soporte permite validar elegibilidad, vigencia y datos administrativos del paciente ante la aseguradora.",
      },
    );
  } else {
    sections.push({
      label: "Descripción",
      body: `Documento de soporte correspondiente a ${documentType}, incorporado al expediente del caso ${context.caseId}.`,
    });
  }

  sections.push({
    label: "Observación",
    body: "Documento generado para demostración y pruebas funcionales del flujo hospitalario y asegurador en SurgiAuth.",
  });

  return sections;
}

function wrapText(font, text, size, maxWidth) {
  const words = repairText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

async function buildStyledPdf(documentType, context) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const [fontBytes, boldFontBytes] = await Promise.all([fs.readFile(FONT_PATH), fs.readFile(FONT_BOLD_PATH)]);
  const regularFont = await pdf.embedFont(fontBytes);
  const boldFont = await pdf.embedFont(boldFontBytes);

  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 42;
  const contentWidth = width - margin * 2;

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.985, 0.995),
  });

  page.drawRectangle({
    x: margin,
    y: height - 128,
    width: contentWidth,
    height: 90,
    color: rgb(0.05, 0.24, 0.38),
  });

  page.drawText("SurgiAuth", {
    x: margin + 22,
    y: height - 78,
    size: 23,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText("Documento clínico para pruebas del flujo de preautorización", {
    x: margin + 22,
    y: height - 98,
    size: 10,
    font: regularFont,
    color: rgb(0.85, 0.92, 0.98),
  });

  page.drawText(documentType, {
    x: margin + 22,
    y: height - 48,
    size: 16,
    font: boldFont,
    color: rgb(0.82, 0.95, 1),
  });

  const metadataTop = height - 164;
  const metadata = [
    ["Caso", context.caseId],
    ["Paciente", context.patientName],
    ["Aseguradora", context.insurerName],
    ["Póliza", context.policyId],
    ["Diagnóstico", context.diagnosis],
    ["Procedimiento", context.requestedProcedure],
    ["Fecha", TODAY],
  ];

  page.drawRectangle({
    x: margin,
    y: metadataTop - 128,
    width: contentWidth,
    height: 120,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.83, 0.88, 0.93),
    borderWidth: 1,
  });

  let metaY = metadataTop - 18;
  for (const [label, value] of metadata) {
    page.drawText(`${label}:`, {
      x: margin + 18,
      y: metaY,
      size: 10,
      font: boldFont,
      color: rgb(0.17, 0.27, 0.36),
    });

    const lines = wrapText(regularFont, value, 10, contentWidth - 120);
    let valueY = metaY;
    for (const line of lines) {
      page.drawText(line, {
        x: margin + 96,
        y: valueY,
        size: 10,
        font: regularFont,
        color: rgb(0.22, 0.28, 0.35),
      });
      valueY -= 12;
    }
    metaY -= Math.max(16, lines.length * 12 + 4);
  }

  const sections = buildDocumentSections(documentType, context);
  let cursorY = metadataTop - 160;

  for (const section of sections) {
    const lines = wrapText(regularFont, section.body, 10.5, contentWidth - 34);
    const boxHeight = 28 + lines.length * 14 + 18;

    if (cursorY - boxHeight < 60) {
      break;
    }

    page.drawRectangle({
      x: margin,
      y: cursorY - boxHeight,
      width: contentWidth,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.86, 0.9, 0.94),
      borderWidth: 1,
    });

    page.drawRectangle({
      x: margin,
      y: cursorY - 28,
      width: contentWidth,
      height: 28,
      color: rgb(0.9, 0.95, 0.99),
    });

    page.drawText(section.label, {
      x: margin + 16,
      y: cursorY - 18,
      size: 11,
      font: boldFont,
      color: rgb(0.07, 0.25, 0.39),
    });

    let lineY = cursorY - 46;
    for (const line of lines) {
      page.drawText(line, {
        x: margin + 16,
        y: lineY,
        size: 10.5,
        font: regularFont,
        color: rgb(0.18, 0.23, 0.29),
      });
      lineY -= 14;
    }

    cursorY -= boxHeight + 14;
  }

  page.drawText("Generado automáticamente para validación funcional del sistema.", {
    x: margin,
    y: 28,
    size: 9,
    font: regularFont,
    color: rgb(0.42, 0.48, 0.56),
  });

  return Buffer.from(await pdf.save());
}

async function main() {
  await loadEnv(path.join(process.cwd(), ".env.local"));

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const caseDataSourceId = await resolveDataSourceId(notion, process.env.NOTION_CASES_DATA_SOURCE_ID);
  const policyDataSourceId = await resolveDataSourceId(notion, process.env.NOTION_POLICIES_DATA_SOURCE_ID);
  const [casesResponse, policiesResponse] = await Promise.all([
    notion.dataSources.query({ data_source_id: caseDataSourceId }),
    notion.dataSources.query({ data_source_id: policyDataSourceId }),
  ]);

  const cases = casesResponse.results
    .filter((item) => item.object === "page")
    .map((page) => ({
      caseId: repairText(title(page.properties.case_id)),
      patientName: repairText(richText(page.properties.paciente)),
      insurerName: repairText(richText(page.properties.aseguradora)),
      policyId: repairText(richText(page.properties.policy_id)),
      diagnosis: repairText(richText(page.properties.diagnostico)),
      requestedProcedure: repairText(richText(page.properties.procedimiento_solicitado)),
    }));

  const policies = policiesResponse.results
    .filter((item) => item.object === "page")
    .map((page) => ({
      policyId: repairText(title(page.properties.policy_id)),
      requiredDocuments: multiSelect(page.properties.documentos_requeridos),
    }));

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  const manifest = [];

  for (const surgicalCase of cases) {
    const policy = policies.find((item) => item.policyId === surgicalCase.policyId);
    if (!policy) {
      continue;
    }

    const requiredDocuments = Array.from(
      new Set(policy.requiredDocuments.map((documentType) => canonicalDocumentLabel(documentType)).filter(Boolean)),
    );

    if (requiredDocuments.length === 0) {
      continue;
    }

    const caseDir = path.join(OUTPUT_ROOT, surgicalCase.caseId);
    await fs.mkdir(caseDir, { recursive: true });

    for (const documentType of requiredDocuments) {
      const pdfBuffer = await buildStyledPdf(documentType, surgicalCase);
      const fileName = `${sanitizeFileName(documentType)}.pdf`;
      const outputPath = path.join(caseDir, fileName);

      await fs.writeFile(outputPath, pdfBuffer);

      manifest.push({
        caseId: surgicalCase.caseId,
        patientName: surgicalCase.patientName,
        documentType,
        file: path.relative(process.cwd(), outputPath).replaceAll("\\", "/"),
      });
    }
  }

  const manifestLines = [
    "# Documentos PDF Generados",
    "",
    `Fecha: ${TODAY}`,
    "",
    ...manifest.map((item) => `- ${item.caseId} | ${item.patientName} | ${item.documentType} | ${item.file}`),
    "",
  ];

  await fs.writeFile(path.join(OUTPUT_ROOT, "README.md"), manifestLines.join("\n"), "utf8");

  console.log(JSON.stringify({ outputRoot: OUTPUT_ROOT, generated: manifest.length }, null, 2));
}

main().catch((error) => {
  console.error("No se pudieron generar los PDFs requeridos.", error);
  process.exitCode = 1;
});
