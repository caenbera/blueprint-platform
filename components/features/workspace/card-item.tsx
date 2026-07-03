"use client";

import { useEffect, useState } from "react";
import { History, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as CardShell, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardVersionHistory } from "@/components/features/workspace/card-version-history";
import { useAutosave } from "@/hooks/use-autosave";
import { archiveCard, updateCard } from "@/services/cards";
import { createComment, listComments } from "@/services/comments";
import type { CardRef } from "@/lib/firestore-hierarchy";
import type { Card, CardLifecycleStatus, Comment } from "@/types/domain";

const STATUS_LABELS: Record<CardLifecycleStatus, string> = {
  borrador: "Borrador",
  en_edicion: "En edición",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  publicada: "Publicada",
  archivada: "Archivada",
  bloqueada: "Bloqueada",
};

const STATUS_VARIANTS: Record<
  CardLifecycleStatus,
  "outline" | "info" | "warning" | "success" | "default" | "secondary" | "destructive"
> = {
  borrador: "outline",
  en_edicion: "info",
  en_revision: "warning",
  aprobada: "success",
  publicada: "default",
  archivada: "secondary",
  bloqueada: "destructive",
};

function cardRef(card: Card): CardRef {
  return {
    orgId: card.orgId,
    projectId: card.projectId,
    blueprintId: card.blueprintId,
    phaseId: card.phaseId,
    moduleId: card.moduleId,
    chapterId: card.chapterId,
    workspaceId: card.workspaceId,
    cardId: card.id,
  };
}

/**
 * Anatomia basica de una Card (Prompt 8/9): Header -> Objetivo -> Contenido
 * -> Comentarios -> Footer. La seccion "Assistant IA" llega con el AI
 * Engine real (Sprint 8); los 20 tipos especializados llegan en el
 * Card System completo (Sprint 5) - aqui el contenido es texto simple.
 */
export function CardItem({ card, onArchived }: { card: Card; onArchived: () => void }) {
  const ref = cardRef(card);

  const [title, setTitle] = useState(card.title);
  const [objective, setObjective] = useState(card.objective);
  const [content, setContent] = useState(typeof card.content === "string" ? card.content : "");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const autosaveStatus = useAutosave({ title, objective, content }, (value) =>
    updateCard(ref, value),
  );

  useEffect(() => {
    listComments(ref).then(setComments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setPostingComment(true);
    await createComment(ref, newComment.trim());
    setNewComment("");
    setComments(await listComments(ref));
    setPostingComment(false);
  }

  return (
    <CardShell>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-h4 h-auto border-none px-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={STATUS_VARIANTS[card.lifecycleStatus]}>
            {STATUS_LABELS[card.lifecycleStatus]}
          </Badge>
          {autosaveStatus === "saving" && (
            <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
          )}
          {autosaveStatus === "saved" && (
            <span className="text-caption text-muted-foreground">Guardado</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                <History /> Historial
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  await archiveCard(ref);
                  onArchived();
                }}
              >
                <Trash2 /> Archivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <Input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="¿Qué pretende resolver esta Card?"
          className="text-body text-muted-foreground"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe el contenido aquí..."
          className="min-h-24"
        />
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 border-t pt-4">
        {comments === null ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        ) : (
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <div key={c.id} className="text-small flex flex-col gap-0.5">
                <span className="font-medium">
                  {c.authorName}{" "}
                  <span className="text-muted-foreground font-normal">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </span>
                <span className="text-muted-foreground">{c.text}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddComment();
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddComment}
            disabled={postingComment || !newComment.trim()}
          >
            Comentar
          </Button>
        </div>
      </CardFooter>

      <CardVersionHistory cardRef={ref} open={historyOpen} onOpenChange={setHistoryOpen} />
    </CardShell>
  );
}
