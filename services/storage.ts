import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import type { CardRef } from "@/lib/firestore-hierarchy";
import type { FileContent } from "@/types/domain";

/**
 * Sube un archivo para una Card (tipos "archivo"/"imagen") a Firebase
 * Storage, bajo organizations/{orgId}/cards/{cardId}/{fileName} - ya
 * cubierto por storage.rules (aislamiento por organizacion), sin cambios
 * de reglas necesarios.
 */
export async function uploadCardFile(cardRef: CardRef, file: File): Promise<FileContent> {
  const path = `organizations/${cardRef.orgId}/cards/${cardRef.cardId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    url,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  };
}
