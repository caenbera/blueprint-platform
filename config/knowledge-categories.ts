import type { KnowledgeCategory } from "@/types/domain";

export interface KnowledgeCategoryConfig {
  value: KnowledgeCategory;
  label: string;
}

/** Catalogo de categorias de la Knowledge Base (Prompt 4.5), extensible. */
export const KNOWLEDGE_CATEGORIES: KnowledgeCategoryConfig[] = [
  { value: "estrategia", label: "Estrategia" },
  { value: "finanzas", label: "Finanzas" },
  { value: "operaciones", label: "Operaciones" },
  { value: "marketing", label: "Marketing" },
  { value: "rrhh", label: "Recursos Humanos" },
  { value: "legal", label: "Legal" },
  { value: "ventas", label: "Ventas" },
  { value: "clientes", label: "Clientes" },
  { value: "productos", label: "Productos" },
  { value: "procesos", label: "Procesos" },
  { value: "plantillas", label: "Plantillas" },
  { value: "documentos", label: "Documentos" },
];

export function getKnowledgeCategoryLabel(value: KnowledgeCategory): string {
  return KNOWLEDGE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
