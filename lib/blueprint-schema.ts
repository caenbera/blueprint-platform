import { z } from "zod";

/**
 * Validador Zod del "Blueprint JSON Specification v1.0" (Sprint 13, ver
 * "json explicacion.md" compartido por el usuario). Espeja el template
 * oficial campo a campo - cualquier archivo .json subido desde el
 * Constructor de Blueprints (Sprint 17) pasa primero por aqui.
 */

const stepResourceTypeEnum = z.enum([
  "pdf",
  "word",
  "excel",
  "powerpoint",
  "google_docs",
  "google_sheets",
  "google_drive",
  "dropbox",
  "onedrive",
  "firebase_storage",
  "aws_s3",
  "cloudflare",
  "youtube",
  "vimeo",
  "loom",
  "spotify",
  "podcast",
  "image",
  "video",
  "audio",
  "zip",
  "code",
  "website",
  "api",
  "form",
  "template",
  "presentation",
  "manual",
  "other",
]);

const stepResourceSchema = z.object({
  id: z.string(),
  type: stepResourceTypeEnum,
  title: z.string().default(""),
  description: z.string().default(""),
  provider: z.string().default(""),
  previewUrl: z.string().default(""),
  downloadUrl: z.string().default(""),
  embedUrl: z.string().default(""),
  thumbnailUrl: z.string().default(""),
  mimeType: z.string().default(""),
  extension: z.string().default(""),
  size: z.number().default(0),
  metadata: z
    .object({
      pages: z.number().nullable().default(null),
      duration: z.number().nullable().default(null),
      language: z.string().default("es"),
    })
    .default({ pages: null, duration: null, language: "es" }),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(["public", "organization"]).default("organization"),
});

const stepChecklistItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

const stepRecommendedToolSchema = z.object({
  name: z.string(),
  url: z.string(),
});

const stepRegistroFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum([
    "text",
    "textarea",
    "select",
    "url",
    "number",
    "date",
    "checkbox",
    "email",
    "phone",
    "multiselect",
    "color",
  ]),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional(),
  unit: z.string().optional(),
  required: z.boolean().optional(),
});

const stepContentSchema = z.object({
  overview: z
    .object({
      title: z.string().default(""),
      summary: z.string().default(""),
      body: z.string().default(""),
    })
    .default({ title: "", summary: "", body: "" }),
  objective: z.object({ description: z.string().default("") }).default({ description: "" }),
  checklist: z.array(stepChecklistItemSchema).default([]),
  resources: z.array(stepResourceSchema).default([]),
  assistant: z
    .object({
      systemPrompt: z.string().default(""),
      context: z.string().default(""),
      suggestions: z.array(z.string()).default([]),
    })
    .default({ systemPrompt: "", context: "", suggestions: [] }),
  knowledge: z.array(z.string()).default([]),
  // "notes"/"comments" del template quedan reservados a runtime (subcolecciones de ProjectStepState), no forman parte de la plantilla.
  notes: z.array(z.unknown()).optional(),
  comments: z.array(z.unknown()).optional(),
  // Pestaña "Guía del Paso" (Vista del Step, mockup "08-vista-paso.png") - todos opcionales, si faltan la tarjeta correspondiente no se muestra.
  whyItMatters: z.string().optional(),
  bestPractices: z.array(z.string()).optional(),
  commonMistakes: z.array(z.string()).optional(),
  tip: z.string().optional(),
  recommendedTools: z.array(stepRecommendedToolSchema).optional(),
  // Pestaña "Registro del Paso" - campos que cada Blueprint define.
  registroFields: z.array(stepRegistroFieldSchema).optional(),
  // Pantalla "Paso Completado" (mockup "09-paso-completado.png") - ambos opcionales.
  learnings: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  inspirationalQuote: z.string().optional(),
});

const stepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Cada Step necesita un titulo."),
  description: z.string().default(""),
  // Nombre de icono de lucide-react en kebab-case (ver types/domain.ts#BlueprintStep). Ausente = se infiere por palabra clave del titulo.
  icon: z.string().optional(),
  order: z.number().optional(),
  type: z.enum([
    "one_time",
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "semester",
    "yearly",
    "milestone",
    "custom",
  ]),
  status: z.string().optional(),
  estimatedHours: z.number().default(0),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  dependencies: z.array(z.string()).default([]),
  completionRules: z
    .object({
      requiredChecklist: z.boolean().default(false),
      requiredResources: z.boolean().default(false),
      requiredApproval: z.boolean().default(false),
      requiredQuiz: z.boolean().default(false),
    })
    .default({
      requiredChecklist: false,
      requiredResources: false,
      requiredApproval: false,
      requiredQuiz: false,
    }),
  content: stepContentSchema,
});

const phaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Cada Fase necesita un titulo."),
  description: z.string().default(""),
  objective: z.string().optional(),
  resources: z.array(stepResourceSchema).default([]),
  // Ver types/domain.ts#BlueprintBlock. Opcional: agrupa la Fase visualmente en el Roadmap del Proyecto.
  block: z.enum(["strategy", "operations", "business", "customers"]).optional(),
  order: z.number().optional(),
  steps: z.array(stepSchema).default([]),
});

export const blueprintJsonSchema = z.object({
  // El "id" del template queda ignorado a proposito: Firestore asigna su propio ID de documento (ver services/blueprints.ts#importBlueprintFromJson).
  id: z.string().optional(),
  slug: z.string().min(1, "El Blueprint necesita un slug."),
  name: z.string().min(1, "El Blueprint necesita un nombre."),
  description: z.string().default(""),
  category: z.string().default(""),
  industry: z.string().default(""),
  version: z.string().default("1.0.0"),
  author: z.string().default(""),
  language: z.string().default("es"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  estimatedDuration: z.string().default(""),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().default(""),
  icon: z.string().default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  // Ver types/domain.ts#BlueprintType. Ausente = "construction" (compatibilidad con Blueprints existentes).
  blueprintType: z.enum(["construction", "operations"]).optional(),
  settings: z
    .object({
      allowComments: z.boolean().default(true),
      allowAssistant: z.boolean().default(true),
      allowKnowledge: z.boolean().default(true),
      allowExport: z.boolean().default(true),
      allowMarketplace: z.boolean().default(true),
    })
    .default({
      allowComments: true,
      allowAssistant: true,
      allowKnowledge: true,
      allowExport: true,
      allowMarketplace: true,
    }),
  roadmap: z.array(phaseSchema).min(1, "El Blueprint debe tener al menos una Fase."),
});

export type BlueprintJsonInput = z.infer<typeof blueprintJsonSchema>;

/**
 * Valida un JSON crudo contra el schema oficial y normaliza el `order` de
 * Fases/Steps que no lo traigan explicito (se infiere de la posicion en el
 * array). Lanza un Error con un mensaje legible en español si no es valido
 * - nunca deja pasar un Blueprint mal formado a Firestore.
 */
export function validateBlueprintJson(json: unknown): Omit<BlueprintJsonInput, "id"> {
  const result = blueprintJsonSchema.safeParse(json);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(raiz)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`JSON de Blueprint inválido: ${message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a proposito: Firestore asigna su propio ID de documento.
  const { id: _ignoredTemplateId, ...blueprint } = result.data;
  return {
    ...blueprint,
    roadmap: blueprint.roadmap.map((phase, phaseIndex) => ({
      ...phase,
      order: phase.order ?? phaseIndex,
      steps: phase.steps.map((step, stepIndex) => ({
        ...step,
        order: step.order ?? stepIndex,
      })),
    })),
  };
}
