"use client";

import { useEffect, useState } from "react";
import { Download, History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listDocumentExports } from "@/services/document-export";
import { listDocuments } from "@/services/documents";
import type { DocumentExportRecord } from "@/types/domain";

/** Historial de todas las exportaciones de la organizacion, agregando las de cada documento. */
export function ExportsTab({ orgId }: { orgId: string }) {
  const [exports, setExports] = useState<DocumentExportRecord[] | null>(null);

  useEffect(() => {
    async function load() {
      const documents = await listDocuments(orgId);
      const perDocument = await Promise.all(
        documents.map((doc) => listDocumentExports(orgId, doc.id)),
      );
      const flattened = perDocument.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setExports(flattened);
    }
    load();
  }, [orgId]);

  if (exports === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={History}
          title="Sin exportaciones todavía"
          description="Exporta un documento desde su constructor para verlo aquí."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {exports.map((record) => (
        <a
          key={record.id}
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:bg-muted flex items-center justify-between gap-2 rounded-lg border p-3"
        >
          <div className="flex flex-col">
            <span className="text-body font-medium">{record.documentTitle}</span>
            <span className="text-caption text-muted-foreground">
              {new Date(record.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{record.format.toUpperCase()}</Badge>
            <Download className="text-muted-foreground h-4 w-4" />
          </div>
        </a>
      ))}
    </div>
  );
}
