"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { getAiSettings, updateAiSettings } from "@/services/platform-config";
import type { AiProviderName, PlatformAiSettings } from "@/types/domain";

const PROVIDER_LABELS: Record<AiProviderName, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
  google: "Google (Gemini)",
};

/**
 * IA-Configuración (Sprint 18): mueve la seleccion de proveedor de la env
 * var AI_PROVIDER a un doc de Firestore (platformConfig/aiSettings) que
 * lib/ai/index.ts lee con fallback a la env var. La API key de cada
 * proveedor sigue viniendo de variables de entorno - no se guardan
 * credenciales en Firestore.
 */
export default function AdminAiConfigPage() {
  const [settings, setSettings] = useState<PlatformAiSettings | null>(null);
  const [provider, setProvider] = useState<AiProviderName>("anthropic");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAiSettings().then((s) => {
      setSettings(s);
      setProvider(s.provider);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAiSettings(provider);
      toast.success("Proveedor de IA actualizado");
      const updated = await getAiSettings();
      setSettings(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">IA-Configuración</h1>
        <p className="text-body text-muted-foreground mb-4">
          Proveedor de IA activo para el Assistant Panel y las recomendaciones.
        </p>

        {settings === null ? (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <div className="max-w-sm rounded-lg border p-4">
            <Label className="mb-2 block">Proveedor</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as AiProviderName)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_LABELS) as AiProviderName[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground mt-2">
              La API key del proveedor se configura por variable de entorno en el servidor, no aquí.
            </p>
            <Button className="mt-4" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </Button>
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
