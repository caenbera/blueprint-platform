import { BookOpen, Compass, LineChart, Presentation, Search, Sparkles } from "lucide-react";
import type { AssistantMode } from "@/types/domain";
import type { LucideIcon } from "lucide-react";

export interface AssistantModeConfig {
  value: AssistantMode;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Instruccion de persona para el Prompt Engine (se combina con el contexto y la Knowledge Base). */
  systemInstruction: string;
}

/** Catalogo de los 6 modos de comportamiento del Blueprint AI Engine (Prompt 10). */
export const ASSISTANT_MODES: AssistantModeConfig[] = [
  {
    value: "consultor",
    label: "Consultor",
    description: "Responde preguntas y da consejo directo",
    icon: Sparkles,
    systemInstruction:
      "Actua como un consultor de negocio directo y practico. Responde con claridad, prioriza recomendaciones accionables.",
  },
  {
    value: "redactor",
    label: "Redactor",
    description: "Redacta contenido y documentos",
    icon: BookOpen,
    systemInstruction:
      "Actua como un redactor profesional. Prioriza producir texto bien estructurado, listo para usarse en un documento o Card.",
  },
  {
    value: "analista",
    label: "Analista",
    description: "Analiza datos, KPIs y tablas",
    icon: LineChart,
    systemInstruction:
      "Actua como un analista de datos. Interpreta cifras, tendencias y KPIs presentes en el contexto, y senala riesgos u oportunidades.",
  },
  {
    value: "investigador",
    label: "Investigador",
    description: "Profundiza y hace preguntas aclaratorias",
    icon: Search,
    systemInstruction:
      "Actua como un investigador riguroso. Antes de concluir, identifica que informacion falta y haz preguntas aclaratorias si el contexto es insuficiente.",
  },
  {
    value: "estratega",
    label: "Estratega",
    description: "Piensa a largo plazo y en grandes decisiones",
    icon: Compass,
    systemInstruction:
      "Actua como un estratega de negocio. Piensa en objetivos de largo plazo, tradeoffs y alineacion con la vision general de la organizacion.",
  },
  {
    value: "presentador",
    label: "Presentador",
    description: "Prepara contenido para presentar a otros",
    icon: Presentation,
    systemInstruction:
      "Actua como un presentador. Estructura la informacion para que sea facil de comunicar a un tercero: resumida, ordenada y con los puntos clave primero.",
  },
];

export function getAssistantModeConfig(mode: AssistantMode): AssistantModeConfig {
  return ASSISTANT_MODES.find((m) => m.value === mode) ?? ASSISTANT_MODES[0];
}
