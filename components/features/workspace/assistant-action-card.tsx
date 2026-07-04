"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, FileText, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCard } from "@/services/cards";
import { createDocument, updateDocument } from "@/services/documents";
import type { NavigatorSelection } from "@/providers/navigator-provider";
import type {
  CreateCardActionPayload,
  CreateDocumentActionPayload,
  ProposedAction,
} from "@/types/domain";

/**
 * Tarjeta de "Accion propuesta" del Assistant (Action/Document Engine,
 * Prompt 10). El modelo NUNCA ejecuta nada por si mismo - solo al presionar
 * "Aprobar" se invoca el servicio real correspondiente.
 */
export function AssistantActionCard({
  action,
  orgId,
  selection,
}: {
  action: ProposedAction;
  orgId: string;
  selection: NavigatorSelection | null;
}) {
  const [status, setStatus] = useState<"pending" | "applying" | "done" | "discarded">("pending");
  const router = useRouter();

  async function handleApprove() {
    setStatus("applying");
    try {
      if (action.type === "create_card") {
        const payload = action.payload as CreateCardActionPayload;
        if (
          !selection?.workspaceId ||
          !selection.chapterId ||
          !selection.moduleId ||
          !selection.phaseId
        ) {
          throw new Error("No hay un Workspace seleccionado para crear la Card.");
        }
        await createCard(
          {
            orgId,
            projectId: selection.projectId,
            blueprintId: selection.blueprintId,
            phaseId: selection.phaseId,
            moduleId: selection.moduleId,
            chapterId: selection.chapterId,
            workspaceId: selection.workspaceId,
          },
          {
            type: payload.cardType,
            title: payload.title,
            objective: payload.objective,
            content: payload.content,
          },
        );
        toast.success(`Card "${payload.title}" creada`);
      } else {
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
      }
      setStatus("done");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo aplicar la acción.");
      setStatus("pending");
    }
  }

  const Icon = action.type === "create_card" ? Layers : FileText;

  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
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
