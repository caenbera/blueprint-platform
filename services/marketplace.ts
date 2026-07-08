import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { createDocument, getDocumentById, updateDocument } from "@/services/documents";
import { createKnowledgeItemFromSnapshot, getKnowledgeItem } from "@/services/knowledge";
import type {
  DocumentResourceSnapshot,
  KnowledgeItemResourceSnapshot,
  MarketplaceResource,
  MarketplaceResourceType,
  MarketplaceVisibility,
} from "@/types/domain";

/**
 * Marketplace: coleccion top-level `marketplaceResources` (no anidada bajo
 * organizations/{orgId} - ver comentario en firestore.rules). "Incorporar"
 * siempre lee el snapshot y crea copias nuevas via los servicios ya
 * existentes - nunca modifica el recurso publicado. Sprint 13: los
 * Blueprints ya no se publican/incorporan via Marketplace (su autoria es
 * exclusiva de Super Admin, y su descubrimiento es directo via
 * services/blueprints.ts#listPublishedBlueprints) - el Marketplace queda
 * para Documentos y Knowledge Items.
 */

const COLLECTION = "marketplaceResources";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function fromFirestore(id: string, data: Record<string, unknown>): MarketplaceResource {
  return {
    ...data,
    id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as MarketplaceResource;
}

export interface PublishMeta {
  title: string;
  description: string;
  visibility: MarketplaceVisibility;
  orgName: string;
}

async function publish(
  orgId: string,
  resourceType: MarketplaceResourceType,
  meta: PublishMeta,
  snapshot: DocumentResourceSnapshot | KnowledgeItemResourceSnapshot,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay sesión activa.");

  const ref = await addDoc(collection(db, COLLECTION), {
    resourceType,
    title: meta.title,
    description: meta.description,
    visibility: meta.visibility,
    orgId,
    orgName: meta.orgName,
    publishedBy: user.uid,
    publishedByName: user.displayName || user.email || "Usuario",
    status: "publicado",
    snapshot,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function publishDocument(
  orgId: string,
  documentId: string,
  meta: PublishMeta,
): Promise<string> {
  const document = await getDocumentById(orgId, documentId);
  if (!document) throw new Error("El documento no existe.");
  const snapshot: DocumentResourceSnapshot = {
    templateType: document.templateType,
    sections: document.sections
      .filter((s) => !s.hidden)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ title: s.title, content: s.content })),
  };
  return publish(orgId, "document", meta, snapshot);
}

export async function publishKnowledgeItem(
  orgId: string,
  itemId: string,
  meta: PublishMeta,
): Promise<string> {
  const item = await getKnowledgeItem(orgId, itemId);
  if (!item) throw new Error("El Knowledge Item no existe.");
  const snapshot: KnowledgeItemResourceSnapshot = {
    category: item.category,
    tags: item.tags,
    summary: item.summary,
    content: item.content,
  };
  return publish(orgId, "knowledge_item", meta, snapshot);
}

/** Dos queries simples (publico + organizacional), en vez de un `or()` compuesto que arriesgaria pedir un indice manual. */
export async function listMarketplaceResources(orgId: string): Promise<MarketplaceResource[]> {
  const [publicSnap, orgSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, COLLECTION),
        where("visibility", "==", "public"),
        where("status", "==", "publicado"),
      ),
    ),
    getDocs(
      query(
        collection(db, COLLECTION),
        where("visibility", "==", "organization"),
        where("orgId", "==", orgId),
        where("status", "==", "publicado"),
      ),
    ),
  ]);

  const byId = new Map<string, MarketplaceResource>();
  for (const d of [...publicSnap.docs, ...orgSnap.docs]) {
    byId.set(d.id, fromFirestore(d.id, d.data()));
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function archiveMarketplaceResource(resourceId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, resourceId), {
    status: "archivado",
    updatedAt: serverTimestamp(),
  });
}

export async function importDocument(
  orgId: string,
  resource: MarketplaceResource,
): Promise<string> {
  const snapshot = resource.snapshot as DocumentResourceSnapshot;
  const docId = await createDocument(orgId, resource.title, snapshot.templateType);
  await updateDocument(orgId, docId, {
    sections: snapshot.sections.map((s, i) => ({
      id: crypto.randomUUID(),
      title: s.title,
      content: s.content,
      sourceKnowledgeItemId: null,
      hidden: false,
      order: i,
    })),
  });
  return docId;
}

export async function importKnowledgeItem(
  orgId: string,
  resource: MarketplaceResource,
): Promise<string> {
  const snapshot = resource.snapshot as KnowledgeItemResourceSnapshot;
  return createKnowledgeItemFromSnapshot(orgId, {
    title: resource.title,
    category: snapshot.category,
    tags: snapshot.tags,
    summary: snapshot.summary,
    content: snapshot.content,
  });
}
