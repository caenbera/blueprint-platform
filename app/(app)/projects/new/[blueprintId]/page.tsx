"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Layers, ListChecks, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getBlueprint } from "@/services/blueprints";
import { createProjectFromBlueprint } from "@/services/projects";
import type { Blueprint } from "@/types/domain";

function countSteps(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce((sum, phase) => sum + phase.steps.length, 0);
}

function totalHours(blueprint: Blueprint): number {
  return blueprint.roadmap.reduce(
    (sum, phase) => sum + phase.steps.reduce((s, step) => s + step.estimatedHours, 0),
    0,
  );
}

/** Resumen del Blueprint (mockup "05-resumen-blueprint.png"): confirma el Blueprint elegido y crea el Proyecto con un snapshot congelado al presionar "Comenzar". */
export default function BlueprintSummaryPage() {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const router = useRouter();
  const { membership } = useAuth();
  const orgId = membership?.orgId ?? null;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [projectName, setProjectName] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBlueprint(blueprintId).then((b) => {
      setBlueprint(b);
      if (b) setProjectName(b.name);
    });
  }, [blueprintId]);

  async function handleStart() {
    if (!orgId) return;
    setStarting(true);
    setError(null);
    try {
      const projectId = await createProjectFromBlueprint(orgId, blueprintId, projectName);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proyecto.");
      setStarting(false);
    }
  }

  if (blueprint === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <button
        onClick={() => router.push("/projects/new/blueprint")}
        className="text-body text-muted-foreground hover:text-foreground mb-3 flex w-fit items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Elegir Blueprint
      </button>

      <div className="max-w-2xl rounded-lg border p-6">
        <h1 className="text-h3">{blueprint.name}</h1>
        <p className="text-body text-muted-foreground mt-1">{blueprint.description}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          <span className="text-body flex items-center gap-1.5">
            <Layers className="text-muted-foreground h-4 w-4" /> {blueprint.roadmap.length} fases
          </span>
          <span className="text-body flex items-center gap-1.5">
            <ListChecks className="text-muted-foreground h-4 w-4" /> {countSteps(blueprint)} pasos
          </span>
          <span className="text-body flex items-center gap-1.5">
            <Clock className="text-muted-foreground h-4 w-4" /> ~{totalHours(blueprint)}h estimadas
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-h4">Fases del Blueprint</p>
          <div className="flex flex-col gap-1.5">
            {[...blueprint.roadmap]
              .sort((a, b) => a.order - b.order)
              .map((phase, i) => (
                <div key={phase.id} className="flex items-center gap-2">
                  <span className="bg-muted text-small flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    {i + 1}
                  </span>
                  <span className="text-body">{phase.title}</span>
                  <span className="text-small text-muted-foreground">
                    ({phase.steps.length} pasos)
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          <Label htmlFor="projectName">Nombre del proyecto</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        {error && <p className="text-small text-destructive mt-3">{error}</p>}

        <Button
          className="mt-6 w-full"
          onClick={handleStart}
          disabled={!orgId || !projectName.trim() || starting}
        >
          {starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Comenzar Blueprint <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
