import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import {
  archiveNode,
  cardPath,
  cardsPath,
  cardVersionsPath,
  createNode,
  getNode,
  listNodes,
  updateNode,
  type CardRef,
  type WorkspaceRef,
} from "@/lib/firestore-hierarchy";
import { logActivity } from "@/services/activity";
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
 * contenido especializado por tipo - Prompt 9) se construye en el
 * Sprint 5; esto solo deja la base de datos lista para esa fase.
 */
export async function createCard(ref: WorkspaceRef, input: CreateCardInput): Promise<string> {
  const id = await createNode(cardsPath(ref), {
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
  void logActivity(ref.orgId, {
    action: "card_created",
    summary: `Card creada: "${input.title}"`,
    workspaceRef: {
      projectId: ref.projectId,
      blueprintId: ref.blueprintId,
      phaseId: ref.phaseId,
      moduleId: ref.moduleId,
      chapterId: ref.chapterId,
      workspaceId: ref.workspaceId,
    },
  });
  return id;
}

export async function listCards(ref: WorkspaceRef): Promise<Card[]> {
  return listNodes<Card>(cardsPath(ref));
}

export async function getCard(ref: CardRef): Promise<Card | null> {
  return getNode<Card>(cardPath(ref));
}

/**
 * Antes de aplicar un cambio de titulo/objetivo/contenido, guarda un
 * snapshot del estado ANTERIOR en versions/ (Prompt 11: "nunca sobrescribir
 * informacion"). No versiona cambios que solo tocan lifecycleStatus/order.
 */
export async function updateCard(
  ref: CardRef,
  data: Partial<Pick<Card, "title" | "objective" | "content" | "order" | "lifecycleStatus">>,
): Promise<void> {
  const touchesContent = "title" in data || "objective" in data || "content" in data;

  if (touchesContent) {
    const current = await getCard(ref);
    const user = auth.currentUser;
    if (current && user) {
      await addDoc(collection(db, cardVersionsPath(ref)), {
        title: current.title,
        objective: current.objective,
        content: current.content,
        savedBy: user.uid,
        createdAt: serverTimestamp(),
      });
    }
  }

  return updateNode(cardPath(ref), data);
}

export async function archiveCard(ref: CardRef): Promise<void> {
  return archiveNode(cardPath(ref));
}
