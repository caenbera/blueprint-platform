"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { KNOWLEDGE_CATEGORIES, getKnowledgeCategoryLabel } from "@/config/knowledge-categories";
import {
  linkKnowledgeItems,
  unlinkKnowledgeItems,
  updateKnowledgeItem,
} from "@/services/knowledge";
import type { KnowledgeItem, KnowledgeItemStatus } from "@/types/domain";

const STATUS_FLOW: { value: KnowledgeItemStatus; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "archivado", label: "Archivado" },
];

export function KnowledgeItemDetail({
  orgId,
  item,
  allItems,
  open,
  onOpenChange,
  onUpdated,
}: {
  orgId: string;
  item: KnowledgeItem;
  allItems: KnowledgeItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [relationQuery, setRelationQuery] = useState("");

  const relatedItems = allItems.filter((i) => item.relatedItemIds.includes(i.id));
  const candidates = allItems.filter(
    (i) =>
      i.id !== item.id &&
      !item.relatedItemIds.includes(i.id) &&
      relationQuery &&
      i.title.toLowerCase().includes(relationQuery.toLowerCase()),
  );

  async function handleStatusChange(status: KnowledgeItemStatus) {
    await updateKnowledgeItem(orgId, item.id, { status });
    onUpdated();
  }

  async function handleCategoryChange(category: string) {
    await updateKnowledgeItem(orgId, item.id, { category: category as KnowledgeItem["category"] });
    onUpdated();
  }

  async function addTag() {
    if (!tagInput.trim()) return;
    await updateKnowledgeItem(orgId, item.id, { tags: [...item.tags, tagInput.trim()] });
    setTagInput("");
    onUpdated();
  }

  async function removeTag(tag: string) {
    await updateKnowledgeItem(orgId, item.id, { tags: item.tags.filter((t) => t !== tag) });
    onUpdated();
  }

  async function addRelation(otherId: string) {
    await linkKnowledgeItems(orgId, item.id, otherId);
    setRelationQuery("");
    onUpdated();
  }

  async function removeRelation(otherId: string) {
    await unlinkKnowledgeItems(orgId, item.id, otherId);
    onUpdated();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4 overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>{item.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-muted-foreground">Estado</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FLOW.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={item.status === s.value ? "default" : "outline"}
                onClick={() => handleStatusChange(s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-muted-foreground">Categoría</p>
          <Select value={item.category} onValueChange={handleCategoryChange}>
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
          <p className="text-caption text-muted-foreground">Etiquetas</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Nueva etiqueta..."
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              className="h-8"
            />
            <Button size="sm" variant="outline" onClick={addTag}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-muted-foreground">Resumen</p>
          <p className="text-body">{item.summary}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-muted-foreground">
            Contenido (origen: {item.sourceTitle || "incorporación"})
          </p>
          <p className="text-body bg-muted rounded-md p-2 whitespace-pre-wrap">
            {typeof item.content === "string"
              ? item.content
              : JSON.stringify(item.content, null, 2)}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-caption text-muted-foreground">Relacionado con</p>
          <div className="flex flex-wrap gap-1.5">
            {relatedItems.length === 0 && (
              <p className="text-small text-muted-foreground">Sin relaciones todavía.</p>
            )}
            {relatedItems.map((related) => (
              <Badge key={related.id} variant="secondary" className="gap-1">
                {related.title}
                <button type="button" onClick={() => removeRelation(related.id)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            value={relationQuery}
            onChange={(e) => setRelationQuery(e.target.value)}
            placeholder="Buscar un elemento para relacionar..."
            className="h-8"
          />
          {candidates.length > 0 && (
            <div className="flex flex-col rounded-md border">
              {candidates.slice(0, 5).map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => addRelation(candidate.id)}
                  className="hover:bg-muted text-body px-2 py-1.5 text-left"
                >
                  {candidate.title}
                  <span className="text-muted-foreground">
                    {" "}
                    — {getKnowledgeCategoryLabel(candidate.category)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
