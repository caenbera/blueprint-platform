import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { validateBlueprintJson } from "@/lib/blueprint-schema";

/**
 * El Blueprint de referencia (blueprints/asesoria-financiera.json, ver
 * docs/blueprint-json-standard.md) debe pasar siempre la validacion
 * oficial - si alguien lo edita a mano y rompe el schema, esta prueba
 * debe fallar antes de que llegue a Firestore.
 */
describe("Blueprint de referencia: Asesoría Financiera", () => {
  it("cumple el schema oficial", () => {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "..", "blueprints", "asesoria-financiera.json"), "utf8"),
    );
    expect(() => validateBlueprintJson(raw)).not.toThrow();
  });

  it("tiene al menos un Step con cada bloque opcional de la Guía y el Registro", () => {
    const raw = JSON.parse(
      readFileSync(join(__dirname, "..", "blueprints", "asesoria-financiera.json"), "utf8"),
    );
    const blueprint = validateBlueprintJson(raw);
    const allSteps = blueprint.roadmap.flatMap((phase) => phase.steps);

    expect(allSteps.some((s) => s.content.whyItMatters)).toBe(true);
    expect(allSteps.some((s) => s.content.bestPractices?.length)).toBe(true);
    expect(allSteps.some((s) => s.content.commonMistakes?.length)).toBe(true);
    expect(allSteps.some((s) => s.content.registroFields?.length)).toBe(true);
    expect(allSteps.some((s) => s.content.learnings?.length)).toBe(true);
    expect(allSteps.some((s) => s.content.inspirationalQuote)).toBe(true);
    expect(allSteps.some((s) => s.type === "monthly")).toBe(true);
  });
});
