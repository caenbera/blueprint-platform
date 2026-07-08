"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Archive, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import {
  getMarketplaceResourceTypeConfig,
  MARKETPLACE_VISIBILITY_LABELS,
} from "@/config/marketplace";
import {
  archiveMarketplaceResource,
  listAllMarketplaceResourcesForAdmin,
} from "@/services/marketplace";
import type { MarketplaceResource } from "@/types/domain";

/** Marketplace (Sprint 17, mockup "07-marketplace.png" simplificado): moderación de plataforma sobre todo lo publicado (Documentos/Knowledge Items - los Blueprints se administran aparte en el Constructor). */
export default function AdminMarketplacePage() {
  const [resources, setResources] = useState<MarketplaceResource[] | null>(null);

  function reload() {
    listAllMarketplaceResourcesForAdmin().then(setResources);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleArchive(resource: MarketplaceResource) {
    try {
      await archiveMarketplaceResource(resource.id);
      toast.success(`"${resource.title}" archivado`);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo archivar el recurso.");
    }
  }

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Marketplace</h1>
        <p className="text-body text-muted-foreground mb-4">
          Modera todo lo publicado en el Marketplace de la plataforma.
        </p>

        {resources === null && (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        )}

        {resources?.length === 0 && (
          <EmptyState
            title="Aún no hay publicaciones"
            description="Cuando una organización publique un Documento o Knowledge Item, va a aparecer aquí."
          />
        )}

        {resources && resources.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publicación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Visibilidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => {
                  const config = getMarketplaceResourceTypeConfig(resource.resourceType);
                  return (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <config.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                          <span className="font-medium">{resource.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{config.label}</TableCell>
                      <TableCell>{resource.orgName}</TableCell>
                      <TableCell>
                        <Badge variant={resource.visibility === "public" ? "info" : "secondary"}>
                          {MARKETPLACE_VISIBILITY_LABELS[resource.visibility]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resource.status === "publicado" ? "success" : "outline"}>
                          {resource.status === "publicado" ? "Publicado" : "Archivado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {resource.status === "publicado" && (
                          <Button size="sm" variant="ghost" onClick={() => handleArchive(resource)}>
                            <Archive className="h-3.5 w-3.5" /> Archivar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
