"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getMarketplaceResourceTypeConfig,
  MARKETPLACE_VISIBILITY_LABELS,
} from "@/config/marketplace";
import { importDocument, importKnowledgeItem } from "@/services/marketplace";
import type { MarketplaceResource } from "@/types/domain";

export function MarketplaceResourceCard({
  resource,
  orgId,
}: {
  resource: MarketplaceResource;
  orgId: string;
}) {
  const config = getMarketplaceResourceTypeConfig(resource.resourceType);
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    setImporting(true);
    try {
      if (resource.resourceType === "document") {
        await importDocument(orgId, resource);
      } else {
        await importKnowledgeItem(orgId, resource);
      }
      toast.success(`"${resource.title}" incorporado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo incorporar el recurso.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <config.icon className="text-muted-foreground h-4 w-4 shrink-0" />
        <CardTitle className="text-h4">{resource.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-body text-muted-foreground line-clamp-2">{resource.description}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{config.label}</Badge>
          <Badge variant={resource.visibility === "public" ? "info" : "secondary"}>
            {MARKETPLACE_VISIBILITY_LABELS[resource.visibility]}
          </Badge>
          <Badge variant="ghost">{resource.orgName}</Badge>
        </div>
        <Button size="sm" onClick={handleImport} disabled={importing} className="self-start">
          Incorporar
        </Button>
      </CardContent>
    </Card>
  );
}
