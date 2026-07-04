import { describe, expect, it, vi } from "vitest";

/**
 * `assistant-context.ts` importa `adminDb` (Admin SDK) a nivel de modulo -
 * sin este mock, `lib/firebase/admin.ts` intentaria construir credenciales
 * reales con `cert()` y fallaria en el entorno de pruebas.
 */
function createQueryStub(snapshot: { empty: boolean; docs: unknown[] }) {
  const stub: Record<string, unknown> = {};
  stub.where = vi.fn(() => stub);
  stub.limit = vi.fn(() => stub);
  stub.orderBy = vi.fn(() => stub);
  stub.get = vi.fn(async () => snapshot);
  return stub;
}

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: { collection: vi.fn() },
}));

import { adminDb } from "@/lib/firebase/admin";
import {
  buildHierarchyContext,
  buildSystemPrompt,
  buildTools,
  extractSources,
  fetchKnowledgeContext,
  scoreKnowledgeItem,
  type KnowledgeCandidate,
} from "@/lib/ai/assistant-context";

describe("scoreKnowledgeItem", () => {
  it("suma un punto por cada palabra de la consulta que aparece en el item", () => {
    const item: KnowledgeCandidate = {
      id: "k1",
      title: "Plan de precios",
      summary: "Estrategia de precios para el 2026",
      category: "finanzas",
      tags: ["precios"],
    };
    expect(scoreKnowledgeItem(item, ["precios", "estrategia"])).toBe(2);
    expect(scoreKnowledgeItem(item, ["marketing"])).toBe(0);
  });
});

describe("extractSources", () => {
  it("extrae los tags [KB:id] citados y los mapea a los candidatos, sin duplicados", () => {
    const candidates: KnowledgeCandidate[] = [
      { id: "k1", title: "Uno", summary: "", category: "finanzas", tags: [] },
      { id: "k2", title: "Dos", summary: "", category: "legal", tags: [] },
    ];
    const sources = extractSources("Segun [KB:k1] y tambien [KB:k1] y [KB:k2]...", candidates);
    expect(sources).toEqual([
      { id: "k1", title: "Uno", category: "finanzas" },
      { id: "k2", title: "Dos", category: "legal" },
    ]);
  });

  it("ignora ids citados que no estan entre los candidatos", () => {
    const sources = extractSources("Segun [KB:fantasma]", []);
    expect(sources).toEqual([]);
  });
});

describe("buildHierarchyContext", () => {
  it("indica que no hay seleccion cuando selection es null", () => {
    expect(buildHierarchyContext(null)).toMatch(/no tiene ningun nodo/);
  });

  it("incluye los nombres presentes en la seleccion", () => {
    const text = buildHierarchyContext({
      projectId: "p1",
      blueprintId: "b1",
      workspaceName: "Mi Workspace",
    });
    expect(text).toContain("Mi Workspace");
  });
});

describe("buildTools", () => {
  it("solo incluye propose_create_card cuando hay Workspace activo", () => {
    expect(buildTools(false).map((t) => t.name)).toEqual(["propose_create_document"]);
    expect(buildTools(true).map((t) => t.name)).toEqual([
      "propose_create_document",
      "propose_create_card",
    ]);
  });
});

describe("buildSystemPrompt", () => {
  it("incluye el modo activo y los contextos recibidos", () => {
    const prompt = buildSystemPrompt("estratega", "CONTEXTO_JERARQUIA", "CONTEXTO_KB");
    expect(prompt).toContain("Estratega");
    expect(prompt).toContain("CONTEXTO_JERARQUIA");
    expect(prompt).toContain("CONTEXTO_KB");
  });
});

describe("fetchKnowledgeContext", () => {
  it("rankea por palabras clave y solo devuelve candidatos con score > 0", async () => {
    const docs = [
      {
        id: "k1",
        data: () => ({
          title: "Precios 2026",
          summary: "Estrategia de precios",
          category: "finanzas",
          tags: [],
        }),
      },
      {
        id: "k2",
        data: () => ({
          title: "Onboarding",
          summary: "Guia de bienvenida",
          category: "rrhh",
          tags: [],
        }),
      },
    ];
    vi.mocked(adminDb.collection).mockReturnValue(createQueryStub({ empty: false, docs }) as never);

    const { contextText, candidates } = await fetchKnowledgeContext(
      "org1",
      "cual es la estrategia de precios",
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe("k1");
    expect(contextText).toContain("[KB:k1]");
  });

  it("avisa cuando la Knowledge Base esta vacia", async () => {
    vi.mocked(adminDb.collection).mockReturnValue(
      createQueryStub({ empty: true, docs: [] }) as never,
    );

    const { candidates, contextText } = await fetchKnowledgeContext("org1", "algo");
    expect(candidates).toEqual([]);
    expect(contextText).toMatch(/todavia no tiene elementos/);
  });
});
