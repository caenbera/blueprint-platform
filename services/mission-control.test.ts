import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/projects", () => ({ listProjects: vi.fn() }));
// No se usa vi.importActual: el modulo real importa services/activity.ts ->
// lib/firebase/client.ts, que falla al inicializar en el entorno de Vitest
// (ver marketplace.test.ts para el mismo problema). calculateProjectProgress
// es una funcion pura sin dependencias externas, asi que se reimplementa
// aqui tal cual el original en vez de importarlo.
vi.mock("@/services/step-state", () => ({
  listStepStates: vi.fn(),
  calculateProjectProgress: (project: never, stepStates: { status: string }[]) => {
    const total = (
      project as { blueprintSnapshot: { roadmap: { steps: unknown[] }[] } }
    ).blueprintSnapshot.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
    const completed = stepStates.filter((s) => s.status === "completed").length;
    const status =
      completed === 0
        ? "no_iniciado"
        : completed >= total && total > 0
          ? "aprobado"
          : "en_progreso";
    return { total, completed, percent: 0, status };
  },
}));
vi.mock("@/services/knowledge", () => ({ listKnowledgeItems: vi.fn() }));
vi.mock("@/services/documents", () => ({ listDocuments: vi.fn() }));

import { listProjects } from "@/services/projects";
import { listStepStates } from "@/services/step-state";
import { listKnowledgeItems } from "@/services/knowledge";
import { listDocuments } from "@/services/documents";
import {
  getBlueprintHealth,
  getDocumentsSummary,
  getKnowledgeInsights,
  getProgressOverview,
} from "@/services/mission-control";

function project(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    orgId: "org1",
    blueprintId: "b1",
    blueprintSnapshot: { name: "Blueprint A", roadmap: [{ steps: [{ id: "s1" }, { id: "s2" }] }] },
    name: "Proyecto",
    icon: "",
    deletionStatus: "active",
    createdBy: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("getProgressOverview", () => {
  it("calcula el status de cada Proyecto a partir de sus ProjectStepState", async () => {
    vi.mocked(listProjects).mockResolvedValue([
      project({ id: "p1" }),
      project({ id: "p2" }),
      project({ id: "p3" }),
    ] as never);

    vi.mocked(listStepStates).mockImplementation(async (_orgId, projectId) => {
      if (projectId === "p1") return [{ status: "completed" }, { status: "completed" }] as never;
      if (projectId === "p2") return [{ status: "completed" }] as never;
      return [] as never;
    });

    const result = await getProgressOverview("org1");

    expect(result.totalProjects).toBe(3);
    expect(result.byStatus.aprobado).toBe(1);
    expect(result.byStatus.en_progreso).toBe(1);
    expect(result.byStatus.no_iniciado).toBe(1);
  });
});

describe("getBlueprintHealth", () => {
  it("agrupa los Proyectos por el nombre del Blueprint que usan", async () => {
    vi.mocked(listProjects).mockResolvedValue([
      project({ id: "p1", blueprintSnapshot: { name: "Blueprint A", roadmap: [] } }),
      project({ id: "p2", blueprintSnapshot: { name: "Blueprint A", roadmap: [] } }),
      project({ id: "p3", blueprintSnapshot: { name: "Blueprint B", roadmap: [] } }),
    ] as never);

    const result = await getBlueprintHealth("org1");

    expect(result.totalProjects).toBe(3);
    expect(result.byBlueprint).toEqual([
      { blueprintName: "Blueprint A", projectCount: 2 },
      { blueprintName: "Blueprint B", projectCount: 1 },
    ]);
  });
});

describe("getKnowledgeInsights", () => {
  it("cuenta por status y arma el top de categorias", async () => {
    vi.mocked(listKnowledgeItems).mockResolvedValue([
      { id: "k1", category: "finanzas", status: "aprobado" },
      { id: "k2", category: "finanzas", status: "aprobado" },
      { id: "k3", category: "legal", status: "en_revision" },
    ] as never);

    const result = await getKnowledgeInsights("org1");

    expect(result.total).toBe(3);
    expect(result.byStatus.aprobado).toBe(2);
    expect(result.byStatus.en_revision).toBe(1);
    expect(result.topCategories[0]).toEqual({ category: "finanzas", count: 2 });
  });
});

describe("getDocumentsSummary", () => {
  it("cuenta por status y devuelve los mas recientes", async () => {
    vi.mocked(listDocuments).mockResolvedValue([
      { id: "d1", title: "Doc Uno", status: "publicado" },
      { id: "d2", title: "Doc Dos", status: "borrador" },
    ] as never);

    const result = await getDocumentsSummary("org1");

    expect(result.total).toBe(2);
    expect(result.byStatus.publicado).toBe(1);
    expect(result.recent).toEqual([
      { id: "d1", title: "Doc Uno", status: "publicado" },
      { id: "d2", title: "Doc Dos", status: "borrador" },
    ]);
  });
});
