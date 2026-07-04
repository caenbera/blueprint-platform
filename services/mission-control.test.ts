import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/projects", () => ({ listProjects: vi.fn() }));
vi.mock("@/services/blueprints", () => ({ listBlueprints: vi.fn() }));
vi.mock("@/services/knowledge", () => ({ listKnowledgeItems: vi.fn() }));
vi.mock("@/services/documents", () => ({ listDocuments: vi.fn() }));

import { listProjects } from "@/services/projects";
import { listBlueprints } from "@/services/blueprints";
import { listKnowledgeItems } from "@/services/knowledge";
import { listDocuments } from "@/services/documents";
import {
  getBlueprintHealth,
  getDocumentsSummary,
  getKnowledgeInsights,
  getPendingReviewItems,
  getProgressOverview,
} from "@/services/mission-control";

function baseNode(overrides: Record<string, unknown> = {}) {
  return {
    id: "n1",
    name: "Nodo",
    description: "",
    order: 0,
    progressStatus: "no_iniciado",
    deletionStatus: "active",
    createdAt: "",
    createdBy: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("getProgressOverview", () => {
  it("cuenta los Proyectos por progressStatus", async () => {
    vi.mocked(listProjects).mockResolvedValue([
      baseNode({ id: "p1", progressStatus: "aprobado" }),
      baseNode({ id: "p2", progressStatus: "aprobado" }),
      baseNode({ id: "p3", progressStatus: "bloqueado" }),
    ] as never);

    const result = await getProgressOverview("org1");

    expect(result.totalProjects).toBe(3);
    expect(result.byStatus.aprobado).toBe(2);
    expect(result.byStatus.bloqueado).toBe(1);
    expect(result.byStatus.no_iniciado).toBe(0);
  });
});

describe("getBlueprintHealth", () => {
  it("agrega Blueprints de todos los Proyectos (fan-out) y detecta bloqueados", async () => {
    vi.mocked(listProjects).mockResolvedValue([
      baseNode({ id: "p1", name: "Proyecto Uno" }),
      baseNode({ id: "p2", name: "Proyecto Dos" }),
    ] as never);

    vi.mocked(listBlueprints).mockImplementation(async (ref) => {
      const projectId = (ref as { projectId: string }).projectId;
      if (projectId === "p1") {
        return [baseNode({ id: "b1", name: "Blueprint A", progressStatus: "aprobado" })] as never;
      }
      return [baseNode({ id: "b2", name: "Blueprint B", progressStatus: "bloqueado" })] as never;
    });

    const result = await getBlueprintHealth("org1");

    expect(result.totalBlueprints).toBe(2);
    expect(result.byStatus.aprobado).toBe(1);
    expect(result.byStatus.bloqueado).toBe(1);
    expect(result.blocked).toEqual([
      { projectName: "Proyecto Dos", blueprintName: "Blueprint B", progressStatus: "bloqueado" },
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

describe("getPendingReviewItems", () => {
  it("solo incluye elementos en_revision, etiquetados por tipo", async () => {
    vi.mocked(listKnowledgeItems).mockResolvedValue([
      { id: "k1", title: "KB en revision", status: "en_revision" },
      { id: "k2", title: "KB aprobado", status: "aprobado" },
    ] as never);
    vi.mocked(listDocuments).mockResolvedValue([
      { id: "d1", title: "Doc en revision", status: "en_revision" },
    ] as never);

    const result = await getPendingReviewItems("org1");

    expect(result).toEqual([
      { type: "knowledge", id: "k1", title: "KB en revision" },
      { type: "document", id: "d1", title: "Doc en revision" },
    ]);
  });
});
