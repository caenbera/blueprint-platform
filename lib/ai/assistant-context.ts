import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { getAssistantModeConfig } from "@/config/assistant-modes";
import type { AiToolDefinition } from "@/lib/ai/types";
import type { AssistantMode, KnowledgeSourceRef } from "@/types/domain";

/**
 * Context/Knowledge/Prompt Engine - logica pura extraida de
 * app/api/assistant/chat/route.ts para que sea testeable sin depender de
 * las convenciones de exportacion de un Route Handler de Next.js. Sprint
 * 13: adaptado al motor de datos nuevo (Proyecto -> Step), ya no hay
 * Workspace/Cards.
 */

export interface NavigatorSelectionInput {
  projectId: string;
  projectName?: string;
  stepId?: string;
  stepTitle?: string;
}

export const DOCUMENT_TEMPLATE_TYPES = [
  "plan_negocio",
  "modelo_negocio",
  "propuesta_comercial",
  "plan_estrategico",
  "manual_procesos",
  "manual_operativo",
  "informe_ejecutivo",
  "diagnostico_empresarial",
  "presentacion",
  "reporte_financiero",
  "personalizado",
];

export const MAX_KB_CANDIDATES = 8;

export function buildTools(): AiToolDefinition[] {
  return [
    {
      name: "propose_create_document",
      description:
        "Propone crear un nuevo documento en el Documents Center a partir de la conversacion. Nunca se ejecuta automaticamente: el usuario debe aprobarlo explicitamente.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titulo del documento" },
          templateType: { type: "string", enum: DOCUMENT_TEMPLATE_TYPES },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
              },
              required: ["title", "content"],
            },
          },
        },
        required: ["title", "templateType", "sections"],
      },
    },
  ];
}

export function buildHierarchyContext(selection: NavigatorSelectionInput | null): string {
  if (!selection) return "El usuario no tiene ningun Proyecto ni Step seleccionado actualmente.";
  const parts = [`Proyecto activo (ID interno, no mostrar): ${selection.projectId}`];
  if (selection.projectName) parts.push(`Proyecto: ${selection.projectName}`);
  if (selection.stepTitle) parts.push(`Step actual: ${selection.stepTitle}`);
  return parts.join("\n");
}

/** Busca un Step por ID dentro de un roadmap (estructura cruda de Firestore, sin tipar). */
function findStepInRoadmap(
  roadmap: unknown,
  stepId: string,
): {
  title?: string;
  content?: { objective?: { description?: string }; overview?: { summary?: string } };
} | null {
  if (!Array.isArray(roadmap)) return null;
  for (const phase of roadmap) {
    const steps = (phase as { steps?: unknown[] })?.steps;
    if (!Array.isArray(steps)) continue;
    const step = steps.find((s) => (s as { id?: string })?.id === stepId);
    if (step) return step as ReturnType<typeof findStepInRoadmap>;
  }
  return null;
}

/** Trae contexto adicional del Step activo (objetivo/resumen) desde el snapshot congelado del Proyecto. */
export async function fetchStepContext(
  orgId: string,
  selection: NavigatorSelectionInput,
): Promise<string> {
  if (!selection.projectId || !selection.stepId) return "";

  const snap = await adminDb.doc(`organizations/${orgId}/projects/${selection.projectId}`).get();
  if (!snap.exists) return "";

  const blueprintSnapshot = snap.data()?.blueprintSnapshot;
  const step = findStepInRoadmap(blueprintSnapshot?.roadmap, selection.stepId);
  if (!step) return "";

  const lines = [`Step actual: "${step.title ?? selection.stepTitle ?? ""}"`];
  if (step.content?.objective?.description) {
    lines.push(`Objetivo: ${step.content.objective.description}`);
  }
  if (step.content?.overview?.summary) {
    lines.push(`Resumen: ${step.content.overview.summary}`);
  }
  return lines.join("\n");
}

export interface KnowledgeCandidate {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
}

export function scoreKnowledgeItem(item: KnowledgeCandidate, queryWords: string[]): number {
  const haystack =
    `${item.title} ${item.summary} ${item.category} ${item.tags.join(" ")}`.toLowerCase();
  return queryWords.reduce((score, word) => (haystack.includes(word) ? score + 1 : score), 0);
}

export async function fetchKnowledgeContext(
  orgId: string,
  message: string,
): Promise<{ contextText: string; candidates: KnowledgeCandidate[] }> {
  const snap = await adminDb
    .collection(`organizations/${orgId}/knowledgeItems`)
    .where("status", "==", "aprobado")
    .limit(200)
    .get();

  if (snap.empty) {
    return {
      contextText: "La Knowledge Base todavia no tiene elementos aprobados.",
      candidates: [],
    };
  }

  const queryWords = message
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const candidates: KnowledgeCandidate[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title ?? "",
      summary: data.summary ?? "",
      category: data.category ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  });

  const ranked = candidates
    .map((c) => ({ candidate: c, score: scoreKnowledgeItem(c, queryWords) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_KB_CANDIDATES)
    .filter((r) => r.score > 0);

  if (ranked.length === 0) {
    return {
      contextText: "Ningun Knowledge Item aprobado coincide claramente con la pregunta.",
      candidates: [],
    };
  }

  const lines = ranked.map(
    (r) =>
      `[KB:${r.candidate.id}] "${r.candidate.title}" (${r.candidate.category}) - ${r.candidate.summary}`,
  );
  return {
    contextText: `Knowledge Items relevantes (cita SIEMPRE usando el tag exacto [KB:id] cuando uses esta informacion):\n${lines.join("\n")}`,
    candidates: ranked.map((r) => r.candidate),
  };
}

export function buildSystemPrompt(
  mode: AssistantMode,
  hierarchyContext: string,
  knowledgeContext: string,
): string {
  const modeConfig = getAssistantModeConfig(mode);
  return [
    "Eres el Blueprint AI Engine, el copiloto contextual de la plataforma Blueprint. NUNCA eres un chatbot generico.",
    "Reglas estrictas: (1) Nunca modificas contenido de la organizacion sin aprobacion explicita del usuario - para proponer una accion, usa SIEMPRE las herramientas disponibles, nunca describas la accion como si ya estuviera hecha. (2) Siempre explicas de donde proviene la informacion que usas, citando `[KB:id]` cuando la tomas de la Knowledge Base.",
    `Modo activo: ${modeConfig.label}. ${modeConfig.systemInstruction}`,
    "Contexto del Proyecto/Step actual:",
    hierarchyContext,
    knowledgeContext,
  ].join("\n\n");
}

export function extractSources(
  text: string,
  candidates: KnowledgeCandidate[],
): KnowledgeSourceRef[] {
  const matches = [...text.matchAll(/\[KB:([\w-]+)\]/g)].map((m) => m[1]);
  const uniqueIds = Array.from(new Set(matches));
  return uniqueIds
    .map((id) => candidates.find((c) => c.id === id))
    .filter((c): c is KnowledgeCandidate => Boolean(c))
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category as KnowledgeSourceRef["category"],
    }));
}
