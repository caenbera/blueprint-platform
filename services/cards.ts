import {
  archiveNode,
  cardPath,
  cardsPath,
  createNode,
  getNode,
  listNodes,
  updateNode,
  type CardRef,
  type WorkspaceRef,
} from "@/lib/firestore-hierarchy";
import type { Card, CardType } from "@/types/domain";

export interface CreateCardInput {
  type: CardType;
  title: string;
  objective?: string;
  content?: unknown;
  order?: number;
}

/**
 * CRUD basico de Cards. La riqueza completa del Card System (los 20 tipos,
 * versiones, comentarios anidados - Prompt 8/9) se construye en el
 * Sprint 5; esto solo deja la base de datos lista para esa fase.
 */
export async function createCard(ref: WorkspaceRef, input: CreateCardInput): Promise<string> {
  return createNode(cardsPath(ref), {
    orgId: ref.orgId,
    projectId: ref.projectId,
    blueprintId: ref.blueprintId,
    phaseId: ref.phaseId,
    moduleId: ref.moduleId,
    chapterId: ref.chapterId,
    workspaceId: ref.workspaceId,
    type: input.type,
    title: input.title,
    objective: input.objective ?? "",
    content: input.content ?? null,
    order: input.order ?? 0,
    lifecycleStatus: "borrador",
  });
}

export async function listCards(ref: WorkspaceRef): Promise<Card[]> {
  return listNodes<Card>(cardsPath(ref));
}

export async function getCard(ref: CardRef): Promise<Card | null> {
  return getNode<Card>(cardPath(ref));
}

export async function updateCard(
  ref: CardRef,
  data: Partial<Pick<Card, "title" | "objective" | "content" | "order" | "lifecycleStatus">>,
): Promise<void> {
  return updateNode(cardPath(ref), data);
}

export async function archiveCard(ref: CardRef): Promise<void> {
  return archiveNode(cardPath(ref));
}
