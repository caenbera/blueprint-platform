import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import type { CardRef } from "@/lib/firestore-hierarchy";
import type { FileContent } from "@/types/domain";

/** Debe coincidir con el limite de `storage.rules` (Sprint 11, auditoria de seguridad). */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * Sube un archivo para una Card (tipos "archivo"/"imagen") a Firebase
 * Storage, bajo organizations/{orgId}/cards/{cardId}/{fileName} - ya
 * cubierto por storage.rules (aislamiento por organizacion + limite de
 * tamaño), sin cambios de reglas necesarios.
 */
export async function uploadCardFile(cardRef: CardRef, file: File): Promise<FileContent> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("El archivo supera el límite de 25MB.");
  }

  const path = `organizations/${cardRef.orgId}/cards/${cardRef.cardId}/${Date.now()}-${file.name}`;
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
