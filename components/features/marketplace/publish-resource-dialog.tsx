"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MARKETPLACE_RESOURCE_TYPES, MARKETPLACE_VISIBILITY_LABELS } from "@/config/marketplace";
import { listDocuments } from "@/services/documents";
import { listKnowledgeItems } from "@/services/knowledge";
import { publishDocument, publishKnowledgeItem } from "@/services/marketplace";
import type {
  BlueprintDocument,
  KnowledgeItem,
  MarketplaceResourceType,
  MarketplaceVisibility,
} from "@/types/domain";

/**
 * Punto unico de publicacion al Marketplace: elegir tipo → elegir la
 * fuente concreta → titulo/descripcion/visibilidad. Sprint 13: el tipo
 * "blueprint" se retiro (autoria exclusiva de Super Admin) - queda
 * Documentos y Knowledge Items.
 */
export function PublishResourceDialog({
  orgId,
  orgName,
  open,
  onOpenChange,
  onPublished,
}: {
  orgId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
}) {
  const [resourceType, setResourceType] = useState<MarketplaceResourceType>("knowledge_item");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<MarketplaceVisibility>("organization");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<BlueprintDocument[] | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");

  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[] | null>(null);
  const [selectedKnowledgeItemId, setSelectedKnowledgeItemId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (resourceType === "document" && documents === null) {
      listDocuments(orgId).then(setDocuments);
    }
    if (resourceType === "knowledge_item" && knowledgeItems === null) {
      listKnowledgeItems(orgId).then((items) =>
        setKnowledgeItems(items.filter((i) => i.status === "aprobado")),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resourceType]);

  function reset() {
    setResourceType("knowledge_item");
    setTitle("");
    setDescription("");
    setVisibility("organization");
    setError(null);
    setSelectedDocumentId("");
    setSelectedKnowledgeItemId("");
  }

  async function handlePublish() {
    if (!title.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const meta = { title: title.trim(), description, visibility, orgName };
      if (resourceType === "document") {
        if (!selectedDocumentId) throw new Error("Elige un Documento.");
        await publishDocument(orgId, selectedDocumentId, meta);
      } else {
        if (!selectedKnowledgeItemId) throw new Error("Elige un Knowledge Item.");
        await publishKnowledgeItem(orgId, selectedKnowledgeItemId, meta);
      }
      reset();
      onOpenChange(false);
      onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el recurso.");
    } finally {
      setPublishing(false);
    }
  }

  const canPublish =
    title.trim().length > 0 &&
    (resourceType === "document" ? Boolean(selectedDocumentId) : Boolean(selectedKnowledgeItemId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar recurso en el Marketplace</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de recurso</Label>
            <div className="flex flex-wrap gap-1.5">
              {MARKETPLACE_RESOURCE_TYPES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  size="sm"
                  variant={resourceType === t.value ? "default" : "outline"}
                  onClick={() => setResourceType(t.value)}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {resourceType === "document" && (
            <div className="flex flex-col gap-1.5">
              <Label>Documento</Label>
              <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un Documento" />
                </SelectTrigger>
                <SelectContent>
                  {documents?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {resourceType === "knowledge_item" && (
            <div className="flex flex-col gap-1.5">
              <Label>Knowledge Item</Label>
              <Select value={selectedKnowledgeItemId} onValueChange={setSelectedKnowledgeItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un Knowledge Item aprobado" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeItems?.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {knowledgeItems?.length === 0 && (
                <p className="text-small text-muted-foreground">
                  No hay Knowledge Items aprobados todavía.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Título del recurso</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Visibilidad</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as MarketplaceVisibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MARKETPLACE_VISIBILITY_LABELS) as MarketplaceVisibility[]).map(
                  (v) => (
                    <SelectItem key={v} value={v}>
                      {MARKETPLACE_VISIBILITY_LABELS[v]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-small text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handlePublish} disabled={!canPublish || publishing}>
            {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
