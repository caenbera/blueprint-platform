import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getAiProvider } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildHierarchyContext,
  buildSystemPrompt,
  buildTools,
  extractSources,
  fetchKnowledgeContext,
  fetchStepContext,
  type NavigatorSelectionInput,
} from "@/lib/ai/assistant-context";
import type { AiChatMessage } from "@/lib/ai/types";
import type {
  AssistantMode,
  CreateDocumentActionPayload,
  ProposedAction,
  ProposedActionType,
} from "@/types/domain";

const MAX_HISTORY_MESSAGES = 12;

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

  // Rate limiting (Sprint 11, auditoria de seguridad): cada solicitud llama
  // a una API de pago, sin esto un usuario podia disparar solicitudes sin
  // limite. 20 solicitudes / 10 minutos por usuario.
  const rateLimit = await checkRateLimit(uid, {
    key: "assistant-chat",
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Demasiadas solicitudes al Assistant. Intenta de nuevo en ${Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)} segundos.`,
      },
      { status: 429 },
    );
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
  const stepContext = selection ? await fetchStepContext(orgId, selection) : "";

  // Knowledge Engine
  const { contextText: knowledgeContext, candidates } = await fetchKnowledgeContext(orgId, message);

  // Prompt Engine
  const systemPrompt = buildSystemPrompt(
    mode,
    [hierarchyContext, stepContext].filter(Boolean).join("\n\n"),
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

  const tools = buildTools();

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
