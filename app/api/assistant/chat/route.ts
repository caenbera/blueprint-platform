import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getAiProvider } from "@/lib/ai";
import { getAssistantModeConfig } from "@/config/assistant-modes";
import type { AiChatMessage, AiToolDefinition } from "@/lib/ai/types";
import type {
  AssistantMode,
  CreateCardActionPayload,
  CreateDocumentActionPayload,
  KnowledgeSourceRef,
  ProposedAction,
  ProposedActionType,
} from "@/types/domain";

interface NavigatorSelectionInput {
  projectId: string;
  blueprintId: string;
  phaseId?: string;
  phaseName?: string;
  moduleId?: string;
  moduleName?: string;
  chapterId?: string;
  chapterName?: string;
  workspaceId?: string;
  workspaceName?: string;
}

/** Tipos de Card cuyo contenido es texto plano (ver TEXT_TYPES en card-content-renderer.tsx) - los unicos proponibles por el Action Engine, ya que ProposedAction.payload.content es un string. */
const TEXT_CARD_TYPES = [
  "informacion",
  "objetivo",
  "pregunta",
  "respuesta",
  "documento",
  "resumen",
  "proceso",
  "plantilla",
];

const DOCUMENT_TEMPLATE_TYPES = [
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

const MAX_KB_CANDIDATES = 8;
const MAX_HISTORY_MESSAGES = 12;

function buildTools(hasWorkspace: boolean): AiToolDefinition[] {
  const tools: AiToolDefinition[] = [
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

  if (hasWorkspace) {
    tools.push({
      name: "propose_create_card",
      description:
        "Propone crear una nueva Card de tipo texto dentro del Workspace actualmente seleccionado. Nunca se ejecuta automaticamente: el usuario debe aprobarlo explicitamente.",
      inputSchema: {
        type: "object",
        properties: {
          cardType: { type: "string", enum: TEXT_CARD_TYPES },
          title: { type: "string" },
          objective: { type: "string" },
          content: { type: "string" },
        },
        required: ["cardType", "title", "content"],
      },
    });
  }

  return tools;
}

function buildHierarchyContext(selection: NavigatorSelectionInput | null): string {
  if (!selection) return "El usuario no tiene ningun nodo del Navigator seleccionado actualmente.";
  const parts = [
    `Proyecto/Blueprint activos (IDs internos, no mostrar): ${selection.projectId}/${selection.blueprintId}`,
  ];
  if (selection.phaseName) parts.push(`Fase: ${selection.phaseName}`);
  if (selection.moduleName) parts.push(`Modulo: ${selection.moduleName}`);
  if (selection.chapterName) parts.push(`Capitulo: ${selection.chapterName}`);
  if (selection.workspaceName) parts.push(`Workspace actual: ${selection.workspaceName}`);
  return parts.join("\n");
}

async function fetchWorkspaceCardsContext(
  orgId: string,
  selection: NavigatorSelectionInput,
): Promise<string> {
  if (!selection.workspaceId || !selection.chapterId || !selection.moduleId || !selection.phaseId) {
    return "";
  }
  const cardsPath =
    `organizations/${orgId}/projects/${selection.projectId}/blueprints/${selection.blueprintId}` +
    `/phases/${selection.phaseId}/modules/${selection.moduleId}/chapters/${selection.chapterId}` +
    `/workspaces/${selection.workspaceId}/cards`;

  const snap = await adminDb.collection(cardsPath).limit(30).get();
  if (snap.empty) return "El Workspace actual todavia no tiene Cards.";

  const lines = snap.docs.map((doc) => {
    const data = doc.data();
    return `- [${doc.id}] (${data.type}) "${data.title}" - objetivo: ${data.objective || "(sin objetivo)"}`;
  });
  return `Cards existentes en el Workspace actual:\n${lines.join("\n")}`;
}

interface KnowledgeCandidate {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
}

function scoreKnowledgeItem(item: KnowledgeCandidate, queryWords: string[]): number {
  const haystack =
    `${item.title} ${item.summary} ${item.category} ${item.tags.join(" ")}`.toLowerCase();
  return queryWords.reduce((score, word) => (haystack.includes(word) ? score + 1 : score), 0);
}

async function fetchKnowledgeContext(
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

function buildSystemPrompt(
  mode: AssistantMode,
  hierarchyContext: string,
  knowledgeContext: string,
): string {
  const modeConfig = getAssistantModeConfig(mode);
  return [
    "Eres el Blueprint AI Engine, el copiloto contextual de la plataforma Blueprint. NUNCA eres un chatbot generico.",
    "Reglas estrictas: (1) Nunca modificas contenido de la organizacion sin aprobacion explicita del usuario - para proponer una accion, usa SIEMPRE las herramientas disponibles, nunca describas la accion como si ya estuviera hecha. (2) Siempre explicas de donde proviene la informacion que usas, citando `[KB:id]` cuando la tomas de la Knowledge Base.",
    `Modo activo: ${modeConfig.label}. ${modeConfig.systemInstruction}`,
    "Contexto de la jerarquia actual (Navigator):",
    hierarchyContext,
    knowledgeContext,
  ].join("\n\n");
}

function extractSources(text: string, candidates: KnowledgeCandidate[]): KnowledgeSourceRef[] {
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

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Falta el token de autenticación." }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Token de autenticación inválido." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const mode: AssistantMode = body?.mode ?? "consultor";
  const selection: NavigatorSelectionInput | null = body?.selection ?? null;
  if (!message) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });
  }

  const indexSnap = await adminDb.collection("userOrgIndex").doc(uid).get();
  const orgId = indexSnap.data()?.orgId as string | undefined;
  if (!orgId) {
    return NextResponse.json(
      { error: "El usuario no pertenece a ninguna organización." },
      { status: 403 },
    );
  }

  // Context Engine
  const hierarchyContext = buildHierarchyContext(selection);
  const workspaceCardsContext = selection ? await fetchWorkspaceCardsContext(orgId, selection) : "";

  // Knowledge Engine
  const { contextText: knowledgeContext, candidates } = await fetchKnowledgeContext(orgId, message);

  // Prompt Engine
  const systemPrompt = buildSystemPrompt(
    mode,
    [hierarchyContext, workspaceCardsContext].filter(Boolean).join("\n\n"),
    knowledgeContext,
  );

  const messagesPath = `organizations/${orgId}/aiConversations/${uid}/messages`;
  const historySnap = await adminDb
    .collection(messagesPath)
    .orderBy("createdAt", "desc")
    .limit(MAX_HISTORY_MESSAGES)
    .get();
  const history: AiChatMessage[] = historySnap.docs
    .reverse()
    .map((doc) => ({ role: doc.data().role, content: doc.data().content }));

  const tools = buildTools(Boolean(selection?.workspaceId));

  let completion;
  try {
    completion = await getAiProvider().complete({
      systemPrompt,
      messages: [...history, { role: "user", content: message }],
      tools,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `El proveedor de IA falló: ${detail}` }, { status: 502 });
  }

  const sources = extractSources(completion.text, candidates);
  const proposedActions: ProposedAction[] = completion.toolCalls.map((call) => {
    if (call.name === "propose_create_card") {
      const input = call.input as Partial<CreateCardActionPayload>;
      return {
        id: randomUUID(),
        type: "create_card" as ProposedActionType,
        summary: `Crear Card "${input.title}"`,
        payload: {
          cardType: input.cardType,
          title: input.title,
          objective: input.objective ?? "",
          content: input.content,
        } as CreateCardActionPayload,
      };
    }
    const input = call.input as Partial<CreateDocumentActionPayload>;
    return {
      id: randomUUID(),
      type: "create_document" as ProposedActionType,
      summary: `Crear documento "${input.title}"`,
      payload: {
        title: input.title,
        templateType: input.templateType,
        sections: input.sections ?? [],
      } as CreateDocumentActionPayload,
    };
  });

  await adminDb.collection(messagesPath).add({
    role: "assistant",
    content: completion.text,
    mode,
    sources,
    proposedActions,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ reply: completion.text, sources, proposedActions });
}
