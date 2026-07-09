import {
  Briefcase,
  Building2,
  Code,
  GraduationCap,
  HeartPulse,
  MoreHorizontal,
  Sprout,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { ProjectCategory } from "@/config/project-categories";

/**
 * Filtros por categoría de la pantalla "Elegir Blueprint" (mockup
 * "04-elegir-blueprint.png", pantalla A4) - una agrupacion mas amplia que
 * las 10 categorias del paso 1 (Tipo de Proyecto): Startups y Software/SaaS
 * caen bajo "Tecnología", Marca Personal y Restaurantes bajo "Otros".
 * Blueprint.category es texto libre (Super Admin, al importar el JSON) -
 * el agrupamiento se hace por palabras clave contra el catalogo de 220
 * Blueprints / 11 areas que el usuario documento, no por igualdad exacta.
 */
export type BlueprintCategoryGroup =
  "empresas" | "tecnologia" | "servicios" | "comercio" | "salud" | "educacion" | "agro" | "otros";

export interface BlueprintCategoryGroupOption {
  id: BlueprintCategoryGroup;
  label: string;
  icon: LucideIcon;
  keywords: string[];
}

export const BLUEPRINT_CATEGORY_GROUPS: BlueprintCategoryGroupOption[] = [
  {
    id: "empresas",
    label: "Empresas",
    icon: Building2,
    keywords: [
      "empresa",
      "holding",
      "cooperativa",
      "fundacion",
      "fundación",
      "asociacion",
      "asociación",
      " ong",
      "franquicia",
      "logistica",
      "logística",
      "construccion",
      "construcción",
      "transporte",
      "minera",
      "internacional",
    ],
  },
  {
    id: "tecnologia",
    label: "Tecnología",
    icon: Code,
    keywords: [
      "startup",
      "saas",
      "software",
      "tech",
      "crm",
      "erp",
      "app",
      "plataforma",
      "api",
      "microservicios",
      "fintech",
      "iot",
      "lms",
      "cms",
      "pos",
    ],
  },
  {
    id: "servicios",
    label: "Servicios",
    icon: Briefcase,
    keywords: [
      "agencia",
      "consultor",
      "firma",
      "outsourcing",
      "diseño",
      "diseno",
      "desarrollo web",
      "produccion",
      "producción",
      "eventos",
      "publicidad",
      "mantenimiento",
      "tecnicos",
      "técnicos",
      "marketing",
      "seguridad",
      "recursos humanos",
      "call center",
    ],
  },
  {
    id: "comercio",
    label: "Comercio",
    icon: Store,
    keywords: [
      "tienda",
      "marketplace",
      "supermercado",
      "ferreteria",
      "ferretería",
      "farmacia",
      "boutique",
      "libreria",
      "librería",
      "papeleria",
      "papelería",
      "distribuidora",
      "importadora",
      "mayorista",
      "minorista",
      "joyeria",
      "joyería",
      "florist",
      "licorera",
    ],
  },
  {
    id: "salud",
    label: "Salud",
    icon: HeartPulse,
    keywords: [
      "clinica",
      "clínica",
      "hospital",
      "consultorio",
      "fisioterapia",
      "laboratorio",
      "ips",
      "diagnostic",
      "diagnóstic",
      "vacunacion",
      "vacunación",
      "estetic",
      "estétic",
      "optica",
      "óptica",
      "psicolog",
      "nutricion",
      "nutrición",
      "veterinaria",
      "rehabilitacion",
      "rehabilitación",
      "salud",
      "medicina",
      "telemedicina",
    ],
  },
  {
    id: "educacion",
    label: "Educación",
    icon: GraduationCap,
    keywords: [
      "colegio",
      "universidad",
      "instituto",
      "academia",
      "idiomas",
      "elearning",
      "curso",
      "bootcamp",
      "guarderia",
      "guardería",
      "capacitacion",
      "capacitación",
      "escuela",
      "seminario",
      "biblioteca",
      "campus",
      "certificaci",
      "educaci",
    ],
  },
  {
    id: "agro",
    label: "Agro",
    icon: Sprout,
    keywords: [
      "cultivo",
      "agricultura",
      "ganaderia",
      "ganadería",
      "avicultura",
      "porcicultura",
      "piscicultura",
      "apicultura",
      "vivero",
      "semillas",
      "floricultura",
      "horticultura",
      "agroindustria",
      "granja",
      "agro",
    ],
  },
];

export const BLUEPRINT_CATEGORY_OTHER: BlueprintCategoryGroupOption = {
  id: "otros",
  label: "Otros",
  icon: MoreHorizontal,
  keywords: [],
};

/** Categoria (texto libre) -> grupo de filtro, por coincidencia de palabra clave. "Otros" es el fallback. */
export function groupForCategory(category: string): BlueprintCategoryGroup {
  const normalized = category.toLowerCase();
  for (const group of BLUEPRINT_CATEGORY_GROUPS) {
    if (group.keywords.some((keyword) => normalized.includes(keyword))) return group.id;
  }
  return "otros";
}

/** Puente entre el paso 1 (Tipo de Proyecto) y este filtro mas amplio del paso 2. */
export const PROJECT_CATEGORY_TO_GROUP: Record<ProjectCategory, BlueprintCategoryGroup> = {
  empresa: "empresas",
  startup: "tecnologia",
  marca_personal: "otros",
  restaurante: "otros",
  servicios: "servicios",
  comercio: "comercio",
  clinica_salud: "salud",
  educacion: "educacion",
  cultivo_agro: "agro",
  software_saas: "tecnologia",
};
