import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getAiProvider } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Assistant Recommendations (Mission Control widget, Sprint 9): unico
 * widget que llama al AI Engine. Generacion bajo demanda (boton "Generar"
 * en el cliente, nunca automatica) para no disparar costos de API en cada
 * carga del dashboard - el resultado se cachea en
 * organizations/{orgId}/assistantRecommendations/latest.
 */
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

  // Rate limiting (Sprint 11, auditoria de seguridad): ya esta detras de un
  // boton "Generar" en el cliente, pero igual necesita un techo. 5 / hora
  // por usuario.
  const rateLimit = await checkRateLimit(uid, {
    key: "assistant-recommendations",
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Demasiadas recomendaciones generadas. Intenta de nuevo en ${Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)} segundos.`,
      },
      { status: 429 },
    );
  }

  const indexSnap = await adminDb.collection("userOrgIndex").doc(uid).get();
  const orgId = indexSnap.data()?.orgId as string | undefined;
  if (!orgId) {
    return NextResponse.json(
      { error: "El usuario no pertenece a ninguna organización." },
      { status: 403 },
    );
  }

  const [projectsSnap, knowledgeSnap, documentsSnap] = await Promise.all([
    adminDb.collection(`organizations/${orgId}/projects`).get(),
    adminDb.collection(`organizations/${orgId}/knowledgeItems`).get(),
    adminDb.collection(`organizations/${orgId}/documents`).get(),
  ]);

  const knowledgeByStatus: Record<string, number> = {};
  for (const doc of knowledgeSnap.docs) {
    const status = doc.data().status ?? "desconocido";
    knowledgeByStatus[status] = (knowledgeByStatus[status] ?? 0) + 1;
  }
  const documentsByStatus: Record<string, number> = {};
  for (const doc of documentsSnap.docs) {
    const status = doc.data().status ?? "desconocido";
    documentsByStatus[status] = (documentsByStatus[status] ?? 0) + 1;
  }

  const summary = [
    `Proyectos activos: ${projectsSnap.size}.`,
    `Knowledge Items por estado: ${JSON.stringify(knowledgeByStatus)}.`,
    `Documentos por estado: ${JSON.stringify(documentsByStatus)}.`,
  ].join(" ");

  let completion;
  try {
    const provider = await getAiProvider();
    completion = await provider.complete({
      systemPrompt:
        "Eres el Blueprint AI Engine en modo Estratega. Da 1 o 2 recomendaciones breves y accionables (2-3 frases en total) basadas en el estado actual de la organización que te resumen a continuación. No inventes datos que no te dieron. No uses listas ni markdown, solo texto plano.",
      messages: [{ role: "user", content: summary }],
      tools: [],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: `El proveedor de IA falló: ${detail}` }, { status: 502 });
  }

  const recommendation = { text: completion.text, generatedAt: new Date().toISOString() };
  await adminDb
    .collection(`organizations/${orgId}/assistantRecommendations`)
    .doc("latest")
    .set(recommendation);

  return NextResponse.json(recommendation);
}
