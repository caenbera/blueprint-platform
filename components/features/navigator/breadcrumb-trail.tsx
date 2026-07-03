"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";

/**
 * Breadcrumb sincronizado con el Navigator (Prompt 6):
 * Organizacion > Proyecto > Blueprint > Fase > Modulo > Capitulo > Workspace.
 * Solo muestra los niveles que existen en la seleccion actual.
 */
export function BreadcrumbTrail() {
  const { membership } = useAuth();
  const { activeProjectName, activeBlueprintName, selection } = useNavigator();

  const crumbs = [
    membership?.organizationName,
    activeProjectName,
    activeBlueprintName,
    selection?.phaseName,
    selection?.moduleName,
    selection?.chapterName,
    selection?.workspaceName,
  ].filter((c): c is string => Boolean(c));

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="px-4 py-2">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <span key={`${crumb}-${i}`} className="flex items-center gap-1.5">
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb}</BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{crumb}</span>
              )}
            </BreadcrumbItem>
            {i < crumbs.length - 1 && <BreadcrumbSeparator />}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
