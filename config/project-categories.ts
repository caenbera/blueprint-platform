import {
  Briefcase,
  Building2,
  Code,
  GraduationCap,
  HeartPulse,
  Rocket,
  Sprout,
  Store,
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
  | "servicios"
  | "comercio"
  | "clinica_salud"
  | "educacion"
  | "cultivo_agro"
  | "software_saas";

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
    label: "Empresas",
    description: "Construye tu empresa paso a paso, desde la idea hasta la operación.",
    icon: Building2,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "startup",
    label: "Startups",
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
    label: "Restaurantes",
    description: "Abre tu restaurante con procesos, permisos y operación guiada.",
    icon: UtensilsCrossed,
    color: "bg-warning/10 text-warning",
  },
  {
    id: "servicios",
    label: "Servicios",
    description: "Organiza tu negocio de servicios profesionales de principio a fin.",
    icon: Briefcase,
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    id: "comercio",
    label: "Comercio",
    description: "Monta tu negocio de comercio o venta de productos.",
    icon: Store,
    color: "bg-warning/10 text-warning",
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
    id: "educacion",
    label: "Educación",
    description: "Diseña tu proyecto educativo, desde el programa hasta la operación.",
    icon: GraduationCap,
    color: "bg-chart-2/10 text-chart-2",
  },
  {
    id: "cultivo_agro",
    label: "Cultivo / Agro",
    description: "Inicia tu proyecto agrícola o pecuario con buenas prácticas.",
    icon: Sprout,
    color: "bg-success/10 text-success",
  },
  {
    id: "software_saas",
    label: "Software / SaaS",
    description: "Desarrolla tu producto digital desde la idea hasta su lanzamiento.",
    icon: Code,
    color: "bg-primary/10 text-primary",
  },
];
