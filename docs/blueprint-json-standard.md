# Estándar del JSON de Blueprint v1.0

Este documento es la referencia única para redactar un Blueprint (propio o
de un tercero). Reemplaza la dependencia de herramientas externas: cualquier
JSON que cumpla este estándar pasa por `lib/blueprint-schema.ts`
(`validateBlueprintJson`) y se puede importar directamente, ya sea desde el
diálogo **Constructor de Blueprints → Importar JSON** o desde
`scripts/seed-blueprint.cjs <ruta-al-json>`.

## Filosofía

Un Blueprint describe **un motor de ejecución**, nunca un documento fijo:

1. **Universal** — nada de campos específicos de una industria. Si algo es
   propio de "Asesoría Financiera" pero no de "Restaurante", va dentro del
   `content` de un Step, no como un campo nuevo del schema.
2. **Declarativo** — el JSON es datos puros. Nunca lógica ni código.
3. **Modular** — cada Fase y cada Step debe poder leerse y tener sentido por
   sí solo, sin depender de otro Step para saber qué hacer.
4. **Versionado** — todo Blueprint lleva `version` (semver del contenido,
   ej. `"1.0.0"`).
5. **Extensible** — nunca se modifica el significado de un campo existente,
   solo se agregan campos opcionales nuevos. Así un Blueprint viejo nunca se
   rompe cuando el schema crece (ver por ejemplo `whyItMatters`,
   `bestPractices`, `registroFields`, `phase.objective`, `phase.resources`,
   todos agregados después del schema original sin tocar Blueprints ya
   existentes).

La jerarquía es fija y no tiene más niveles que estos:

```
Blueprint → roadmap (Fase[]) → steps (Step[]) → content → resources
```

**Un Step es la única unidad ejecutable.** Todo lo demás (Fase, Blueprint)
solo agrupa u organiza.

## Convención de IDs

Todo `id` debe ser único dentro del Blueprint y usar un prefijo legible que
diga qué es, en `kebab-case`:

| Entidad           | Prefijo | Ejemplo                                                                                                             |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| Blueprint         | `bp-`   | `bp-asesoria-financiera` (informativo — Firestore asigna su propio ID de documento al importar, ver `id` más abajo) |
| Fase              | `fase-` | `fase-fundacion`                                                                                                    |
| Step              | `step-` | `step-definir-servicios`                                                                                            |
| Checklist item    | `chk-`  | `chk-comparar-estructuras`                                                                                          |
| Resource          | `res-`  | `res-guia-tipos-sociedad`                                                                                           |
| Campo de Registro | `reg-`  | `reg-nombre-cliente`                                                                                                |

Esto no es un requisito del validador (Zod solo exige `string` no vacío) —
es disciplina de autoría para que un Step, checklist item o recurso se
pueda referenciar sin ambigüedad a simple vista, incluso cuando en el
futuro haya cientos de Blueprints.

## Bloques del JSON

### Metadata (raíz del documento)

```json
{
  "id": "bp-asesoria-financiera",
  "slug": "asesoria-financiera",
  "name": "Asesoría Financiera",
  "description": "...",
  "category": "Servicios profesionales",
  "industry": "Finanzas",
  "version": "1.0.0",
  "author": "Blueprint",
  "language": "es",
  "difficulty": "beginner | intermediate | advanced",
  "estimatedDuration": "10-14 semanas",
  "tags": ["finanzas", "asesoría"],
  "coverImage": "",
  "icon": "line-chart",
  "status": "draft | published | archived"
}
```

`id` se ignora a propósito al importar — Firestore asigna su propio ID de
documento (`services/blueprints.ts#importBlueprintFromJson`). Se incluye
solo como referencia legible del archivo fuente.

### Configuration

```json
{
  "blueprintType": "construction | operations",
  "settings": {
    "allowComments": true,
    "allowAssistant": true,
    "allowKnowledge": true,
    "allowExport": true,
    "allowMarketplace": true
  }
}
```

`blueprintType` es opcional (ausente = `"construction"`, compatible con
Blueprints ya existentes). **No cambia el motor de Steps** — el mismo
`BlueprintStep` con sus tipos (`one_time`, `weekly`, `monthly`, etc.) sirve
para ambos casos. Solo cambia cómo se interpreta el avance:

- `"construction"`: tiene principio y fin. El % de avance
  (`calculateProjectProgress`) solo cuenta Steps `type: "one_time"` y puede
  llegar a 100%.
- `"operations"`: ciclo recurrente sin fin (ej. una semana de operación:
  Strategy → Operations → Business → Customers). No hay "100% definitivo",
  solo progreso del período activo. **El seguimiento por período todavía no
  está implementado** — hoy un Blueprint `operations` se puede redactar y
  leer, pero un Step recurrente marcado como completado queda completado
  para siempre (no se reinicia cada semana). No declares un Blueprint
  `operations` en producción todavía; úsalo solo para prototipar contenido.

### Phases (`roadmap`)

