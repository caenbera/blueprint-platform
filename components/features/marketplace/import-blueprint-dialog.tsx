"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listProjects } from "@/services/projects";
import { importBlueprint } from "@/services/marketplace";
import type { MarketplaceResource, Project } from "@/types/domain";

/**
 * Un Blueprint siempre necesita un Proyecto padre, asi que incorporar uno
 * del Marketplace pide elegir el Proyecto destino (Sprint 10). Si el
 * usuario no tiene Proyectos, se le indica que cree uno primero desde el
 * Navigator - no se construye creacion de Proyecto inline aqui.
 */
export function ImportBlueprintDialog({
  orgId,
  resource,
  open,
  onOpenChange,
}: {
  orgId: string;
  resource: MarketplaceResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState(resource.title);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) listProjects(orgId).then(setProjects);
  }, [open, orgId]);

  async function handleImport() {
    if (!projectId) return;
    setImporting(true);
    try {
      await importBlueprint(resource, { orgId, projectId }, title.trim() || resource.title);
      toast.success(`Blueprint "${title}" incorporado`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo incorporar el Blueprint.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Incorporar Blueprint</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {projects?.length === 0 && (
            <p className="text-small text-muted-foreground">
              Todavía no tienes Proyectos. Crea uno desde el Navigator primero.
            </p>
          )}
          {projects && projects.length > 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Proyecto destino</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un Proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nombre del nuevo Blueprint</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!projectId || importing}>
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Incorporar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
