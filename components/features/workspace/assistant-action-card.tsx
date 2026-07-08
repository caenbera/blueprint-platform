"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDocument, updateDocument } from "@/services/documents";
import type { CreateDocumentActionPayload, ProposedAction } from "@/types/domain";

/**
 * Tarjeta de "Accion propuesta" del Assistant (Action/Document Engine). El
 * modelo NUNCA ejecuta nada por si mismo - solo al presionar "Aprobar" se
 * invoca el servicio real correspondiente. Desde el Sprint 13 la unica
 * accion propuesta es crear un Documento (crear Steps quedo retirado junto
 * con el Card System viejo).
 */
export function AssistantActionCard({ action, orgId }: { action: ProposedAction; orgId: string }) {
  const [status, setStatus] = useState<"pending" | "applying" | "done" | "discarded">("pending");
  const router = useRouter();

  async function handleApprove() {
    setStatus("applying");
    try {
      const payload = action.payload as CreateDocumentActionPayload;
      const docId = await createDocument(orgId, payload.title, payload.templateType);
      await updateDocument(orgId, docId, {
        sections: payload.sections.map((s, i) => ({
          id: crypto.randomUUID(),
          title: s.title,
          content: s.content,
          sourceKnowledgeItemId: null,
          hidden: false,
          order: i,
        })),
      });
      toast.success(`Documento "${payload.title}" creado`);
      router.push("/documents");
      setStatus("done");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo aplicar la acción.");
      setStatus("pending");
    }
  }

  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
        <span className="text-small font-medium">{action.summary}</span>
      </div>

      {status === "pending" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleApprove}>
            <Check className="h-3.5 w-3.5" /> Aprobar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus("discarded")}>
            <X className="h-3.5 w-3.5" /> Descartar
          </Button>
        </div>
      )}
      {status === "applying" && <p className="text-small text-muted-foreground">Aplicando...</p>}
      {status === "done" && <p className="text-small text-success">Acción aplicada.</p>}
      {status === "discarded" && <p className="text-small text-muted-foreground">Descartada.</p>}
    </div>
  );
}
