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
import type { PlatformAuditAction, PlatformAuditLogEntry } from "@/types/domain";

/**
 * Auditoría de plataforma (Sprint 16): coleccion top-level
 * `platformAuditLog`, solo Super Admin lee/escribe (ver firestore.rules).
 * Efecto secundario "best-effort", mismo criterio que
 * services/activity.ts#logActivity - nunca debe hacer fallar la accion
 * principal si el registro de auditoria falla.
 */

const COLLECTION = "platformAuditLog";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

export async function logPlatformAction(input: {
  action: PlatformAuditAction;
  summary: string;
  targetOrgId?: string;
  targetOrgName?: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, COLLECTION), {
      action: input.action,
      summary: input.summary,
      actorUid: user.uid,
      actorName: user.displayName || user.email || "Super Admin",
      ...(input.targetOrgId ? { targetOrgId: input.targetOrgId } : {}),
      ...(input.targetOrgName ? { targetOrgName: input.targetOrgName } : {}),
      createdAt: serverTimestamp(),
    });
  } catch {
    // No critico: si la auditoria falla, la accion principal ya se aplico.
  }
}

export async function listPlatformAuditLog(max = 100): Promise<PlatformAuditLogEntry[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("createdAt", "desc")));
  return snap.docs.slice(0, max).map((d) => {
    const data = d.data();
    return {
      id: d.id,
      action: data.action,
      summary: data.summary,
      actorUid: data.actorUid,
      actorName: data.actorName,
      targetOrgId: data.targetOrgId,
      targetOrgName: data.targetOrgName,
      createdAt: toIso(data.createdAt),
    };
  });
}
