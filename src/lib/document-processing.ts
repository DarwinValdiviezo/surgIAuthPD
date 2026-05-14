import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { isGeminiAvailable, summarizeDocumentTextWithGemini } from "@/lib/gemini";

const MAX_EXTRACTED_TEXT_LENGTH = 1900;
const PDF_WORKER_URL = pathToFileURL(
  path.join(process.cwd(), "node_modules", "pdf-parse", "dist", "worker", "pdf.worker.mjs"),
).href;
let isPdfWorkerConfigured = false;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateExtractedText(value: string): string {
  return normalizeWhitespace(value).slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

function isPdfFile(file: File): boolean {
  const normalizedName = file.name.trim().toLowerCase();
  return file.type === "application/pdf" || normalizedName.endsWith(".pdf");
}

function isPlainTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) {
    return true;
  }

  const normalizedName = file.name.trim().toLowerCase();
  return [".txt", ".md", ".csv", ".json"].some((extension) => normalizedName.endsWith(extension));
}

function ensurePdfWorkerConfigured() {
  if (isPdfWorkerConfigured) {
    return;
  }

  PDFParse.setWorker(PDF_WORKER_URL);
  isPdfWorkerConfigured = true;
}

async function extractTextFromPdf(file: File): Promise<string> {
  ensurePdfWorkerConfigured();
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({
    data: new Uint8Array(arrayBuffer),
  });

  try {
    const result = await parser.getText();
    return truncateExtractedText(result.text ?? "");
  } finally {
    await parser.destroy();
  }
}

async function extractTextFromPlainFile(file: File): Promise<string> {
  const text = await file.text();
  return truncateExtractedText(text);
}

export async function extractTextFromUploadedDocument(file: File): Promise<string> {
  if (isPdfFile(file)) {
    return extractTextFromPdf(file);
  }

  if (isPlainTextFile(file)) {
    return extractTextFromPlainFile(file);
  }

  throw new Error("Solo se permiten archivos PDF o texto plano compatibles.");
}

export async function analyzeUploadedDocument(options: {
  documentType: string;
  extractedText: string;
}): Promise<{
  extractedText: string;
  analysisSource: "gemini" | "rules";
}> {
  const normalizedExtractedText = truncateExtractedText(options.extractedText);

  if (!normalizedExtractedText) {
    return {
      extractedText: "",
      analysisSource: "rules",
    };
  }

  if (!isGeminiAvailable()) {
    return {
      extractedText: normalizedExtractedText,
      analysisSource: "rules",
    };
  }

  try {
    const summarizedText = await summarizeDocumentTextWithGemini({
      documentType: options.documentType,
      extractedText: normalizedExtractedText,
    });

    return {
      extractedText: truncateExtractedText(summarizedText),
      analysisSource: "gemini",
    };
  } catch {
    return {
      extractedText: normalizedExtractedText,
      analysisSource: "rules",
    };
  }
}
