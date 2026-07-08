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
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { validateBlueprintJson } from "@/lib/blueprint-schema";
import type { Blueprint, BlueprintPhase, BlueprintStatus } from "@/types/domain";

/**
 * Blueprints (Sprint 13, motor de datos nuevo): coleccion TOP-LEVEL
 * `blueprints/{id}` (no anidada bajo organizations/{orgId}) - un Blueprint
 * es una plantilla de plataforma, no pertenece a ninguna organizacion.
 * Escritura exclusiva de Super Admin (ver firestore.rules); cualquier
 * usuario autenticado puede leer los que esten `status == "published"`.
 */

const COLLECTION = "blueprints";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): Blueprint {
  return {
    ...data,
    id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as Blueprint;
}

/** Blueprints visibles para cualquier organizacion (pantalla "Elegir Blueprint"). */
export async function listPublishedBlueprints(): Promise<Blueprint[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where("status", "==", "published" satisfies BlueprintStatus)),
  );
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

/** Todos los Blueprints sin filtrar por status (Panel de Super Admin). */
export async function listAllBlueprints(): Promise<Blueprint[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function getBlueprint(blueprintId: string): Promise<Blueprint | null> {
  const snap = await getDoc(doc(db, COLLECTION, blueprintId));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}

/**
 * Valida un archivo JSON contra el schema oficial (lib/blueprint-schema.ts)
 * y crea el Blueprint completo de una sola vez - flujo priorizado del
 * Constructor de Blueprints (Sprint 17: "importar JSON primero"). El `id`
 * del template se ignora; Firestore asigna su propio ID de documento.
 */
export async function importBlueprintFromJson(json: unknown): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const blueprint = validateBlueprintJson(json);
  const ref = await addDoc(collection(db, COLLECTION), {
    ...blueprint,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBlueprintStatus(
  blueprintId: string,
  status: BlueprintStatus,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, blueprintId), { status, updatedAt: serverTimestamp() });
}

/** Editor del Blueprint (Sprint 17) - metadata general, nunca el roadmap (ver updateBlueprintRoadmap). */
export async function updateBlueprintMeta(
  blueprintId: string,
  data: Partial<
    Pick<
      Blueprint,
      "name" | "description" | "category" | "industry" | "difficulty" | "estimatedDuration" | "tags"
    >
  >,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, blueprintId), { ...data, updatedAt: serverTimestamp() });
}

/**
 * Guarda el roadmap completo (Editor del Blueprint, Sprint 17). Firestore
 * no soporta editar un elemento de un array por indice - el cliente muta
 * una copia local del array completo (ver app/(app)/admin/blueprints/
 * [blueprintId]/page.tsx) y esta funcion la reescribe entera.
 */
export async function updateBlueprintRoadmap(
  blueprintId: string,
  roadmap: BlueprintPhase[],
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, blueprintId), { roadmap, updatedAt: serverTimestamp() });
}