```json
{
  "id": "fase-fundacion",
  "title": "Fundación del negocio",
  "description": "...",
  "objective": "Resultado esperado al completar la fase (opcional).",
  "resources": [/* StepResource[], recursos generales de toda la fase, opcional */],
  "block": "strategy | operations | business | customers",
  "order": 0,
  "steps": [/* Step[] */]
}
```

`order` es opcional — si falta, se infiere de la posición en el array
(`validateBlueprintJson` lo normaliza). `objective` y `resources` son
opcionales: si faltan, la tarjeta correspondiente simplemente no se
muestra en la Vista de la Fase — nunca se inventa contenido de relleno.

`block` es opcional y agrupa visualmente las Fases en el Roadmap del
Proyecto bajo 4 secciones universales (`lib/phase-block.ts`): **Estrategia**
(qué se ofrece y a qué valor), **Operaciones** (cumplimiento y
herramientas internas), **Negocio** (trámites legales/bancarios de
arranque) y **Clientes** (todo lo de cara al mercado, incluida su
atención). Si ninguna Fase de un Blueprint trae `block`, el Roadmap
muestra la lista plana de siempre - retrocompatible.

**Qué Fases va en cuál bloque es una decisión de contenido por Blueprint,
no parte del estándar universal** - varía según el rubro (una clínica, un
restaurante o un SaaS agrupan sus Fases distinto). Los 4 bloques en sí son
fijos y compartidos entre todos los Blueprints (incluidos los de
`blueprintType: "operations"` cuando se construya ese módulo, ver "Fuera
de alcance" más abajo) - lo que cambia por industria es solo a cuál de
los 4 pertenece cada Fase.

### Steps

Cada Step va dentro de `phase.steps[]` (nunca aplanado — ver nota al final
sobre por qué). Campos:

```json
{
  "id": "step-definir-servicios",
  "title": "Definir el catálogo de servicios",
  "description": "Descripción corta, 1-2 líneas.",
  "icon": "list-checks",
  "order": 0,
  "type": "one_time | daily | weekly | monthly | quarterly | semester | yearly | milestone | custom",
  "estimatedHours": 2,
  "difficulty": "easy | medium | hard",
  "priority": "low | normal | high",
  "dependencies": ["step-otro-id"],
  "completionRules": {
    "requiredChecklist": true,
    "requiredResources": false,
    "requiredApproval": false,
    "requiredQuiz": false
  },
  "content": {/* ver abajo */}
}
```

`icon` es opcional: el nombre de un icono de `lucide-react` en kebab-case
(mismo formato que el `icon` del Blueprint, ej. `"scale"`, `"landmark"`,
`"line-chart"` — ver [lucide.dev/icons](https://lucide.dev/icons) para el
catálogo completo). Si el nombre no existe en `lucide-react`, o si el
campo falta, `lib/step-icon.ts#resolveStepIcon` cae a una inferencia por
palabra clave del título, y si tampoco hay coincidencia usa un icono
genérico (`Target`) - nunca falla el import por un icono inválido.

`type` define el ciclo de vida del Step, nunca su estructura — un Step
`weekly` tiene exactamente la misma forma que uno `one_time`. Solo
`one_time` cuenta para el % de avance de un Blueprint `construction`.

### Content (dentro de cada Step)

Obligatorios (si faltan, Zod aplica sus valores por defecto — nunca
truena el import, pero el Step queda vacío en esa sección):

- `overview: { title, summary, body }`
- `objective: { description }`
- `checklist: [{ id, task, description?, completed? }]`
- `resources: StepResource[]`
- `assistant: { systemPrompt, context, suggestions[] }`
- `knowledge: string[]` (IDs de `KnowledgeItem`, casi siempre `[]` al
  redactar un Blueprint nuevo — se llena después desde la Biblioteca)

Opcionales — pestaña "Guía del Paso" (si faltan, la tarjeta correspondiente
no se muestra, nunca se rellena con texto genérico):

- `whyItMatters: string`
- `bestPractices: string[]`
- `commonMistakes: string[]`
- `tip: string`
- `recommendedTools: [{ name, url }]`

Opcionales — pestaña "Registro del Paso" (campos que el usuario llena al
ejecutar el Step, ej. datos de una reunión con cliente):

- `registroFields: StepRegistroField[]`

```ts
{
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "url" | "number" | "date" |
        "checkbox" | "email" | "phone" | "multiselect" | "color";
  placeholder?: string;
  helpText?: string;
  options?: string[];   // "select" (una opción) y "multiselect" (varias)
  unit?: string;        // solo "number", ej. "USD", "%", "horas"
  required?: boolean;
}
```

Los 11 tipos:

| Tipo          | Qué captura                                                                | Ejemplo                                     |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| `text`        | Texto corto de una línea                                                   | Nombre comercial elegido                    |
| `textarea`    | Texto largo/multilínea                                                     | Notas de una reunión, política documentada  |
| `select`      | Una opción de una lista fija (`options`)                                   | Modelo de tarifa: Fija / AUM / Por hora     |
| `multiselect` | Varias opciones de una lista fija (`options`)                              | Canales de contenido: LinkedIn, Blog        |
| `url`         | Un enlace                                                                  | Enlace a un archivo en Google Drive         |
| `number`      | Un valor numérico, con `unit` opcional                                     | Capital de arranque, patrimonio del cliente |
| `date`        | Una fecha                                                                  | Fecha de constitución legal                 |
| `checkbox`    | Sí/No                                                                      | ¿Recibes comisiones de terceros?            |
| `email`       | Un correo electrónico                                                      | Correo profesional configurado              |
| `phone`       | Un teléfono                                                                | Número de línea profesional                 |
| `color`       | Uno o varios colores en HEX, con vista previa y botón "+" para agregar más | Paleta de colores de marca                  |

**Convención de almacenamiento** (`ProjectStepState.registroData: Record<string, string>` -
nunca cambia de forma, todo se guarda como string, sin importar el tipo):

- `checkbox` → `"true"` / `"false"`.
- `multiselect` y `color` (ambos multivalor) → valores separados por coma, ej.
  `"LinkedIn,Blog"` o `"#2563EB,#F59E0B"`.
- El resto → el valor tal cual; solo cambia qué `<input type="...">` usa el
  navegador para capturarlo (numérico, fecha, correo, teléfono).

**Por qué no existe un tipo `file`**: Blueprint nunca guarda archivos
binarios, solo referencias (mismo principio que `StepResource`, ver más
abajo). Para "adjuntar" un logo, una foto o un documento, se usa `url`
apuntando a donde el usuario ya lo guardó (ej. su carpeta de Google
Drive) - nunca una subida directa.

Opcionales — pantalla "Paso Completado":

- `learnings: [{ title, description }]`
- `inspirationalQuote: string`

### Resources (`StepResource`, usado en `phase.resources` y `content.resources`)

```json
{
  "id": "res-guia-tarifas",
  "type": "pdf | word | excel | powerpoint | google_docs | google_sheets | google_drive | dropbox | onedrive | firebase_storage | aws_s3 | cloudflare | youtube | vimeo | loom | spotify | podcast | image | video | audio | zip | code | website | api | form | template | presentation | manual | other",
  "title": "...",
  "description": "...",
  "provider": "Blueprint",
  "previewUrl": "",
  "downloadUrl": "",
  "embedUrl": "",
  "thumbnailUrl": "",
  "mimeType": "",
  "extension": "",
  "size": 0,
  "metadata": { "pages": null, "duration": null, "language": "es" },
  "tags": [],
  "visibility": "organization | public"
}
```

Nunca se sube un binario dentro del JSON — solo referencias (URL o campos
vacíos si el recurso real todavía no existe; el Step sigue siendo válido,
simplemente ese recurso no tendrá enlace hasta que se complete después).

### AI (`content.assistant`)

Contexto para el Asistente de IA de ese Step específico — nunca historial
de conversación, nunca contexto de otro Step. `systemPrompt` define su rol,
`context` la situación puntual del usuario en ese Step, `suggestions` son
prompts iniciales sugeridos en la UI.

### Rules (`completionRules` + `dependencies`)

`dependencies` son IDs de otros Steps que deben estar `completed` antes de
que este se desbloquee (`services/step-state.ts#isStepBlocked`).
`completionRules` son condiciones adicionales para poder marcarlo como
completado — hoy solo `requiredChecklist` se aplica en la UI; el resto
quedan declarados para consumo futuro.

## Bloques del estándar propuesto que NO se adoptan todavía

`Variables`, `Documents` (como plantilla declarada en el Blueprint),
`Automations`, `Analytics` y `Localization` se evaluaron y se decidió
diferirlos — no hay ningún caso de uso real todavía que los necesite, y
`Variables` en particular ya se resuelve con `registroFields`. Ver
`docs/roadmap.md` (o el plan de implementación vigente) para el detalle de
por qué y cuándo se reconsideran.

## ¿Por qué los Steps siguen anidados en cada Fase (no aplanados)?

Existe una propuesta de que `steps` viva en un array plano a nivel raíz,
cada uno referenciando su Fase por `phaseId`, para poder reordenar/buscar
Steps sin depender de su posición en el árbol. Se decidió no adoptarla
todavía: el motor completo (`services/step-state.ts`,
`lib/blueprint-schema.ts`, las 9 pantallas de Construcción) ya está
construido sobre la forma anidada, y el beneficio de aplanar solo aplica
cuando hay muchos Blueprints reales que reutilizar entre sí — hoy no los
hay. Se reevaluará cuando el Marketplace tenga volumen real de contenido.

## Ejemplo mínimo end-to-end

Ver `public/templates/blueprint-template.json` (plantilla descargable
desde el diálogo de importación) para un Blueprint válido de 2 Fases / 3
Steps. Ver `blueprints/asesoria-financiera.json` para el Blueprint de
referencia completo, con todos los campos opcionales usados en al menos
un Step.
