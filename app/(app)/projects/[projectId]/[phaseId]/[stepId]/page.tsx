"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2 as LoaderIcon,
  Lock,
  PartyPopper,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { getProject } from "@/services/projects";
import {
  addComment,
  addNote,
  findNextStep,
  isStepBlocked,
  listComments,
  listNotes,
  listStepStates,
  setStepStatus,
  toggleChecklistItem,
} from "@/services/step-state";
import type {
  BlueprintPhase,
  BlueprintStep,
  Comment,
  Project,
  ProjectStepState,
  StepNote,
} from "@/types/domain";

/** Vista de Paso (mockup "08-vista-paso.png"/"09-paso-completado.png"): Descripción/Checklist/Recursos/Notas/Comentarios + marcar como completado. */
export default function StepView() {
  const { projectId, phaseId, stepId } = useParams<{
    projectId: string;
    phaseId: string;
    stepId: string;
  }>();
  const router = useRouter();
  const { membership, user } = useAuth();
  const { setActiveProject, setSelection } = useNavigator();
  const orgId = membership?.orgId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [allStepStates, setAllStepStates] = useState<ProjectStepState[] | null>(null);
  const [notes, setNotes] = useState<StepNote[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [noteText, setNoteText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      getProject(orgId, projectId),
      listStepStates(orgId, projectId),
      listNotes(orgId, projectId, stepId),
      listComments(orgId, projectId, stepId),
    ]).then(([p, states, n, c]) => {
      setProject(p);
      setAllStepStates(states);
      setNotes(n);
      setComments(c);
      if (p) {
        setActiveProject(p.id, p.name);
        const step = findStep(p, phaseId, stepId);
        if (step)
          setSelection({ projectId: p.id, projectName: p.name, stepId, stepTitle: step.title });
        const existing = states.find((s) => s.stepId === stepId);
        if (step && (!existing || existing.status === "pending")) {
          void setStepStatus(orgId, projectId, step, "in_progress");
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, projectId, phaseId, stepId]);

  if (!orgId || project === null || allStepStates === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <LoaderIcon className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const phase = project.blueprintSnapshot.roadmap.find((p) => p.id === phaseId);
  const step = phase?.steps.find((s) => s.id === stepId);
  if (!phase || !step) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState title="Paso no encontrado" />
      </div>
    );
  }

  const currentState = allStepStates.find((s) => s.stepId === stepId);
  const checklistDone = new Set(currentState?.checklistDone ?? []);
  const blocked = isStepBlocked(step, allStepStates);
  const isCompleted = currentState?.status === "completed" || justCompleted;

  if (blocked) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={Lock}
          title="Este paso está bloqueado"
          description="Primero completa los pasos de los que depende."
          actionLabel="Volver a la fase"
          onAction={() => router.push(`/projects/${projectId}/${phaseId}`)}
        />
      </div>
    );
  }

  async function handleToggleChecklist(itemId: string, done: boolean) {
    await toggleChecklistItem(orgId!, projectId, stepId, itemId, done);
    setAllStepStates((prev) =>
      (prev ?? []).map((s) =>
        s.stepId === stepId
          ? {
              ...s,
              checklistDone: done
                ? [...s.checklistDone, itemId]
                : s.checklistDone.filter((id) => id !== itemId),
            }
          : s,
      ),
    );
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await setStepStatus(orgId!, projectId, step!, "completed");
      setJustCompleted(true);
    } finally {
      setCompleting(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    await addNote(orgId!, projectId, stepId, noteText.trim());
    setNotes((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorUid: user?.uid ?? "",
        text: noteText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setNoteText("");
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    await addComment(orgId!, projectId, stepId, commentText.trim());
    setComments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        authorUid: user?.uid ?? "",
        authorName: user?.displayName || user?.email || "Usuario",
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentText("");
  }

  if (isCompleted && justCompleted) {
    const next = findNextStep(project.blueprintSnapshot, allStepStates);
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="bg-success/10 flex h-14 w-14 items-center justify-center rounded-full">
            <PartyPopper className="text-success h-7 w-7" />
          </div>
          <h1 className="text-h3">¡Paso completado!</h1>
          <p className="text-body text-muted-foreground">
            Completaste &quot;{step.title}&quot; en la fase {phase.title}.
          </p>
          {next ? (
            <>
              <div className="mt-2 w-full rounded-lg border p-4 text-left">
                <p className="text-small text-muted-foreground">Siguiente paso</p>
                <p className="text-body font-medium">{next.step.title}</p>
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  router.push(`/projects/${projectId}/${next.phase.id}/${next.step.id}`)
                }
              >
                Continuar con el siguiente paso <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <p className="text-body text-success font-medium">
              ¡Completaste todos los pasos de este Blueprint!
            </p>
          )}
          <Link href={`/projects/${projectId}/${phaseId}`} className="text-body text-primary">
            Volver a la fase
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <Link
        href={`/projects/${projectId}/${phaseId}`}
        className="text-body text-muted-foreground hover:text-foreground mb-3 flex w-fit items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {phase.title}
      </Link>

      <div className="flex items-center justify-between gap-2">
        <h1 className="text-h3">{step.title}</h1>
        <span className="text-small text-muted-foreground flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {step.estimatedHours}h estimadas
        </span>
      </div>
      <p className="text-body text-muted-foreground mt-1">{step.description}</p>

      <Tabs defaultValue="descripcion" className="mt-4">
        <TabsList>
          <TabsTrigger value="descripcion">Descripción</TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist ({checklistDone.size}/{step.content.checklist.length})
          </TabsTrigger>
          <TabsTrigger value="recursos">Recursos ({step.content.resources.length})</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="comentarios">Comentarios ({comments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="descripcion" className="flex flex-col gap-3 pt-3">
          <div className="rounded-lg border p-4">
            <p className="text-h4">{step.content.overview.title || step.title}</p>
            <p className="text-body text-muted-foreground mt-1">{step.content.overview.summary}</p>
            {step.content.overview.body && (
              <p className="text-body mt-3 whitespace-pre-wrap">{step.content.overview.body}</p>
            )}
          </div>
          {step.content.objective.description && (
            <div className="bg-info/5 rounded-lg border p-4">
              <p className="text-small text-info font-medium">¿Qué lograrás con este paso?</p>
              <p className="text-body mt-1">{step.content.objective.description}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="checklist" className="flex flex-col gap-2 pt-3">
          {step.content.checklist.length === 0 && (
            <p className="text-small text-muted-foreground">Este paso no tiene checklist.</p>
          )}
          {step.content.checklist.map((item) => (
            <label
              key={item.id}
              className="hover:bg-muted/50 flex items-center gap-2.5 rounded-md border p-2.5"
            >
              <Checkbox
                checked={checklistDone.has(item.id)}
                onCheckedChange={(checked) => handleToggleChecklist(item.id, checked === true)}
              />
              <span
                className={
                  checklistDone.has(item.id)
                    ? "text-body text-muted-foreground line-through"
                    : "text-body"
                }
              >
                {item.task}
              </span>
            </label>
          ))}
        </TabsContent>

        <TabsContent value="recursos" className="flex flex-col gap-2 pt-3">
          {step.content.resources.length === 0 && (
            <p className="text-small text-muted-foreground">Este paso no tiene recursos.</p>
          )}
          {step.content.resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.downloadUrl || resource.previewUrl || resource.embedUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="hover:bg-muted/50 flex items-center gap-2.5 rounded-md border p-2.5"
            >
              <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-body truncate">{resource.title}</p>
                {resource.description && (
                  <p className="text-small text-muted-foreground truncate">
                    {resource.description}
                  </p>
                )}
              </div>
              <Badge variant="outline">{resource.type}</Badge>
            </a>
          ))}
        </TabsContent>

        <TabsContent value="notas" className="flex flex-col gap-3 pt-3">
          <p className="text-small text-muted-foreground">
            Notas privadas - solo tú puedes verlas.
          </p>
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <div key={note.id} className="bg-muted/50 rounded-md p-2.5">
                <p className="text-body whitespace-pre-wrap">{note.text}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escribe una nota..."
              className="min-h-16"
            />
            <Button size="icon-sm" onClick={handleAddNote} disabled={!noteText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="comentarios" className="flex flex-col gap-3 pt-3">
          <div className="flex flex-col gap-2">
            {comments.length === 0 && (
              <p className="text-small text-muted-foreground">Aún no hay comentarios.</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-md border p-2.5">
                <p className="text-small font-medium">{comment.authorName}</p>
                <p className="text-body whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario para tu equipo..."
              className="min-h-16"
            />
            <Button size="icon-sm" onClick={handleAddComment} disabled={!commentText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-muted-foreground h-4 w-4" />
          <p className="text-body text-muted-foreground">
            Usa el Assistant a la derecha si necesitas ayuda con este paso.
          </p>
        </div>
        <Button onClick={handleComplete} disabled={completing || isCompleted}>
          {completing ? (
            <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {isCompleted ? "Paso completado" : "Marcar paso como completado"}
        </Button>
      </div>
    </div>
  );
}

function findStep(project: Project, phaseId: string, stepId: string): BlueprintStep | null {
  const phase = project.blueprintSnapshot.roadmap.find((p: BlueprintPhase) => p.id === phaseId);
  return phase?.steps.find((s) => s.id === stepId) ?? null;
}
