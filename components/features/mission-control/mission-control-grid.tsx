"use client";

import { useState, type ComponentType } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WidgetErrorBoundary } from "@/components/features/mission-control/widget-error-boundary";
import type { WidgetControlProps } from "@/components/features/mission-control/widget-shell";
import { ContinueWorkingWidget } from "@/components/features/mission-control/continue-working-widget";
import { ProgressOverviewWidget } from "@/components/features/mission-control/progress-overview-widget";
import { ProjectsWidget } from "@/components/features/mission-control/projects-widget";
import { BlueprintHealthWidget } from "@/components/features/mission-control/blueprint-health-widget";
import { RecentActivityWidget } from "@/components/features/mission-control/recent-activity-widget";
import { KnowledgeInsightsWidget } from "@/components/features/mission-control/knowledge-insights-widget";
import { DocumentsCenterWidget } from "@/components/features/mission-control/documents-center-widget";
import { AssistantRecommendationsWidget } from "@/components/features/mission-control/assistant-recommendations-widget";
import { NotificationsWidget } from "@/components/features/mission-control/notifications-widget";
import { TeamActivityWidget } from "@/components/features/mission-control/team-activity-widget";
import {
  MISSION_CONTROL_WIDGETS,
  getMissionControlWidgetConfig,
  type WidgetId,
} from "@/config/mission-control-widgets";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { useAuth } from "@/hooks/use-auth";

const WIDGET_COMPONENTS: Record<WidgetId, ComponentType<{ orgId: string } & WidgetControlProps>> = {
  continueWorking: ContinueWorkingWidget,
  progressOverview: ProgressOverviewWidget,
  projects: ProjectsWidget,
  blueprintHealth: BlueprintHealthWidget,
  recentActivity: RecentActivityWidget,
  knowledgeInsights: KnowledgeInsightsWidget,
  documentsCenter: DocumentsCenterWidget,
  assistantRecommendations: AssistantRecommendationsWidget,
  notifications: NotificationsWidget,
  teamActivity: TeamActivityWidget,
};

const DEFAULT_ORDER = MISSION_CONTROL_WIDGETS.map((w) => w.id);

interface MissionControlLayout {
  order: WidgetId[];
  hidden: WidgetId[];
}

/**
 * Mission Control Engine (Prompt 12, Sprint 9): renderiza los Widgets
 * visibles en el orden personalizado por el usuario (localStorage, por
 * navegador - mismo patron que el resto de preferencias del Navigator).
 * Cada widget vive dentro de su propio Error Boundary: si uno falla, el
 * resto del dashboard sigue funcionando.
 */
export function MissionControlGrid() {
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;
  const [layout, setLayout] = useLocalStorageState<MissionControlLayout>("mc-layout-v1", {
    order: DEFAULT_ORDER,
    hidden: [],
  });
  const [editMode, setEditMode] = useState(false);

  if (!orgId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState title="Sin organización" description="No se encontró tu organización." />
      </div>
    );
  }

  // Combina el orden guardado con cualquier widget nuevo que no exista aun en esa preferencia.
  const order = [...layout.order, ...DEFAULT_ORDER.filter((id) => !layout.order.includes(id))];
  const visibleOrder = order.filter((id) => !layout.hidden.includes(id));

  function moveWidget(id: WidgetId, direction: -1 | 1) {
    const idx = order.indexOf(id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const nextOrder = [...order];
    [nextOrder[idx], nextOrder[targetIdx]] = [nextOrder[targetIdx], nextOrder[idx]];
    setLayout({ ...layout, order: nextOrder });
  }

  function hideWidget(id: WidgetId) {
    setLayout({ ...layout, hidden: [...layout.hidden, id] });
  }

  function showWidget(id: WidgetId) {
    setLayout({ ...layout, hidden: layout.hidden.filter((h) => h !== id) });
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-h3">Mission Control</h1>
        <Button variant="outline" size="sm" onClick={() => setEditMode((v) => !v)}>
          <Settings2 className="h-3.5 w-3.5" />
          {editMode ? "Listo" : "Personalizar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleOrder.map((id) => {
          const WidgetComponent = WIDGET_COMPONENTS[id];
          const config = getMissionControlWidgetConfig(id);
          const idx = order.indexOf(id);
          return (
            <WidgetErrorBoundary key={id} widgetLabel={config.label}>
              <WidgetComponent
                orgId={orgId}
                editMode={editMode}
                canMoveUp={idx > 0}
                canMoveDown={idx < order.length - 1}
                onMoveUp={() => moveWidget(id, -1)}
                onMoveDown={() => moveWidget(id, 1)}
                onHide={() => hideWidget(id)}
              />
            </WidgetErrorBoundary>
          );
        })}
      </div>

      {editMode && layout.hidden.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
          <span className="text-small text-muted-foreground">Ocultos:</span>
          {layout.hidden.map((id) => {
            const config = getMissionControlWidgetConfig(id);
            return (
              <Button key={id} size="sm" variant="ghost" onClick={() => showWidget(id)}>
                <config.icon className="h-3.5 w-3.5" />
                {config.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
