"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { listKnowledgeItems } from "@/services/knowledge";
import type { DocumentSection, KnowledgeItem } from "@/types/domain";

/**
 * Agregar una seccion a un documento (Prompt 4.6): texto libre, o una
 * copia de un Knowledge Item ya aprobado (solo "aprobado" es reutilizable
 * por defecto, Prompt 4.5).
 */
export function AddSectionDialog({
  orgId,
  open,
  onOpenChange,
  onAdd,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (section: Omit<DocumentSection, "order">) => void;
}) {
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[] | null>(null);

  useEffect(() => {
    if (open && knowledgeItems === null) {
      listKnowledgeItems(orgId).then((items) =>
        setKnowledgeItems(items.filter((i) => i.status === "aprobado")),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setCustomTitle("");
    setCustomContent("");
  }

  function handleAddCustom() {
    if (!customTitle.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      title: customTitle.trim(),
      content: customContent,
      sourceKnowledgeItemId: null,
      hidden: false,
    });
    reset();
    onOpenChange(false);
  }

  function handleAddFromKnowledge(item: KnowledgeItem) {
    onAdd({
      id: crypto.randomUUID(),
      title: item.title,
      content: typeof item.content === "string" ? item.content : JSON.stringify(item.content),
      sourceKnowledgeItemId: item.id,
      hidden: false,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar sección</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="custom">
          <TabsList>
            <TabsTrigger value="custom">Texto libre</TabsTrigger>
            <TabsTrigger value="knowledge">Desde Knowledge Base</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Título de la sección</Label>
              <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Contenido</Label>
              <Textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                className="min-h-24"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAddCustom} disabled={!customTitle.trim()}>
                Agregar
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="knowledge" className="flex flex-col gap-2 pt-2">
            {knowledgeItems === null && (
              <p className="text-body text-muted-foreground">Cargando...</p>
            )}
            {knowledgeItems?.length === 0 && (
              <p className="text-body text-muted-foreground">
                No hay elementos aprobados en la Knowledge Base todavía.
              </p>
            )}
            {knowledgeItems?.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddFromKnowledge(item)}
                className="hover:bg-muted rounded-md border p-2 text-left"
              >
                <p className="text-body font-medium">{item.title}</p>
                <p className="text-small text-muted-foreground line-clamp-1">{item.summary}</p>
              </button>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
