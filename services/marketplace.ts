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
import {
  createBlueprint,
  createChapter,
  createModule,
  createPhase,
  listChapters,
  listModules,
  listPhases,
} from "@/services/blueprints";
import { createWorkspace, listWorkspaces } from "@/services/workspaces";
import { createCard, listCards } from "@/services/cards";
import { createDocument, getDocumentById, updateDocument } from "@/services/documents";
import { createKnowledgeItemFromSnapshot, getKnowledgeItem } from "@/services/knowledge";
import type { BlueprintRef, ProjectRef } from "@/lib/firestore-hierarchy";
import type {
  BlueprintResourceSnapshot,
  DocumentResourceSnapshot,
  KnowledgeItemResourceSnapshot,
  MarketplaceResource,
  MarketplaceResourceType,
  MarketplaceVisibility,
} from "@/types/domain";

/**
 * Marketplace (Sprint 10): coleccion top-level `marketplaceResources` (no
 * anidada bajo organizations/{orgId} - ver comentario en firestore.rules).
 * "Incorporar" siempre lee el snapshot y crea copias nuevas via los
 * servicios ya existentes (createBlueprint/createDocument/etc.) - nunca
 * modifica el recurso publicado.
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
  snapshot: BlueprintResourceSnapshot | DocumentResourceSnapshot | KnowledgeItemResourceSnapshot,
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

/**
 * Lee recursivamente el arbol completo (Fases->Modulos->Capitulos->Workspaces->Cards)
 * para publicarlo. Exportada (Sprint 11) para poder probar la recursividad
 * con datos mockeados sin depender de una organizacion real.
 */
export async function buildBlueprintSnapshot(
  ref: BlueprintRef,
): Promise<BlueprintResourceSnapshot> {
  const phases = await listPhases(ref);
  const phaseSnapshots = await Promise.all(
    phases.map(async (phase) => {
      const phaseRef = { ...ref, phaseId: phase.id };
      const modules = await listModules(phaseRef);
      const moduleSnapshots = await Promise.all(
        modules.map(async (mod) => {
          const moduleRef = { ...phaseRef, moduleId: mod.id };
          const chapters = await listChapters(moduleRef);
          const chapterSnapshots = await Promise.all(
            chapters.map(async (chapter) => {
              const chapterRef = { ...moduleRef, chapterId: chapter.id };
              const workspaces = await listWorkspaces(chapterRef);
              const workspaceSnapshots = await Promise.all(
                workspaces.map(async (workspace) => {
                  const workspaceRef = { ...chapterRef, workspaceId: workspace.id };
                  const cards = await listCards(workspaceRef);
                  return {
                    name: workspace.name,
                    description: workspace.description,
                    order: workspace.order,
                    cards: cards.map((c) => ({
                      type: c.type,
                      title: c.title,
                      objective: c.objective,
                      content: c.content,
                      order: c.order,
                    })),
                  };
                }),
              );
              return {
                name: chapter.name,
                description: chapter.description,
                order: chapter.order,
                workspaces: workspaceSnapshots,
              };
            }),
          );
          return {
            name: mod.name,
            description: mod.description,
            order: mod.order,
            chapters: chapterSnapshots,
          };
        }),
      );
      return {
        name: phase.name,
        description: phase.description,
        order: phase.order,
        modules: moduleSnapshots,
      };
    }),
  );
  return { phases: phaseSnapshots };
}

export async function publishBlueprint(ref: BlueprintRef, meta: PublishMeta): Promise<string> {
  const snapshot = await buildBlueprintSnapshot(ref);
  return publish(ref.orgId, "blueprint", meta, snapshot);
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

/** Recrea el arbol completo dentro de un Proyecto destino - nunca modifica el recurso publicado. */
export async function importBlueprint(
  resource: MarketplaceResource,
  targetProjectRef: ProjectRef,
  title: string,
): Promise<string> {
  const snapshot = resource.snapshot as BlueprintResourceSnapshot;
  const blueprintId = await createBlueprint(targetProjectRef, {
    name: title,
    description: resource.description,
  });
  const blueprintRef: BlueprintRef = { ...targetProjectRef, blueprintId };

  for (const phase of snapshot.phases) {
    const phaseId = await createPhase(blueprintRef, {
      name: phase.name,
      description: phase.description,
      order: phase.order,
    });
    const phaseRef = { ...blueprintRef, phaseId };
    for (const mod of phase.modules) {
      const moduleId = await createModule(phaseRef, {
        name: mod.name,
        description: mod.description,
        order: mod.order,
      });
      const moduleRef = { ...phaseRef, moduleId };
      for (const chapter of mod.chapters) {
        const chapterId = await createChapter(moduleRef, {
          name: chapter.name,
          description: chapter.description,
          order: chapter.order,
        });
        const chapterRef = { ...moduleRef, chapterId };
        for (const workspace of chapter.workspaces) {
          const workspaceId = await createWorkspace(chapterRef, {
            name: workspace.name,
            description: workspace.description,
            order: workspace.order,
          });
          const workspaceRef = { ...chapterRef, workspaceId };
          for (const card of workspace.cards) {
            await createCard(workspaceRef, {
              type: card.type,
              title: card.title,
              objective: card.objective,
              content: card.content,
              order: card.order,
            });
          }
        }
      }
    }
  }

  return blueprintId;
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
