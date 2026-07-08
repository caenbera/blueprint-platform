import {
  Building2,
  Code,
  HeartPulse,
  Rocket,
  Sprout,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * Paso 1 del asistente de creacion de proyectos (mockup "03-tipo-proyecto.png",
 * pantalla A3): categorias generales, NO Blueprints. Son solo un filtro
 * visual para la pantalla siguiente ("Elegir Blueprint") - Blueprint.category
 * es texto libre definido por el Super Admin al importar el JSON, asi que el
 * filtro hace match flexible (case-insensitive, substring) en vez de una
 * igualdad exacta contra estos ids.
 */
export type ProjectCategory =
  | "empresa"
  | "startup"
  | "marca_personal"
  | "restaurante"
  | "cultivo_agro"
  | "clinica_salud"
  | "software_saas"
  | "personalizado";

export interface ProjectCategoryOption {
  id: ProjectCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const PROJECT_CATEGORIES: ProjectCategoryOption[] = [
  {
    id: "empresa",
    label: "Empresa",
    description: "Construye tu empresa paso a paso, desde la idea hasta la operación.",
    icon: Building2,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "startup",
    label: "Startup",
    description: "Lanza tu startup con una base sólida y escalable.",
    icon: Rocket,
    color: "bg-success/10 text-success",
  },
  {
    id: "marca_personal",
    label: "Marca Personal",
    description: "Desarrolla tu marca personal y posiciona tu propuesta de valor.",
    icon: User,
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    id: "restaurante",
    label: "Restaurante",
    description: "Abre tu restaurante con procesos, permisos y operación guiada.",
    icon: UtensilsCrossed,
    color: "bg-warning/10 text-warning",
  },
  {
    id: "cultivo_agro",
    label: "Cultivo / Agro",
    description: "Inicia tu proyecto agrícola o pecuario con buenas prácticas.",
    icon: Sprout,
    color: "bg-success/10 text-success",
  },
  {
    id: "clinica_salud",
    label: "Clínica / Salud",
    description:
      "Crea tu clínica o consultorio siguiendo todos los requisitos legales y operativos.",
    icon: HeartPulse,
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    id: "software_saas",
    label: "Software / SaaS",
    description: "Desarrolla tu producto digital desde la idea hasta su lanzamiento.",
    icon: Code,
    color: "bg-primary/10 text-primary",
  },
];
