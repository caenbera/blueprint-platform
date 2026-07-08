import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { AiProviderName, PlatformAiSettings, PlatformGeneralSettings } from "@/types/domain";

/**
 * Configuración global de plataforma (Sprint 18): coleccion top-level
 * `platformConfig`, documentos fijos `general` y `aiSettings`. Solo Super
 * Admin escribe (ver firestore.rules); cualquier usuario autenticado
 * puede leer.
 */

const COLLECTION = "platformConfig";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

const DEFAULT_GENERAL: Omit<PlatformGeneralSettings, "updatedBy" | "updatedAt"> = {
  platformName: "Blueprint",
  allowNewRegistrations: true,
  maintenanceMode: false,
};

export async function getGeneralSettings(): Promise<PlatformGeneralSettings> {
  const snap = await getDoc(doc(db, COLLECTION, "general"));
  if (!snap.exists()) {
    return { ...DEFAULT_GENERAL, updatedBy: "", updatedAt: new Date().toISOString() };
  }
  const data = snap.data();
  return {
    platformName: data.platformName ?? DEFAULT_GENERAL.platformName,
    allowNewRegistrations: data.allowNewRegistrations ?? DEFAULT_GENERAL.allowNewRegistrations,
    maintenanceMode: data.maintenanceMode ?? DEFAULT_GENERAL.maintenanceMode,
    updatedBy: data.updatedBy ?? "",
    updatedAt: toIso(data.updatedAt),
  };
}

export async function updateGeneralSettings(
  data: Pick<PlatformGeneralSettings, "platformName" | "allowNewRegistrations" | "maintenanceMode">,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await setDoc(doc(db, COLLECTION, "general"), {
    ...data,
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });
}

const DEFAULT_PROVIDER: AiProviderName = "anthropic";

export async function getAiSettings(): Promise<PlatformAiSettings> {
  const snap = await getDoc(doc(db, COLLECTION, "aiSettings"));
  if (!snap.exists()) {
    return { provider: DEFAULT_PROVIDER, updatedBy: "", updatedAt: new Date().toISOString() };
  }
  const data = snap.data();
  return {
    provider: data.provider ?? DEFAULT_PROVIDER,
    updatedBy: data.updatedBy ?? "",
    updatedAt: toIso(data.updatedAt),
  };
}

export async function updateAiSettings(provider: AiProviderName): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  await setDoc(doc(db, COLLECTION, "aiSettings"), {
    provider,
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });
}
