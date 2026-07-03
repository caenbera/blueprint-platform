import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { commentsPath, type CardRef } from "@/lib/firestore-hierarchy";
import type { Comment } from "@/types/domain";

/**
 * Comentarios de una Card: texto libre + autor + fecha, sin menciones ni
 * asignacion todavia (requeriria un directorio de miembros de la
 * organizacion - ver plan del Sprint 4). No reutiliza el motor generico
 * de lib/firestore-hierarchy.ts porque los comentarios se ordenan por
 * fecha, no por el campo "order" de los nodos jerarquicos.
 */
export async function createComment(ref: CardRef, text: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await addDoc(collection(db, commentsPath(ref)), {
    authorUid: user.uid,
    authorName: user.displayName || user.email || "Usuario",
    text,
    createdAt: serverTimestamp(),
  });
}

export async function listComments(ref: CardRef): Promise<Comment[]> {
  const snap = await getDocs(query(collection(db, commentsPath(ref)), orderBy("createdAt")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      authorUid: data.authorUid,
      authorName: data.authorName,
      text: data.text,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : "",
    };
  });
}
