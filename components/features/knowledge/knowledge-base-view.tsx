"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { KnowledgeItemCard } from "@/components/features/knowledge/knowledge-item-card";
import { KnowledgeItemDetail } from "@/components/features/knowledge/knowledge-item-detail";
import { KNOWLEDGE_CATEGORIES } from "@/config/knowledge-categories";
import { useAuth } from "@/hooks/use-auth";
import { listKnowledgeItems } from "@/services/knowledge";
import { cn } from "@/lib/utils";
import type { KnowledgeCategory, KnowledgeItem } from "@/types/domain";

/**
 * Contenedor principal de la Knowledge Base (Prompt 4.5, Sprint 6):
 * sidebar de categorias + busqueda + grid de resultados.
 */
export function KnowledgeBaseView() {
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;

  const [items, setItems] = useState<KnowledgeItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<KnowledgeCategory | "all">("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  async function refresh() {
    if (!orgId) return;
    setItems(await listKnowledgeItems(orgId));
  }

  useEffect(() => {
    // Carga inicial deliberada (y recarga si cambia la organizacion activa);
    // `refresh` se reutiliza tambien como callback tras editar/promover.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  if (!orgId || items === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const visibleItems = items.filter((item) => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const query = search.toLowerCase();
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-56 shrink-0 overflow-y-auto border-r p-3">
        <p className="text-caption text-muted-foreground mb-2">Categorías</p>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "text-body hover:bg-muted rounded-md px-2 py-1.5 text-left",
              categoryFilter === "all" && "bg-accent/10 font-medium",
            )}
          >
            Todas
          </button>
          {KNOWLEDGE_CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setCategoryFilter(category.value)}
              className={cn(
                "text-body hover:bg-muted rounded-md px-2 py-1.5 text-left",
                categoryFilter === category.value && "bg-accent/10 font-medium",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Buscar en la Knowledge Base..."
          className="mb-4 max-w-sm"
        />

        {visibleItems.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Sin resultados"
            description="Promueve una Card a la Knowledge Base desde el menú «...» de cualquier Card en un Workspace."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <KnowledgeItemCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItemId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <KnowledgeItemDetail
          orgId={orgId}
          item={selectedItem}
          allItems={items}
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItemId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
