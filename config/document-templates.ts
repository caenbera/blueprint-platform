import type { DocumentTemplateType } from "@/types/domain";

export interface DocumentTemplateConfig {
  type: DocumentTemplateType;
  label: string;
  description: string;
}

/** Catalogo de las 11 plantillas oficiales (Prompt 4.6). */
export const DOCUMENT_TEMPLATES: DocumentTemplateConfig[] = [
  { type: "plan_negocio", label: "Plan de Negocio", description: "Documento integral del negocio" },
  {
    type: "modelo_negocio",
    label: "Modelo de Negocio",
    description: "Estructura del modelo de negocio",
  },
  {
    type: "propuesta_comercial",
    label: "Propuesta Comercial",
    description: "Oferta para un cliente",
  },
  { type: "plan_estrategico", label: "Plan Estratégico", description: "Objetivos y estrategia" },
  { type: "manual_procesos", label: "Manual de Procesos", description: "Procesos documentados" },
  { type: "manual_operativo", label: "Manual Operativo", description: "Operación del día a día" },
  { type: "informe_ejecutivo", label: "Informe Ejecutivo", description: "Resumen para dirección" },
  {
    type: "diagnostico_empresarial",
    label: "Diagnóstico Empresarial",
    description: "Evaluación de la empresa",
  },
  { type: "presentacion", label: "Presentación", description: "Contenido para presentar" },
  {
    type: "reporte_financiero",
    label: "Reporte Financiero",
    description: "Resultados financieros",
  },
  { type: "personalizado", label: "Documento Personalizado", description: "Estructura libre" },
];

export function getDocumentTemplateLabel(type: DocumentTemplateType): string {
  return DOCUMENT_TEMPLATES.find((t) => t.type === type)?.label ?? type;
}
