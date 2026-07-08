import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

/** Debe coincidir con el limite de `storage.rules` (Sprint 11, auditoria de seguridad). */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export interface FileContent {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/**
 * Sube un archivo generico de una organizacion a Firebase Storage, bajo
 * organizations/{orgId}/uploads/{pathSegment}/{fileName} - ya cubierto por
 * storage.rules (aislamiento por organizacion + limite de tamaño
 * generico), sin cambios de reglas necesarios. Sprint 13: generalizado
 * (antes era especifico de Cards, que ya no existen - los Resources de un
 * Blueprint son siempre referencias externas, nunca archivos subidos aqui).
 */
export async function uploadFile(
  orgId: string,
  pathSegment: string,
  file: File,
): Promise<FileContent> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("El archivo supera el límite de 25MB.");
  }

  const path = `organizations/${orgId}/uploads/${pathSegment}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  try {
    await uploadBytes(storageRef, file);
  } catch (error) {
    if (error instanceof Error && error.message.includes("storage/unauthorized")) {
      throw new Error("El archivo supera el límite de 25MB o no tienes permiso para subirlo.");
    }
    throw error;
  }
  const url = await getDownloadURL(storageRef);

  return {
    url,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  };
}
