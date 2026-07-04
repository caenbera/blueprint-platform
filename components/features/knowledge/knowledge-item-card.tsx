"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKnowledgeCategoryLabel } from "@/config/knowledge-categories";
import type { KnowledgeItem, KnowledgeItemStatus } from "@/types/domain";

const STATUS_LABELS: Record<KnowledgeItemStatus, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  archivado: "Archivado",
};

const STATUS_VARIANTS: Record<
  KnowledgeItemStatus,
  "outline" | "warning" | "success" | "secondary"
> = {
  borrador: "outline",
  en_revision: "warning",
  aprobado: "success",
  archivado: "secondary",
};

export function KnowledgeItemCard({ item, onClick }: { item: KnowledgeItem; onClick: () => void }) {
  return (
    <Card
      className="hover:border-primary/40 cursor-pointer transition-colors"
      onClick={onClick}
      data-variant="interactive"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-h4">{item.title}</CardTitle>
          <Badge variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-body text-muted-foreground line-clamp-2">{item.summary}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{getKnowledgeCategoryLabel(item.category)}</Badge>
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
