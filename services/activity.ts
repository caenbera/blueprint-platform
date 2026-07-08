import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  limit as fbLimit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { ActivityAction, ActivityLogEntry, ActivityProjectRef } from "@/types/domain";

/**
 * Activity Log (Mission Control, Sprint 9): coleccion directa bajo la
 * organizacion (organizations/{orgId}/activityLog), ya anticipada y
 * cubierta por la regla wildcard generica de firestore.rules. Alcance
 * minimo deliberado: solo se registran los eventos de mayor valor (crear
 * Card, promover a Knowledge Base, crear/exportar Documento), no cada
 * edicion menor de cada entidad.
 */

function activityLogPath(orgId: string) {
  return `organizations/${orgId}/activityLog`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

/**
 * Efecto secundario "best-effort": nunca debe hacer fallar la operacion
 * principal (crear una Card, etc.) si el registro de actividad falla.
 */
export async function logActivity(
  orgId: string,
  input: { action: ActivityAction; summary: string; projectRef?: ActivityProjectRef },
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, activityLogPath(orgId)), {
      action: input.action,
      summary: input.summary,
      actorUid: user.uid,
      actorName: user.displayName || user.email || "Usuario",
      ...(input.projectRef ? { projectRef: input.projectRef } : {}),
      createdAt: serverTimestamp(),
    });
  } catch {
    // No critico: si el Activity Log falla, la operacion principal ya se aplico.
  }
}

export async function listRecentActivity(orgId: string, max = 20): Promise<ActivityLogEntry[]> {
  const snap = await getDocs(
    query(collection(db, activityLogPath(orgId)), orderBy("createdAt", "desc"), fbLimit(max)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      action: data.action,
      summary: data.summary,
      actorUid: data.actorUid,
      actorName: data.actorName,
      projectRef: data.projectRef,
      createdAt: toIso(data.createdAt),
    };
  });
}
