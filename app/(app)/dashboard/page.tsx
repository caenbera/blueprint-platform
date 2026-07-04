import { MissionControlGrid } from "@/components/features/mission-control/mission-control-grid";

/**
 * Mission Control Engine (Prompt 12, Sprint 9): centro de mando con los
 * 10 Widgets oficiales. Aterrizaje por defecto tras el login (ver
 * app/page.tsx, login/page.tsx, register/page.tsx). El contenido del
 * Workspace (Cards) vive ahora en /workspace.
 */
export default function DashboardPage() {
  return <MissionControlGrid />;
}
