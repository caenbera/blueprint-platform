"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";
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

/**
 * Importar Blueprint desde JSON (Sprint 17 - flujo priorizado sobre el
 * constructor visual drag-and-drop, que queda para despues). Sube un
 * archivo .json o pega el JSON directamente; se valida contra
 * lib/blueprint-schema.ts dentro de importBlueprintFromJson antes de
 * escribir nada en Firestore.
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
  const [jsonText, setJsonText] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("El texto no es JSON válido.");
      return;
    }

    setImporting(true);
    try {
      const blueprintId = await importBlueprintFromJson(parsed);
      toast.success("Blueprint importado");
      setJsonText("");
      onOpenChange(false);
      onImported();
      router.push(`/admin/blueprints/${blueprintId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el Blueprint.");
    } finally {
      setImporting(false);
    }
  }

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
              accept="application/json"
              onChange={handleFilePick}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Subir archivo .json
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/templates/blueprint-template.json" download>
                <Download className="h-3.5 w-3.5" /> Descargar plantilla
              </a>
            </Button>
          </div>

          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="O pega aquí el JSON del Blueprint..."
            className="min-h-64 font-mono text-xs"
          />

          {error && <p className="text-small text-destructive whitespace-pre-wrap">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={!jsonText.trim() || importing}>
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Importar Blueprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
