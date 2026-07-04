import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase/client", () => ({ auth: {}, db: {}, storage: {} }));
vi.mock("@/services/blueprints", () => ({
  listPhases: vi.fn(),
  listModules: vi.fn(),
  listChapters: vi.fn(),
  createBlueprint: vi.fn(),
  createPhase: vi.fn(),
  createModule: vi.fn(),
  createChapter: vi.fn(),
}));
vi.mock("@/services/workspaces", () => ({ listWorkspaces: vi.fn(), createWorkspace: vi.fn() }));
vi.mock("@/services/cards", () => ({ listCards: vi.fn(), createCard: vi.fn() }));
vi.mock("@/services/documents", () => ({
  getDocumentById: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}));
vi.mock("@/services/knowledge", () => ({
  getKnowledgeItem: vi.fn(),
  createKnowledgeItemFromSnapshot: vi.fn(),
}));

import { listChapters, listModules, listPhases } from "@/services/blueprints";
import { listWorkspaces } from "@/services/workspaces";
import { listCards } from "@/services/cards";
import { buildBlueprintSnapshot } from "@/services/marketplace";

function node(overrides: Record<string, unknown>) {
  return { description: "", order: 0, ...overrides };
}

describe("buildBlueprintSnapshot", () => {
  it("recorre el arbol completo Fase->Modulo->Capitulo->Workspace->Cards", async () => {
    vi.mocked(listPhases).mockResolvedValue([node({ id: "ph1", name: "Fase 1" })] as never);
    vi.mocked(listModules).mockResolvedValue([node({ id: "mo1", name: "Modulo 1" })] as never);
    vi.mocked(listChapters).mockResolvedValue([node({ id: "ch1", name: "Capitulo 1" })] as never);
    vi.mocked(listWorkspaces).mockResolvedValue([
      node({ id: "ws1", name: "Workspace 1" }),
    ] as never);
    vi.mocked(listCards).mockResolvedValue([
      {
        id: "c1",
        type: "informacion",
        title: "Card 1",
        objective: "Obj",
        content: "Texto",
        order: 0,
      },
    ] as never);

    const snapshot = await buildBlueprintSnapshot({
      orgId: "org1",
      projectId: "p1",
      blueprintId: "b1",
    });

    expect(snapshot.phases).toHaveLength(1);
    expect(snapshot.phases[0].name).toBe("Fase 1");
    expect(snapshot.phases[0].modules[0].name).toBe("Modulo 1");
    expect(snapshot.phases[0].modules[0].chapters[0].name).toBe("Capitulo 1");
    expect(snapshot.phases[0].modules[0].chapters[0].workspaces[0].name).toBe("Workspace 1");
    expect(snapshot.phases[0].modules[0].chapters[0].workspaces[0].cards).toEqual([
      { type: "informacion", title: "Card 1", objective: "Obj", content: "Texto", order: 0 },
    ]);
  });

  it("devuelve un arbol vacio cuando el Blueprint no tiene Fases", async () => {
    vi.mocked(listPhases).mockResolvedValue([] as never);

    const snapshot = await buildBlueprintSnapshot({
      orgId: "org1",
      projectId: "p1",
      blueprintId: "b1",
    });

    expect(snapshot.phases).toEqual([]);
  });
});
