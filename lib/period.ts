import { format, getISOWeek, getISOWeekYear, getQuarter } from "date-fns";
import type { StepType } from "@/types/domain";

/**
 * Motor de seguimiento por periodo (modulo Operacion): calcula la clave
 * del periodo "actual" para un Step recurrente. Un Step se considera
 * completado "ahora" si existe `ProjectStepState.periodCompletions[key]`
 * para la clave devuelta aqui - cuando el periodo cambia (nueva semana,
 * nuevo mes...) la clave cambia y el Step vuelve a verse pendiente
 * automaticamente, sin necesidad de ningun job de reinicio.
 *
 * `one_time`, `milestone` y `custom` no son periodicos - devuelven
 * `null` y siguen completandose con status/completedAt de siempre
 * (ver services/step-state.ts#isStepDoneNow).
 */
export function getCurrentPeriodKey(stepType: StepType, now: Date = new Date()): string | null {
  switch (stepType) {
    case "daily":
      return format(now, "yyyy-MM-dd");
    case "weekly":
      // getISOWeekYear evita el caso borde de fin/inicio de año donde el
      // numero de semana ISO pertenece al año adyacente.
      return `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;
    case "monthly":
      return format(now, "yyyy-MM");
    case "quarterly":
      return `${format(now, "yyyy")}-Q${getQuarter(now)}`;
    case "semester":
      return `${format(now, "yyyy")}-S${now.getMonth() < 6 ? 1 : 2}`;
    case "yearly":
      return format(now, "yyyy");
    case "one_time":
    case "milestone":
    case "custom":
      return null;
  }
}

/** Etiqueta legible del periodo actual, para el boton "Marcar completado esta semana/este mes/..." y encabezados de la pagina Operacion. */
export function periodLabel(stepType: StepType): string {
  switch (stepType) {
    case "daily":
      return "hoy";
    case "weekly":
      return "esta semana";
    case "monthly":
      return "este mes";
    case "quarterly":
      return "este trimestre";
    case "semester":
      return "este semestre";
    case "yearly":
      return "este año";
    default:
      return "";
  }
}
