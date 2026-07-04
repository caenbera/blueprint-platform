import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";
import { documentsPath } from "@/services/documents";
import { getDocumentTemplateLabel } from "@/config/document-templates";
import type { BlueprintDocument, DocumentExportFormat, DocumentExportRecord } from "@/types/domain";

/**
 * Genera el documento en el formato pedido (real, no simulado), lo sube a
 * Storage bajo organizations/{orgId}/documents/{docId}/exports/ (ya
 * cubierto por storage.rules) y registra un DocumentExportRecord en
 * Firestore para que la pestaña "Exports" sea un historial descargable.
 */
export async function exportDocument(
  orgId: string,
  document: BlueprintDocument,
  format: DocumentExportFormat,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const visibleSections = document.sections
    .filter((s) => !s.hidden)
    .sort((a, b) => a.order - b.order);
  const { blob, extension, mimeType } = await buildFile(document, visibleSections, format);

  const fileName = `${Date.now()}.${extension}`;
  const storagePath = `organizations/${orgId}/documents/${document.id}/exports/${fileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: mimeType });
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, `${documentsPath(orgId)}/${document.id}/exports`), {
    documentId: document.id,
    documentTitle: document.title,
    format,
    url,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });

  return url;
}

/** Historial de exportaciones de UN documento (usado por la pestaña "Exports", que agrega los de todos los documentos). */
export async function listDocumentExports(
  orgId: string,
  docId: string,
): Promise<DocumentExportRecord[]> {
  const snap = await getDocs(
    query(collection(db, `${documentsPath(orgId)}/${docId}/exports`), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      format: data.format,
      url: data.url,
      createdBy: data.createdBy,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : "",
    };
  });
}

async function buildFile(
  document: BlueprintDocument,
  sections: BlueprintDocument["sections"],
  format: DocumentExportFormat,
): Promise<{ blob: Blob; extension: string; mimeType: string }> {
  switch (format) {
    case "markdown":
      return {
        blob: new Blob([buildMarkdown(document, sections)], { type: "text/markdown" }),
        extension: "md",
        mimeType: "text/markdown",
      };
    case "html":
      return {
        blob: new Blob([buildHtml(document, sections)], { type: "text/html" }),
        extension: "html",
        mimeType: "text/html",
      };
    case "json":
      return {
        blob: new Blob([JSON.stringify({ ...document, sections }, null, 2)], {
          type: "application/json",
        }),
        extension: "json",
        mimeType: "application/json",
      };
    case "pdf":
      return {
        blob: await buildPdf(document, sections),
        extension: "pdf",
        mimeType: "application/pdf",
      };
    case "word":
      return {
        blob: await buildWord(document, sections),
        extension: "docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
  }
}

function buildMarkdown(
  document: BlueprintDocument,
  sections: BlueprintDocument["sections"],
): string {
  const lines = [
    `# ${document.title}`,
    "",
    `_${getDocumentTemplateLabel(document.templateType)}_`,
    "",
  ];
  for (const section of sections) {
    lines.push(`## ${section.title}`, "", section.content, "");
  }
  return lines.join("\n");
}

function buildHtml(document: BlueprintDocument, sections: BlueprintDocument["sections"]): string {
  const body = sections
    .map(
      (s) =>
        `<h2>${escapeHtml(s.title)}</h2><p>${escapeHtml(s.content).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("\n");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title></head><body><h1>${escapeHtml(document.title)}</h1>${body}</body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function buildPdf(
  document: BlueprintDocument,
  sections: BlueprintDocument["sections"],
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  function ensureSpace(lineHeight: number) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = 20;
    }
  }

  pdf.setFontSize(18);
  pdf.text(document.title, margin, y);
  y += 10;

  for (const section of sections) {
    pdf.setFontSize(14);
    ensureSpace(8);
    pdf.text(section.title, margin, y);
    y += 8;

    pdf.setFontSize(11);
    const lines: string[] = pdf.splitTextToSize(section.content || "", maxWidth);
    for (const line of lines) {
      ensureSpace(6);
      pdf.text(line, margin, y);
      y += 6;
    }
    y += 6;
  }

  return pdf.output("blob");
}

async function buildWord(
  document: BlueprintDocument,
  sections: BlueprintDocument["sections"],
): Promise<Blob> {
  const { Document, Packer, Paragraph, HeadingLevel } = await import("docx");
  const docxDoc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: document.title, heading: HeadingLevel.TITLE }),
          ...sections.flatMap((s) => [
            new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: s.content }),
          ]),
        ],
      },
    ],
  });
  return Packer.toBlob(docxDoc);
}
