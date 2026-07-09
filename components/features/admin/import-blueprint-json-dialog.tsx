"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, Plus, Trash2, Upload } from "lucide-react";
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

/** Quita un fence markdown (```json ... ``` o ``` ... ```) que a veces envuelve la respuesta completa de un LLM. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}

/**
 * Importar Blueprint desde JSON (Sprint 17 - flujo priorizado sobre el
 * constructor visual drag-and-drop, que queda para despues). Sube un
 * archivo .json o pega el JSON directamente; se valida contra
 * lib/blueprint-schema.ts dentro de importBlueprintFromJson antes de
 * escribir nada en Firestore.
 *
 * Soporte "varias partes": cuando el LLM que redacta el JSON lo corta por
 * limite de longitud de respuesta, el usuario pega cada fragmento de texto
 * en su propio cuadro, EN ORDEN, sin editarlos - se concatenan tal cual
 * (sin separador, sin recortar cada parte individualmente, porque el corte
 * puede caer en medio de una palabra o un string) y el resultado se valida
 * como un unico JSON antes de importar.
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePartIndex = useRef(0);
  const [parts, setParts] = useState<string[]>([""]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleImport() {
    setError(null);
    let parsed: unknown;
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

    setImporting(true);
    try {
      const blueprintId = await importBlueprintFromJson(parsed);
      toast.success("Blueprint importado");
      setParts([""]);
      onOpenChange(false);
      onImported();
      router.push(`/admin/blueprints/${blueprintId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el Blueprint.");
    } finally {
      setImporting(false);
    }
  }

  const hasContent = parts.some((p) => p.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Blueprint desde JSON</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
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
            Si el JSON viene cortado en varios mensajes, pega cada fragmento en su propio cuadro, en
            el mismo orden en que lo recibiste, y agrega tantos cuadros como partes tengas.
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

          {hasContent && (
            <p className="text-caption text-muted-foreground">
              Texto combinado: {combinedText.length.toLocaleString("es")} caracteres.
            </p>
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
