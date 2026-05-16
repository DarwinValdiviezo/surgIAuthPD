import { NextRequest, NextResponse } from "next/server";
import { createDocument, findDocumentById, updateDocument } from "@/lib/case-service";
import { analyzeUploadedDocument, extractTextFromUploadedDocument } from "@/lib/document-processing";
import { createEntityId } from "@/lib/input-format";
import { CaseDocument } from "@/types/domain";

const MAX_NOTION_UPLOAD_BYTES = 20 * 1024 * 1024;

function getString(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) {
    return "";
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const body = isMultipart ? null : await request.json();
    const formData = isMultipart ? await request.formData() : null;

    const caseId = isMultipart ? String(formData?.get("caseId") ?? "").trim() : getString(body, "caseId");
    const documentType = isMultipart
      ? String(formData?.get("documentType") ?? "").trim()
      : getString(body, "documentType");
    const requestedDocumentStatus = isMultipart
      ? String(formData?.get("documentStatus") ?? "").trim()
      : getString(body, "documentStatus");
    const fileUrl = isMultipart ? String(formData?.get("fileUrl") ?? "").trim() : getString(body, "fileUrl");
    const rawExtractedText = isMultipart
      ? String(formData?.get("extractedText") ?? "").trim()
      : getString(body, "extractedText");
    const uploadedFile = isMultipart ? formData?.get("file") : null;

    if (!caseId || !documentType) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para crear el documento." },
        { status: 400 },
      );
    }

    let extractedText = rawExtractedText;
    let analysisSource: "gemini" | "rules" = "rules";
    let documentStatus = requestedDocumentStatus || "Disponible";
    let notionUpload:
      | {
          bytes: Uint8Array;
          filename: string;
          contentType: string;
        }
      | undefined;

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      if (uploadedFile.size > MAX_NOTION_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "El archivo supera el limite de 20 MB permitido por Notion para este flujo." },
          { status: 400 },
        );
      }

      const extractedFromFile = await extractTextFromUploadedDocument(uploadedFile);
      const analyzedDocument = await analyzeUploadedDocument({
        documentType,
        extractedText: extractedFromFile,
      });

      extractedText = analyzedDocument.extractedText;
      analysisSource = analyzedDocument.analysisSource;
      documentStatus = extractedText ? "Procesado" : documentStatus || "Pendiente";
      notionUpload = {
        bytes: new Uint8Array(await uploadedFile.arrayBuffer()),
        filename: uploadedFile.name,
        contentType: uploadedFile.type || "application/octet-stream",
      };
    }

    const document: CaseDocument = {
      documentId: isMultipart
        ? String(formData?.get("documentId") ?? "").trim() || createEntityId("DOC")
        : getString(body, "documentId") || createEntityId("DOC"),
      caseId,
      documentType,
      fileUrl,
      documentStatus,
      extractedText,
    };

    const createdDocument = await createDocument(document, notionUpload);

    return NextResponse.json(
      {
        ok: true,
        document: createdDocument,
        analysisSource,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("No se pudo crear el documento.", error);
    return NextResponse.json(
      { error: "Ocurrio un error al crear el documento en Notion." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const body = isMultipart ? null : await request.json();
    const formData = isMultipart ? await request.formData() : null;

    const documentId = isMultipart
      ? String(formData?.get("documentId") ?? "").trim()
      : getString(body, "documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Debes indicar el documento que quieres actualizar." },
        { status: 400 },
      );
    }

    const existingDocument = await findDocumentById(documentId);

    if (!existingDocument) {
      return NextResponse.json(
        { error: "No se encontro el documento en Notion." },
        { status: 404 },
      );
    }

    const caseId = isMultipart ? String(formData?.get("caseId") ?? "").trim() : getString(body, "caseId");
    const documentType = isMultipart
      ? String(formData?.get("documentType") ?? "").trim()
      : getString(body, "documentType");
    const requestedDocumentStatus = isMultipart
      ? String(formData?.get("documentStatus") ?? "").trim()
      : getString(body, "documentStatus");
    const fileUrl = isMultipart ? String(formData?.get("fileUrl") ?? "").trim() : getString(body, "fileUrl");
    const rawExtractedText = isMultipart
      ? String(formData?.get("extractedText") ?? "").trim()
      : getString(body, "extractedText");
    const uploadedFile = isMultipart ? formData?.get("file") : null;

    if (!caseId || !documentType) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para actualizar el documento." },
        { status: 400 },
      );
    }

    let extractedText = rawExtractedText;
    let analysisSource: "gemini" | "rules" = "rules";
    let documentStatus = requestedDocumentStatus || existingDocument.documentStatus || "Disponible";
    let notionUpload:
      | {
          bytes: Uint8Array;
          filename: string;
          contentType: string;
        }
      | undefined;

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      if (uploadedFile.size > MAX_NOTION_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "El archivo supera el limite de 20 MB permitido por Notion para este flujo." },
          { status: 400 },
        );
      }

      const extractedFromFile = await extractTextFromUploadedDocument(uploadedFile);
      const analyzedDocument = await analyzeUploadedDocument({
        documentType,
        extractedText: extractedFromFile,
      });

      extractedText = analyzedDocument.extractedText;
      analysisSource = analyzedDocument.analysisSource;
      documentStatus = extractedText ? "Procesado" : documentStatus || "Pendiente";
      notionUpload = {
        bytes: new Uint8Array(await uploadedFile.arrayBuffer()),
        filename: uploadedFile.name,
        contentType: uploadedFile.type || "application/octet-stream",
      };
    }

    const document: CaseDocument = {
      ...existingDocument,
      documentId,
      caseId,
      documentType,
      fileUrl: fileUrl || existingDocument.fileUrl,
      documentStatus,
      extractedText: extractedText || existingDocument.extractedText,
      storage: fileUrl ? "external" : existingDocument.storage,
    };

    const updatedDocument = await updateDocument(document, notionUpload);

    return NextResponse.json(
      {
        ok: true,
        document: updatedDocument,
        analysisSource,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("No se pudo actualizar el documento.", error);
    return NextResponse.json(
      { error: "Ocurrio un error al actualizar el documento en Notion." },
      { status: 500 },
    );
  }
}
