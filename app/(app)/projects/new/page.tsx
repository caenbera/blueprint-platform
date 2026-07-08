"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Compass, Sparkles, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORIES } from "@/config/project-categories";

/**
 * Tipo de Proyecto (mockup "03-tipo-proyecto.png", pantalla A3): primer
 * paso del asistente de creacion de proyectos. Solo identifica la
 * intencion del usuario (una categoria, no un Blueprint) - la seleccion
 * navega automaticamente al paso 2 (Elegir Blueprint), no hay boton
 * "Continuar".
 */
export default function ProjectTypePage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <Link
        href="/dashboard"
        className="text-body text-muted-foreground hover:text-foreground mb-4 flex w-fit items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Inicio
      </Link>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
          <Compass className="text-primary h-6 w-6" />
        </div>
        <h1 className="text-h2">¿Qué deseas construir?</h1>
        <p className="text-body text-muted-foreground mt-1">
          Elige el tipo de proyecto que quieres desarrollar.
        </p>

        <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROJECT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => router.push(`/projects/new/blueprint?category=${category.id}`)}
                className="group hover:border-primary flex flex-col items-center gap-1 rounded-lg border p-6 text-center transition-all hover:shadow-md"
              >
                <div
                  className={cn(
                    "mb-3 flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-105",
                    category.color,
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <p className="text-h4">{category.label}</p>
                <p className="text-small text-muted-foreground">{category.description}</p>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() =>
              toast.info(
                "Los proyectos personalizados (sin Blueprint) estarán disponibles próximamente.",
              )
            }
            className="hover:border-primary flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center transition-all hover:shadow-md"
          >
            <div className="bg-muted text-muted-foreground mb-3 flex h-16 w-16 items-center justify-center rounded-full">
              <SquarePen className="h-7 w-7" />
            </div>
            <p className="text-h4">Proyecto personalizado</p>
            <p className="text-small text-muted-foreground">
              Empieza desde cero con la guía de Blueprint.
            </p>
          </button>
        </div>

        <p className="text-small text-muted-foreground mt-8 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          No te preocupes, podrás cambiar el tipo de proyecto más adelante.
        </p>
      </div>
    </div>
  );
}
