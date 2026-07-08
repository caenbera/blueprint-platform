"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { updateProfile } from "firebase/auth";
import { Loader2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { getOrganization, updateOrganization } from "@/services/organizations";
import type { Organization } from "@/types/domain";

/**
 * Configuración (mockup "15-configuracion.png", simplificado): solo
 * campos reales que ya podemos guardar en Firestore/Firebase Auth.
 * Plan/Almacenamiento/Créditos de IA/Integraciones se dejan para el
 * Sprint 18 (IA-Configuración / Suscripciones y pagos) para no inventar
 * datos que todavía no existen.
 */
export default function SettingsPage() {
  const { membership, user, refreshMembership } = useAuth();
  const orgId = membership?.orgId ?? null;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Patron estandar de next-themes para evitar mismatch de hidratacion SSR/cliente.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!orgId) return;
    getOrganization(orgId).then((o) => {
      setOrg(o);
      if (o) {
        setOrgName(o.name);
        setWebsite(o.website ?? "");
        setIndustry(o.industry ?? "");
      }
    });
  }, [orgId]);

  useEffect(() => {
    // Sincroniza el input con el nombre real una vez que useAuth() termina de cargarlo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(user?.displayName ?? "");
  }, [user?.displayName]);

  async function handleSaveOrg() {
    if (!orgId || !orgName.trim()) return;
    setSavingOrg(true);
    try {
      await updateOrganization(orgId, { name: orgName.trim(), website, industry });
      await refreshMembership();
      toast.success("Datos de la empresa actualizados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSavingOrg(false);
    }
  }

  async function handleSaveProfile() {
    if (!auth.currentUser || !displayName.trim()) return;
    setSavingProfile(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      toast.success("Perfil actualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (!orgId || org === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <h1 className="text-h3 mb-4">Configuración</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <p className="text-h4">Empresa</p>
          <p className="text-body text-muted-foreground mb-3">
            Gestiona la información de tu empresa.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="orgName">Nombre de la empresa</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website">Sitio web</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.tuempresa.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industria</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Comercio, Tecnología, Salud..."
              />
            </div>
            <Button
              onClick={handleSaveOrg}
              disabled={!orgName.trim() || savingOrg}
              className="self-start"
            >
              {savingOrg && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-h4">Perfil</p>
          <p className="text-body text-muted-foreground mb-3">
            Administra tu información personal.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Nombre completo</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Correo electrónico</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={!displayName.trim() || savingProfile}
              className="self-start"
            >
              {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-5 lg:col-span-2">
          <p className="text-h4">Preferencias</p>
          <p className="text-body text-muted-foreground mb-3">
            Ajusta tu experiencia en Blueprint.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body font-medium">Tema</p>
              <p className="text-small text-muted-foreground">Elige entre modo claro u oscuro.</p>
            </div>
            {mounted && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-3.5 w-3.5" /> Claro
                </Button>
                <Button
                  size="sm"
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-3.5 w-3.5" /> Oscuro
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
