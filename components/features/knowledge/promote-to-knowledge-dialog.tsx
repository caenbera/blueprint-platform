"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { KNOWLEDGE_CATEGORIES } from "@/config/knowledge-categories";
import { createKnowledgeItem } from "@/services/knowledge";
import type { Card, KnowledgeCategory } from "@/types/domain";

/**
 * Promover una Card a la Knowledge Base (Prompt 9) es una accion critica
 * (crea conocimiento oficial reutilizable), por eso usa un Modal en vez
 * de una accion silenciosa de un clic (Prompt 5: "Modal solo para
 * acciones criticas").
 */
export function PromoteToKnowledgeDialog({
  orgId,
  card,
  open,
  onOpenChange,
  onPromoted,
}: {
  orgId: string;
  card: Card;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromoted: () => void;
}) {
  const [summary, setSummary] = useState(card.objective || "");
  const [category, setCategory] = useState<KnowledgeCategory>("procesos");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    await createKnowledgeItem(orgId, {
      card,
      summary,
      category,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setSaving(false);
    onOpenChange(false);
    onPromoted();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promover a Knowledge Base</DialogTitle>
          <DialogDescription>
            Se guardará una copia del contenido actual de «{card.title}» como conocimiento
            reutilizable de la organización.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Resumen</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="¿Por qué es útil este conocimiento?"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as KnowledgeCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KNOWLEDGE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Etiquetas (separadas por coma)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="marketing, plan 2025..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Promover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
