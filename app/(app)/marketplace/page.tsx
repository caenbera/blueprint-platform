"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceResourceCard } from "@/components/features/marketplace/marketplace-resource-card";
import { PublishResourceDialog } from "@/components/features/marketplace/publish-resource-dialog";
import { MARKETPLACE_RESOURCE_TYPES } from "@/config/marketplace";
import { useAuth } from "@/hooks/use-auth";
import { listMarketplaceResources } from "@/services/marketplace";
import type { MarketplaceResource, MarketplaceResourceType } from "@/types/domain";

/**
 * Marketplace (Sprint 10): explorar recursos publicos + de la propia
 * organizacion, y publicar nuevos. "Incorporar" siempre crea una copia
 * nueva (ver components/features/marketplace/).
 */
export default function MarketplacePage() {
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;
  const [resources, setResources] = useState<MarketplaceResource[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MarketplaceResourceType | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  function reload() {
    if (!orgId) return;
    listMarketplaceResources(orgId).then(setResources);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const filtered = (resources ?? []).filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || r.resourceType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-h3">Marketplace</h1>
        <Button onClick={() => setPublishOpen(true)}>
          <Plus className="h-4 w-4" /> Publicar recurso
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Buscar recursos..."
          className="max-w-xs"
        />
        <Button
          size="sm"
          variant={typeFilter === null ? "default" : "outline"}
          onClick={() => setTypeFilter(null)}
        >
          Todos
        </Button>
        {MARKETPLACE_RESOURCE_TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={typeFilter === t.value ? "default" : "outline"}
            onClick={() => setTypeFilter(t.value)}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      {resources === null && (
        <div className="flex items-center gap-2 py-6">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-body text-muted-foreground">Cargando...</span>
        </div>
      )}

      {resources !== null && filtered.length === 0 && (
        <EmptyState
          title="Aún no hay recursos"
          description="Publica un Blueprint, Documento o Knowledge Item para que otros lo incorporen."
          actionLabel="Publicar recurso"
          onAction={() => setPublishOpen(true)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((resource) => (
          <MarketplaceResourceCard key={resource.id} resource={resource} orgId={orgId} />
        ))}
      </div>

      <PublishResourceDialog
        orgId={orgId}
        orgName={membership?.organizationName ?? ""}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onPublished={reload}
      />
    </div>
  );
}
