"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddSectionDialog } from "@/components/features/documents/add-section-dialog";
import { useAutosave } from "@/hooks/use-autosave";
import { exportDocument } from "@/services/document-export";
import { getDocumentById, updateDocument } from "@/services/documents";
import type {
  BlueprintDocument,
  DocumentExportFormat,
  DocumentSection,
  DocumentStatus,
} from "@/types/domain";

const STATUS_FLOW: { value: DocumentStatus; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "en_edicion", label: "En edición" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "publicado", label: "Publicado" },
  { value: "archivado", label: "Archivado" },
];

const EXPORT_FORMATS: { value: DocumentExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word (.docx)" },
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "json", label: "JSON" },
];

export function DocumentBuilder({ orgId, documentId }: { orgId: string; documentId: string }) {
  const [document, setDocument] = useState<BlueprintDocument | null>(null);
  const [title, setTitle] = useState("");
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [exporting, setExporting] = useState<DocumentExportFormat | null>(null);

  useEffect(() => {
    // Carga inicial del documento seleccionado.
    getDocumentById(orgId, documentId).then((doc) => {
      if (doc) {
        setDocument(doc);
        setTitle(doc.title);
      }
    });
  }, [orgId, documentId]);

  const autosaveStatus = useAutosave(title, (value) =>
    updateDocument(orgId, documentId, { title: value }),
  );

  async function persistSections(sections: DocumentSection[]) {
    setDocument((prev) => (prev ? { ...prev, sections } : prev));
    await updateDocument(orgId, documentId, { sections });
  }

  async function handleStatusChange(status: DocumentStatus) {
    setDocument((prev) => (prev ? { ...prev, status } : prev));
    await updateDocument(orgId, documentId, { status });
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!document) return;
    const sections = [...document.sections].sort((a, b) => a.order - b.order);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    persistSections(sections.map((s, i) => ({ ...s, order: i })));
  }

  function toggleHidden(sectionId: string) {
    if (!document) return;
    persistSections(
      document.sections.map((s) => (s.id === sectionId ? { ...s, hidden: !s.hidden } : s)),
    );
  }

  function updateSectionField(sectionId: string, field: "title" | "content", value: string) {
    if (!document) return;
    persistSections(
      document.sections.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s)),
    );
  }

  function removeSection(sectionId: string) {
    if (!document) return;
    persistSections(document.sections.filter((s) => s.id !== sectionId));
  }

  function addSection(section: Omit<DocumentSection, "order">) {
    if (!document) return;
    persistSections([...document.sections, { ...section, order: document.sections.length }]);
  }

  async function handleExport(format: DocumentExportFormat) {
    if (!document) return;
    setExporting(format);
    try {
      const url = await exportDocument(orgId, document, format);
      window.open(url, "_blank");
      toast.success(`Documento exportado (${format.toUpperCase()})`);
    } finally {
      setExporting(null);
    }
  }

  if (!document) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const sortedSections = [...document.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-h3 h-auto max-w-md border-none px-0 shadow-none focus-visible:ring-0"
          />
          {autosaveStatus === "saving" && (
            <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_FLOW.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={document.status === s.value ? "default" : "outline"}
              onClick={() => handleStatusChange(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {sortedSections.map((section, index) => (
            <div key={section.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSectionField(section.id, "title", e.target.value)}
                  className="h-8 font-medium"
                />
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => moveSection(index, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => moveSection(index, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => toggleHidden(section.id)}>
                    {section.hidden ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeSection(section.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {!section.hidden && (
                <Textarea
                  value={section.content}
                  onChange={(e) => updateSectionField(section.id, "content", e.target.value)}
                  className="min-h-20"
                />
              )}
              {section.hidden && (
                <p className="text-small text-muted-foreground italic">Sección oculta</p>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={() => setAddSectionOpen(true)} className="self-start">
            <Plus className="h-4 w-4" /> Agregar sección
          </Button>
        </div>
      </div>

      <div className="w-96 shrink-0 overflow-y-auto border-l p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-caption text-muted-foreground">Vista previa</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={!!exporting}>
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {EXPORT_FORMATS.map((f) => (
                <DropdownMenuItem key={f.value} onClick={() => handleExport(f.value)}>
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-3">
          <h1 className="text-h4">{document.title}</h1>
          {sortedSections
            .filter((s) => !s.hidden)
            .map((s) => (
              <div key={s.id}>
                <p className="text-body font-semibold">{s.title}</p>
                <p className="text-small text-muted-foreground whitespace-pre-wrap">{s.content}</p>
              </div>
            ))}
        </div>
      </div>

      <AddSectionDialog
        orgId={orgId}
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        onAdd={addSection}
      />
    </div>
  );
}
