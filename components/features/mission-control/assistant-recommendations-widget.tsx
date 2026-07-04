"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { generateRecommendation, getCachedRecommendation } from "@/services/assistant";
import type { AssistantRecommendation } from "@/types/domain";

/**
 * Unico widget de Mission Control que llama al AI Engine (Sprint 8). Se
 * genera bajo demanda (boton) - nunca automatico, para no disparar costos
 * de API en cada carga del dashboard.
 */
export function AssistantRecommendationsWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("assistantRecommendations");
  const [recommendation, setRecommendation] = useState<AssistantRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCachedRecommendation(orgId)
      .then(setRecommendation)
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      setRecommendation(await generateRecommendation());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la recomendación.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {loading && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {!loading && (
        <div className="flex flex-col gap-2">
          {recommendation ? (
            <>
              <p className="text-small">{recommendation.text}</p>
              <p className="text-small text-muted-foreground">
                Generado {new Date(recommendation.generatedAt).toLocaleString("es")}
              </p>
            </>
          ) : (
            <p className="text-small text-muted-foreground">
              Aún no se ha generado ninguna recomendación.
            </p>
          )}
          {error && <p className="text-small text-destructive">{error}</p>}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating}
            className="self-start"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {recommendation ? "Regenerar" : "Generar"}
          </Button>
        </div>
      )}
    </WidgetShell>
  );
}
