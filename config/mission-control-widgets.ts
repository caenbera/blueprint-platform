import {
  Activity,
  Bell,
  BookOpen,
  FileText,
  FolderKanban,
  History,
  PieChart,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Los 10 Widgets oficiales del Mission Control Engine (Prompt 12). */
export type WidgetId =
  | "continueWorking"
  | "progressOverview"
  | "projects"
  | "blueprintHealth"
  | "recentActivity"
  | "knowledgeInsights"
  | "documentsCenter"
  | "assistantRecommendations"
  | "notifications"
  | "teamActivity";

export interface MissionControlWidgetConfig {
  id: WidgetId;
  label: string;
  icon: LucideIcon;
}

/** Orden por defecto (tambien el orden usado al restablecer la personalizacion de layout). */
export const MISSION_CONTROL_WIDGETS: MissionControlWidgetConfig[] = [
  { id: "continueWorking", label: "Continuar Trabajando", icon: History },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "progressOverview", label: "Resumen de Progreso", icon: PieChart },
  { id: "projects", label: "Proyectos", icon: FolderKanban },
  { id: "blueprintHealth", label: "Blueprints en Uso", icon: Workflow },
  { id: "assistantRecommendations", label: "Recomendaciones del Assistant", icon: Sparkles },
  { id: "knowledgeInsights", label: "Knowledge Insights", icon: BookOpen },
  { id: "documentsCenter", label: "Documents Center", icon: FileText },
  { id: "recentActivity", label: "Actividad Reciente", icon: Activity },
  { id: "teamActivity", label: "Actividad del Equipo", icon: Users },
];

export function getMissionControlWidgetConfig(id: WidgetId): MissionControlWidgetConfig {
  return MISSION_CONTROL_WIDGETS.find((w) => w.id === id) ?? MISSION_CONTROL_WIDGETS[0];
}
