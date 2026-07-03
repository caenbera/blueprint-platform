import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { cardVersionsPath, type CardRef } from "@/lib/firestore-hierarchy";
import type { CardVersion } from "@/types/domain";

/**
 * Historial de versiones de una Card, de solo lectura aqui - la escritura
 * ocurre automaticamente dentro de services/cards.ts#updateCard. Restaurar
 * una version anterior queda fuera de este alcance (ver plan Sprint 4).
 */
export async function listCardVersions(ref: CardRef): Promise<CardVersion[]> {
  const snap = await getDocs(
    query(collection(db, cardVersionsPath(ref)), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      objective: data.objective,
      content: data.content,
      savedBy: data.savedBy,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : "",
    };
  });
}
