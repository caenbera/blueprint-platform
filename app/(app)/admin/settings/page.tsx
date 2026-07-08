"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";
import { getGeneralSettings, updateGeneralSettings } from "@/services/platform-config";
import type { PlatformGeneralSettings } from "@/types/domain";

/**
 * Configuración Global (Sprint 18): platformName es solo informativo hoy
 * (no se renderiza en ningún otro lugar de la UI todavía).
 * allowNewRegistrations se aplica de verdad en app/api/organizations/route.ts
 * y maintenanceMode en app/(app)/layout.tsx - no son toggles decorativos.
 */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformGeneralSettings | null>(null);
  const [platformName, setPlatformName] = useState("");
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGeneralSettings().then((s) => {
      setSettings(s);
      setPlatformName(s.platformName);
      setAllowNewRegistrations(s.allowNewRegistrations);
      setMaintenanceMode(s.maintenanceMode);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateGeneralSettings({ platformName, allowNewRegistrations, maintenanceMode });
      toast.success("Configuración global actualizada");
      const updated = await getGeneralSettings();
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
        <h1 className="text-h3 mb-1">Configuración Global</h1>
        <p className="text-body text-muted-foreground mb-4">
          Ajustes que afectan a toda la plataforma.
        </p>

        {settings === null ? (
          <div className="flex items-center gap-2 py-6">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            <span className="text-body text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <div className="max-w-md space-y-5 rounded-lg border p-4">
            <div>
              <Label htmlFor="platform-name" className="mb-2 block">
                Nombre de la plataforma
              </Label>
              <Input
                id="platform-name"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="allow-registrations">Permitir registro de organizaciones</Label>
                <p className="text-caption text-muted-foreground">
                  Si se desactiva, nadie puede crear una organización nueva.
                </p>
              </div>
              <Switch
                id="allow-registrations"
                checked={allowNewRegistrations}
                onCheckedChange={setAllowNewRegistrations}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="maintenance-mode">Modo mantenimiento</Label>
                <p className="text-caption text-muted-foreground">
                  Bloquea el acceso a todos los usuarios excepto Super Admin.
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </div>
    </SuperAdminGuard>
  );
}
