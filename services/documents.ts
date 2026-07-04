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
import type {
  BlueprintDocument,
  DocumentSection,
  DocumentStatus,
  DocumentTemplateType,
} from "@/types/domain";

/**
 * Documents Center (Prompt 4.6): coleccion directa bajo la organizacion
 * (organizations/{orgId}/documents), mismo patron que knowledgeItems
 * (Sprint 6). Ya cubierta por la regla wildcard generica de
 * firestore.rules, sin cambios de reglas necesarios.
 */

export function documentsPath(orgId: string) {
  return `organizations/${orgId}/documents`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): BlueprintDocument {
  return {
    ...data,
    id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as BlueprintDocument;
}

export async function createDocument(
  orgId: string,
  title: string,
  templateType: DocumentTemplateType,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const ref = await addDoc(collection(db, documentsPath(orgId)), {
    orgId,
    title,
    templateType,
    status: "borrador" satisfies DocumentStatus,
    sections: [] satisfies DocumentSection[],
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listDocuments(orgId: string): Promise<BlueprintDocument[]> {
  const snap = await getDocs(
    query(collection(db, documentsPath(orgId)), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function getDocumentById(
  orgId: string,
  docId: string,
): Promise<BlueprintDocument | null> {
  const snap = await getDoc(doc(db, documentsPath(orgId), docId));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}

export async function updateDocument(
  orgId: string,
  docId: string,
  data: Partial<Pick<BlueprintDocument, "title" | "status" | "sections">>,
): Promise<void> {
  await updateDoc(doc(db, documentsPath(orgId), docId), { ...data, updatedAt: serverTimestamp() });
}
