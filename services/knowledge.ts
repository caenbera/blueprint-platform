import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { logActivity } from "@/services/activity";
import type { Card, KnowledgeCategory, KnowledgeItem } from "@/types/domain";

/**
 * Knowledge Base (Prompt 4.5/9): coleccion directa bajo la organizacion
 * (organizations/{orgId}/knowledgeItems), no anidada en la jerarquia
 * Project->Card. Ya cubierta por la regla wildcard generica de
 * firestore.rules, sin cambios de reglas necesarios.
 */

function knowledgeItemsPath(orgId: string) {
  return `organizations/${orgId}/knowledgeItems`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): KnowledgeItem {
  return {
    ...data,
    id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as KnowledgeItem;
}

export interface PromoteCardInput {
  card: Card;
  summary: string;
  category: KnowledgeCategory;
  tags: string[];
}

/** Crea un Knowledge Item como copia (snapshot) del contenido de una Card. */
export async function createKnowledgeItem(orgId: string, input: PromoteCardInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const ref = await addDoc(collection(db, knowledgeItemsPath(orgId)), {
    orgId,
    title: input.card.title,
    summary: input.summary,
    category: input.category,
    tags: input.tags,
    sourceCardId: input.card.id,
    sourceCardTitle: input.card.title,
    content: input.card.content,
    status: "borrador",
    relatedItemIds: [],
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  void logActivity(orgId, {
    action: "knowledge_promoted",
    summary: `Card promovida a Knowledge Base: "${input.card.title}"`,
  });
  return ref.id;
}

export async function listKnowledgeItems(orgId: string): Promise<KnowledgeItem[]> {
  const snap = await getDocs(
    query(collection(db, knowledgeItemsPath(orgId)), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function getKnowledgeItem(
  orgId: string,
  itemId: string,
): Promise<KnowledgeItem | null> {
  const snap = await getDoc(doc(db, knowledgeItemsPath(orgId), itemId));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}

export async function updateKnowledgeItem(
  orgId: string,
  itemId: string,
  data: Partial<Pick<KnowledgeItem, "summary" | "category" | "tags" | "status">>,
): Promise<void> {
  await updateDoc(doc(db, knowledgeItemsPath(orgId), itemId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Vincula dos Knowledge Items entre si (bidireccional - actualiza ambos lados). */
export async function linkKnowledgeItems(
  orgId: string,
  itemIdA: string,
  itemIdB: string,
): Promise<void> {
  const [itemA, itemB] = await Promise.all([
    getKnowledgeItem(orgId, itemIdA),
    getKnowledgeItem(orgId, itemIdB),
  ]);
  if (!itemA || !itemB) throw new Error("Uno de los elementos no existe.");

  await Promise.all([
    updateDoc(doc(db, knowledgeItemsPath(orgId), itemIdA), {
      relatedItemIds: Array.from(new Set([...itemA.relatedItemIds, itemIdB])),
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, knowledgeItemsPath(orgId), itemIdB), {
      relatedItemIds: Array.from(new Set([...itemB.relatedItemIds, itemIdA])),
      updatedAt: serverTimestamp(),
    }),
  ]);
}

/** Elimina el vinculo entre dos Knowledge Items (bidireccional). */
export async function unlinkKnowledgeItems(
  orgId: string,
  itemIdA: string,
  itemIdB: string,
): Promise<void> {
  const [itemA, itemB] = await Promise.all([
    getKnowledgeItem(orgId, itemIdA),
    getKnowledgeItem(orgId, itemIdB),
  ]);
  if (!itemA || !itemB) return;

  await Promise.all([
    updateDoc(doc(db, knowledgeItemsPath(orgId), itemIdA), {
      relatedItemIds: itemA.relatedItemIds.filter((id) => id !== itemIdB),
      updatedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, knowledgeItemsPath(orgId), itemIdB), {
      relatedItemIds: itemB.relatedItemIds.filter((id) => id !== itemIdA),
      updatedAt: serverTimestamp(),
    }),
  ]);
}
