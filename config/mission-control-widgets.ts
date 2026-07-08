import { BookOpen, FileText, FolderKanban, PieChart, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Widgets del extinto Mission Control Engine (Prompt 12) que sobreviven
 * como piezas reutilizables del resumen de solo lectura de una
 * organizacion ajena en el Panel de Super Admin (ver
 * organization-detail-dialog.tsx) - el resto se retiro cuando la pantalla
 * Inicio del Administrador se reconstruyo sobre el mockup "02-inicio.png".
 */
export type WidgetId =
  "progressOverview" | "projects" | "blueprintHealth" | "knowledgeInsights" | "documentsCenter";

export interface MissionControlWidgetConfig {
  id: WidgetId;
  label: string;
  icon: LucideIcon;
}

export const MISSION_CONTROL_WIDGETS: MissionControlWidgetConfig[] = [
  { id: "progressOverview", label: "Resumen de Progreso", icon: PieChart },
  { id: "projects", label: "Proyectos", icon: FolderKanban },
  { id: "blueprintHealth", label: "Blueprints en Uso", icon: Workflow },
  { id: "knowledgeInsights", label: "Knowledge Insights", icon: BookOpen },
  { id: "documentsCenter", label: "Documents Center", icon: FileText },
];

export function getMissionControlWidgetConfig(id: WidgetId): MissionControlWidgetConfig {
  return MISSION_CONTROL_WIDGETS.find((w) => w.id === id) ?? MISSION_CONTROL_WIDGETS[0];
}
