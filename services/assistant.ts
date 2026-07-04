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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { AiMessage, AssistantMode, AssistantRecommendation } from "@/types/domain";
import type { NavigatorSelection } from "@/providers/navigator-provider";

/**
 * Assistant Panel (Sprint 8): conversacion continua por usuario por
 * organizacion (organizations/{orgId}/aiConversations/{uid}/messages), ya
 * cubierta por la regla wildcard generica de firestore.rules. El mensaje del
 * usuario se guarda aqui (SDK cliente); la respuesta del asistente la guarda
 * la API route (adminDb), que es quien realmente llama al proveedor de IA.
 */

function messagesPath(orgId: string, uid: string) {
  return `organizations/${orgId}/aiConversations/${uid}/messages`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): AiMessage {
  return { ...data, id, createdAt: toIso(data.createdAt) } as AiMessage;
}

export async function listMessages(orgId: string, uid: string): Promise<AiMessage[]> {
  const snap = await getDocs(
    query(collection(db, messagesPath(orgId, uid)), orderBy("createdAt", "asc")),
  );
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export interface AssistantChatResponse {
  reply: string;
  sources: AiMessage["sources"];
  proposedActions: AiMessage["proposedActions"];
}

export async function sendMessage(
  orgId: string,
  text: string,
  mode: AssistantMode,
  selection: NavigatorSelection | null,
): Promise<AssistantChatResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await addDoc(collection(db, messagesPath(orgId, user.uid)), {
    role: "user",
    content: text,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });

  const idToken = await user.getIdToken();
  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ message: text, mode, selection }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "El Assistant no pudo responder.");
  }

  return response.json();
}

/** Recomendacion cacheada (Mission Control, Sprint 9) - lectura directa, sin llamar al proveedor de IA. */
export async function getCachedRecommendation(
  orgId: string,
): Promise<AssistantRecommendation | null> {
  const snap = await getDoc(doc(db, `organizations/${orgId}/assistantRecommendations`, "latest"));
  if (!snap.exists()) return null;
  return snap.data() as AssistantRecommendation;
}

/** Genera una recomendacion nueva bajo demanda (llama al AI Engine vía la API route; el servidor resuelve el orgId desde el token). */
export async function generateRecommendation(): Promise<AssistantRecommendation> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const idToken = await user.getIdToken();
  const response = await fetch("/api/assistant/recommendations", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "No se pudo generar la recomendación.");
  }

  return response.json();
}
