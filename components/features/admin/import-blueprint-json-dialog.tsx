"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, Plus, Trash2, Upload, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importBlueprintFromJson } from "@/services/blueprints";
import { cn } from "@/lib/utils";

const ALLOWED_BLOCKS = ["strategy", "operations", "business", "customers"];

interface FileItem {
  name: string;
  isMeta: boolean;
  content: any;
}

/** Quita un fence markdown (```json ... ``` o ``` ... ```) que a veces envuelve la respuesta completa de un LLM. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}

/**
 * Importar Blueprint desde JSON (Sprint 17 - flujo priorizado sobre el
 * constructor visual drag-and-drop, que queda para despues).
 * Soporta dos modos:
 *   1. "single": Pegar texto / Subir archivo único.
 *   2. "multiple": Subir múltiples fragmentos JSON (fases + meta.json) que se
 *      ensamblan directamente en el navegador.
 */
export function ImportBlueprintJsonDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const router = useRouter();
  
  // Modo de importación
  const [importMode, setImportMode] = useState<"single" | "multiple">("single");
  
  // Estado para modo archivo único / texto concatenado
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePartIndex = useRef(0);
  const [parts, setParts] = useState<string[]>([""]);
  
  // Estado para modo múltiples fragmentos (chunks)
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const [multipleFiles, setMultipleFiles] = useState<FileItem[]>([]);
  const [assembledBlueprint, setAssembledBlueprint] = useState<any>(null);
  const [assemblyWarnings, setAssemblyWarnings] = useState<string[]>([]);

  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- MÉTODOS MODO ÚNICO ---
  function updatePart(index: number, value: string) {
    setParts((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPart() {
    setParts((prev) => [...prev, ""]);
  }

  function removePart(index: number) {
    setParts((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePart(filePartIndex.current, String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  const combinedText = stripCodeFence(parts.join(""));
  const hasContentSingle = parts.some((p) => p.trim());

  // --- MÉTODOS MODO MÚLTIPLE (FRAGMENTS) ---
  async function handleMultipleFilesPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    try {
      const readFilesPromises = selectedFiles.map((file) => {
        return new Promise<FileItem>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const content = JSON.parse(String(reader.result ?? ""));
              // Identifica si es el de metadatos raíz o es una fase
              const isMeta = content && content.slug && content.name && !content.block;
              resolve({
                name: file.name,
                isMeta,
                content,
              });
            } catch (err) {
              reject(new Error(`El archivo '${file.name}' no contiene un JSON válido.`));
            }
          };
          reader.onerror = () => reject(new Error(`Error leyendo el archivo '${file.name}'.`));
          reader.readAsText(file);
        });
      });

      const parsedItems = await Promise.all(readFilesPromises);
      
      setMultipleFiles((prev) => {
        const next = [...prev, ...parsedItems];
        // Quita duplicados por nombre de archivo para evitar errores
        const unique = next.filter((item, idx, self) =>
          self.findIndex((t) => t.name === item.name) === idx
        );
        triggerAssembly(unique);
        return unique;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar los fragmentos.");
    } finally {
      e.target.value = "";
    }
  }

  function removeMultipleFile(index: number) {
    setMultipleFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      triggerAssembly(next);
      return next;
    });
  }

  function clearMultipleFiles() {
    setMultipleFiles([]);
    setAssembledBlueprint(null);
    setAssemblyWarnings([]);
    setError(null);
  }

  function triggerAssembly(items: FileItem[]) {
    setError(null);
    setAssembledBlueprint(null);
    setAssemblyWarnings([]);

    if (items.length === 0) return;

    // Buscar el archivo de metadatos globales
    const metaItem = items.find((item) => item.isMeta);
    if (!metaItem) {
      setError(
        "No se encontró el archivo de metadatos globales (debe contener 'slug' y 'name' en la raíz, y no debe tener la propiedad 'block'). Asegúrate de incluir 'meta.json'."
      );
      return;
    }

    // Fases (todos los archivos que no sean meta), ordenados alfabéticamente
    const phaseItems = items
      .filter((item) => item !== metaItem)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (phaseItems.length === 0) {
      // Aún no hay fases subidas, está bien, no hay error crítico todavía, solo esperamos
      return;
    }

    const phases: any[] = [];
    const warnings: string[] = [];

    for (const item of phaseItems) {
      // Crear una copia profunda del objeto de fase para evitar modificar el estado original
      const phase = JSON.parse(JSON.stringify(item.content));

      // Normalizar fase si viene en formato informal
      if (phase.phase && !phase.title) {
        phase.title = phase.phase;
      }

      if (!phase.id && phase.title) {
        // Generar un ID de fase limpio basado en el título
        phase.id = "fase-" + phase.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }

      if (!phase.id || !phase.title || !phase.block) {
        setError(`El archivo '${item.name}' no tiene una estructura de fase válida (requiere 'id', 'title' y 'block').`);
        return;
      }

      if (!ALLOWED_BLOCKS.includes(phase.block)) {
        setError(`En '${item.name}': El bloque '${phase.block}' no es válido. Debe ser uno de: ${ALLOWED_BLOCKS.join(", ")}`);
        return;
      }

      // Autocalcular orden de la fase
      phase.order = phases.length;

      const steps = phase.steps || [];
      phase.steps = steps.map((step: any, stepIndex: number) => {
        // Normalizar estructura del paso si viene en formato informal (ej: con "guide" en la raíz)
        if (step.guide && !step.content) {
          step.content = {
            overview: {
              title: step.title,
              summary: step.title,
              body: step.guide.whyItMatters || ""
            },
            objective: {
              description: ""
            },
            whyItMatters: step.guide.whyItMatters || "",
            bestPractices: step.guide.bestPractices || [],
            commonMistakes: step.guide.commonMistakes || [],
            tip: step.guide.tip || "",
            recommendedTools: step.guide.recommendedTools || [],
            registroFields: step.registroFields || [],
            checklist: (step.checklist || []).map((checkItem: any, idx: number) => ({
              id: checkItem.id || `chk-${step.id}-${idx}`,
              task: checkItem.text || checkItem.task || ""
            }))
          };

          // Limpiar campos obsoletos del nivel de raíz
          delete step.guide;
          delete step.registroFields;
          delete step.checklist;
        }

        // Rellenar valores por defecto para campos obligatorios
        if (!step.type) {
          step.type = "one_time";
        }
        if (step.estimatedHours === undefined) {
          step.estimatedHours = 0;
        }
        if (!step.difficulty) {
          step.difficulty = "easy";
        }
        if (!step.priority) {
          step.priority = "normal";
        }
        if (!step.dependencies) {
          step.dependencies = [];
        }

        if (!step.id || !step.title || !step.type) {
          setError(`En '${item.name}', paso '${step.title || "sin título"}': Debe contener 'id', 'title' y 'type'.`);
          return step;
        }

        // Validar coherencia de checklist
        const checklistTasks = (step.content?.checklist || []).map((t: any) => t.task.toLowerCase());
        const registroIds = (step.content?.registroFields || []).map((f: any) => f.id);
        const requiresFields = checklistTasks.some((task: string) =>
          task.includes("definir") ||
          task.includes("calcular") ||
          task.includes("redactar") ||
          task.includes("establecer") ||
          task.includes("registrar")
        );

        if (requiresFields && registroIds.length === 0) {
          warnings.push(`Paso "${step.title}": pide definir/calcular datos en su checklist pero no tiene campos en Registro del Paso.`);
        }

        return step;
      });

      phases.push(phase);
    }

    setAssembledBlueprint({
      ...metaItem.content,
      roadmap: phases,
    });
    setAssemblyWarnings(warnings);
  }

  // --- IMPORTACIÓN FINAL ---
  async function handleImport() {
    setError(null);
    let parsed: any;

    if (importMode === "single") {
      try {
        parsed = JSON.parse(combinedText);
      } catch {
        setError(
          parts.length > 1
            ? "El texto combinado no es JSON válido. Revisa que cada parte esté completa, en el orden correcto y sin texto de más (como explicaciones del asistente)."
            : "El texto no es JSON válido.",
        );
        return;
      }
    } else {
      if (!assembledBlueprint) {
        setError("Por favor, asegúrate de subir el archivo de metadatos y al menos una fase válida.");
        return;
      }
      parsed = assembledBlueprint;
    }

    setImporting(true);
    try {
      const blueprintId = await importBlueprintFromJson(parsed);
      toast.success("Blueprint importado exitosamente");
      setParts([""]);
      clearMultipleFiles();
      onOpenChange(false);
      onImported();
      router.push(`/admin/blueprints/${blueprintId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el Blueprint.");
    } finally {
      setImporting(false);
    }
  }

  const hasContent = importMode === "single" ? hasContentSingle : assembledBlueprint !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Blueprint desde JSON</DialogTitle>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex border-b mb-3">
          <button
            type="button"
            onClick={() => { setImportMode("single"); setError(null); }}
            className={cn(
              "flex-1 py-2 text-center text-small font-medium border-b-2 transition-colors",
              importMode === "single"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Archivo Único o Texto
          </button>
          <button
            type="button"
            onClick={() => { setImportMode("multiple"); setError(null); }}
            className={cn(
              "flex-1 py-2 text-center text-small font-medium border-b-2 transition-colors",
              importMode === "multiple"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Múltiples Fragmentos (Chunks)
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {importMode === "single" ? (
            // --- MODO ARCHIVO ÚNICO O TEXTO PEGADO ---
            <>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,text/plain"
                  onChange={handleFilePick}
                  className="hidden"
                />
                <Button variant="ghost" size="sm" asChild>
                  <a href="/templates/blueprint-template.json" download>
                    <Download className="h-3.5 w-3.5" /> Descargar plantilla
                  </a>
                </Button>
              </div>

              <p className="text-small text-muted-foreground">
                Si el JSON viene cortado en varios mensajes de texto, pega cada fragmento en su propio cuadro, en
                el mismo orden en que lo recibiste. Se unirán automáticamente sin espacios extras.
              </p>

              {parts.map((part, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-small text-muted-foreground font-medium">
                      Parte {i + 1}
                      {parts.length === 1 ? "" : ` de ${parts.length}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          filePartIndex.current = i;
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload className="h-3.5 w-3.5" /> Subir archivo
                      </Button>
                      {parts.length > 1 && (
                        <Button variant="ghost" size="icon-sm" onClick={() => removePart(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={part}
                    onChange={(e) => updatePart(i, e.target.value)}
                    placeholder={
                      i === 0 ? "Pega aquí el JSON del Blueprint..." : "Pega aquí la siguiente parte..."
                    }
                    className="min-h-40 font-mono text-xs"
                  />
                </div>
              ))}

              <Button variant="outline" size="sm" className="self-start" onClick={addPart}>
                <Plus className="h-3.5 w-3.5" /> Agregar otra parte
              </Button>

              {hasContentSingle && (
                <p className="text-caption text-muted-foreground">
                  Texto combinado: {combinedText.length.toLocaleString("es")} caracteres.
                </p>
              )}
            </>
          ) : (
            // --- MODO MÚLTIPLES FRAGMENTOS (CHUNKS DE IA) ---
            <>
              <p className="text-small text-muted-foreground">
                Selecciona a la vez el archivo de metadatos globales (`meta.json`) y todos los archivos JSON de las fases de tu proyecto. Se unirán y ordenarán automáticamente en tu navegador.
              </p>

              <div
                onClick={() => multipleFileInputRef.current?.click()}
                className="border-2 border-dashed border-muted rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-muted/10 cursor-pointer hover:bg-muted/20 hover:border-primary/40 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-small font-semibold text-foreground">Arrastra o selecciona tus fragmentos JSON</p>
                <p className="text-caption text-muted-foreground text-center max-w-sm">
                  Tip: El archivo de metadatos debe contener el `slug` y el `name`. Nombra tus archivos de fases con números iniciales (ej: 01-fase.json) para mantener el orden secuencial.
                </p>
                <input
                  ref={multipleFileInputRef}
                  type="file"
                  multiple
                  accept="application/json"
                  className="hidden"
                  onChange={handleMultipleFilesPick}
                />
              </div>

              {multipleFiles.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-small font-semibold">Archivos cargados ({multipleFiles.length})</span>
                    <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={clearMultipleFiles}>
                      Limpiar todos
                    </Button>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto border border-border/60 rounded-lg divide-y bg-background text-xs">
                    {multipleFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-2 truncate max-w-[70%]">
                          <span className="font-mono truncate">{file.name}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          file.isMeta ? "bg-info/10 text-info" : "bg-success/10 text-success"
                        )}>
                          {file.isMeta ? "Metadatos" : "Fase"}
                        </span>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeMultipleFile(idx)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assembledBlueprint && (
                <div className="bg-success/15 border border-success/20 rounded-lg p-3 text-xs text-foreground flex items-start gap-2 mt-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-success">¡Blueprint ensamblado correctamente en el navegador!</p>
                    <p className="mt-1 text-muted-foreground">
                      <strong>Nombre:</strong> {assembledBlueprint.name} | <strong>Fases:</strong> {assembledBlueprint.roadmap.length} | <strong>Pasos totales:</strong> {assembledBlueprint.roadmap.reduce((acc: number, f: any) => acc + (f.steps || []).length, 0)}
                    </p>
                  </div>
                </div>
              )}

              {assemblyWarnings.length > 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-foreground mt-2 max-h-36 overflow-y-auto">
                  <p className="font-semibold text-warning-foreground mb-1">⚠️ Advertencias de coherencia:</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {assemblyWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {error && <p className="text-small text-destructive whitespace-pre-wrap">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={!hasContent || importing}>
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Importar Blueprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
