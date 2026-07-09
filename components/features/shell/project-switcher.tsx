"use client";

import { createElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveLucideIcon } from "@/lib/lucide-icon";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { listProjects } from "@/services/projects";
import type { Project } from "@/types/domain";

/**
 * "Proyecto actual" (Roadmap del Proyecto, mockup "06-roadmap.png"): a
 * partir de que hay un Proyecto activo, el sidebar muestra este selector
 * arriba del menu para cambiar rapido de Proyecto sin pasar por "Mis
 * proyectos".
 */
export function ProjectSwitcher() {
  const { membership } = useAuth();
  const { activeProjectId } = useNavigator();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    if (!membership?.orgId) return;
    listProjects(membership.orgId).then(setProjects);
  }, [membership?.orgId]);

  const active = projects?.find((p) => p.id === activeProjectId);
  if (!active) return null;

  return (
    <div className="px-3 pt-3">
      <p className="text-caption text-muted-foreground mb-1.5 px-1 font-semibold tracking-wider uppercase">
        Proyecto actual
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:bg-muted flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left">
            <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
              {createElement(resolveLucideIcon(active.blueprintSnapshot.icon), {
                className: "h-4 w-4",
              })}
            </div>
            <span className="text-body min-w-0 flex-1 truncate font-medium">{active.name}</span>
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {projects?.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => router.push(`/projects/${p.id}`)}>
              {p.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
