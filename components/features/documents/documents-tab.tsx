"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileStack, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { DocumentBuilder } from "@/components/features/documents/document-builder";
import { getDocumentTemplateLabel } from "@/config/document-templates";
import { listDocuments } from "@/services/documents";
import type { BlueprintDocument, DocumentStatus } from "@/types/domain";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  borrador: "Borrador",
  en_edicion: "En edición",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  publicado: "Publicado",
  archivado: "Archivado",
};

export function DocumentsTab({
  orgId,
  selectedDocumentId,
  onSelectDocument,
}: {
  orgId: string;
  selectedDocumentId: string | null;
  onSelectDocument: (id: string | null) => void;
}) {
  const [documents, setDocuments] = useState<BlueprintDocument[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Carga inicial de la lista de documentos de la organizacion activa.
    listDocuments(orgId).then(setDocuments);
  }, [orgId]);

  if (selectedDocumentId) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b p-2">
          <Button variant="ghost" size="sm" onClick={() => onSelectDocument(null)}>
            <ArrowLeft className="h-4 w-4" /> Volver a Documentos
          </Button>
        </div>
        <DocumentBuilder orgId={orgId} documentId={selectedDocumentId} />
      </div>
    );
  }

  if (documents === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const visible = documents.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <SearchBar
        value={search}
        onValueChange={setSearch}
        placeholder="Buscar documentos..."
        className="mb-4 max-w-sm"
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="Sin documentos"
          description="Crea uno desde la pestaña Templates."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((docItem) => (
            <Card
              key={docItem.id}
              className="hover:border-primary/40 cursor-pointer transition-colors"
              onClick={() => onSelectDocument(docItem.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-h4">{docItem.title}</CardTitle>
                  <Badge variant="outline">{STATUS_LABELS[docItem.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="text-body text-muted-foreground">
                  {getDocumentTemplateLabel(docItem.templateType)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {docItem.sections.length} sección(es)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
