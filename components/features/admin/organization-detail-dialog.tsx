"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WidgetErrorBoundary } from "@/components/features/mission-control/widget-error-boundary";
import { ProjectsWidget } from "@/components/features/mission-control/projects-widget";
import { ProgressOverviewWidget } from "@/components/features/mission-control/progress-overview-widget";
import { BlueprintHealthWidget } from "@/components/features/mission-control/blueprint-health-widget";
import { KnowledgeInsightsWidget } from "@/components/features/mission-control/knowledge-insights-widget";
import { DocumentsCenterWidget } from "@/components/features/mission-control/documents-center-widget";
import type { OrganizationSummary } from "@/services/platform-admin";

/** Controles de layout inertes: este resumen es de solo lectura, sin modo "Personalizar". */
const READONLY_CONTROLS = {
  editMode: false,
  canMoveUp: false,
  canMoveDown: false,
  onMoveUp: () => {},
  onMoveDown: () => {},
  onHide: () => {},
};

/**
 * Resumen de solo lectura de una organizacion ajena (Panel de Super Admin,
 * solo disponible con supportAccessGrant aprobado). Reutiliza directamente
 * los widgets de Mission Control ya construidos, pasandoles el orgId
 * objetivo - no reconstruye el Navigator/Workspace en modo ajeno (ver plan).
 */
export function OrganizationDetailDialog({
  organization,
  open,
  onOpenChange,
}: {
  organization: OrganizationSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{organization.name} — resumen de soporte (solo lectura)</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WidgetErrorBoundary widgetLabel="Proyectos">
            <ProjectsWidget orgId={organization.id} navigable={false} {...READONLY_CONTROLS} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetLabel="Resumen de Progreso">
            <ProgressOverviewWidget orgId={organization.id} {...READONLY_CONTROLS} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetLabel="Salud de Blueprints">
            <BlueprintHealthWidget orgId={organization.id} {...READONLY_CONTROLS} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetLabel="Knowledge Insights">
            <KnowledgeInsightsWidget
              orgId={organization.id}
              showLink={false}
              {...READONLY_CONTROLS}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetLabel="Documents Center">
            <DocumentsCenterWidget
              orgId={organization.id}
              showLink={false}
              {...READONLY_CONTROLS}
            />
          </WidgetErrorBoundary>
        </div>
      </DialogContent>
    </Dialog>
  );
}
