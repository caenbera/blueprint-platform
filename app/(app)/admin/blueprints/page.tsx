"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, ListChecks, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { ImportBlueprintJsonDialog } from "@/components/features/admin/import-blueprint-json-dialog";
import { listAllBlueprints } from "@/services/blueprints";
import type { Blueprint, BlueprintStatus } from "@/types/domain";

const STATUS_META: Record<
  BlueprintStatus,
  { label: string; variant: "secondary" | "success" | "outline" }
> = {
  draft: { label: "Borrador", variant: "secondary" },
  published: { label: "Publicado", variant: "success" },
  archived: { label: "Archivado", variant: "outline" },
};

function countSteps(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
}

/** Constructor de Blueprints (Sprint 17): prioriza importar JSON (ya validado contra el schema oficial) sobre el constructor visual drag-and-drop, que queda para después. */
export default function AdminBlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[] | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  function reload() {
    listAllBlueprints().then(setBlueprints);
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-h3">Constructor de Blueprints</h1>
            <p className="text-body text-muted-foreground">
              Crea y administra las plantillas de metodología de la plataforma.
            </p>
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar JSON
          </Button>
        </div>

        {blueprints === null && (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        )}

        {blueprints?.length === 0 && (
          <EmptyState
            icon={Layers}
            title="Aún no hay Blueprints"
            description="Importa un archivo JSON para crear el primero."
            actionLabel="Importar JSON"
            onAction={() => setImportOpen(true)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {blueprints?.map((blueprint) => (
            <Link
              key={blueprint.id}
              href={`/admin/blueprints/${blueprint.id}`}
              className="hover:border-primary/50 flex flex-col gap-2 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-h4 truncate">{blueprint.name}</span>
                <Badge variant={STATUS_META[blueprint.status].variant}>
                  {STATUS_META[blueprint.status].label}
                </Badge>
              </div>
              <p className="text-body text-muted-foreground line-clamp-2">
                {blueprint.description}
              </p>
              <div className="text-small text-muted-foreground mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> {blueprint.roadmap.length} fases
                </span>
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> {countSteps(blueprint)} pasos
                </span>
              </div>
            </Link>
          ))}
        </div>

        <ImportBlueprintJsonDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={reload}
        />
      </div>
    </SuperAdminGuard>
  );
}
