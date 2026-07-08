import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { AiProvider } from "@/lib/ai/types";
import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import { openaiProvider } from "@/lib/ai/providers/openai";
import { googleProvider } from "@/lib/ai/providers/google";

type ProviderName = "anthropic" | "openai" | "google";

const PROVIDERS: Record<ProviderName, AiProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  google: googleProvider,
};

const API_KEY_ENV: Record<ProviderName, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_AI_API_KEY",
};

/**
 * Resuelve el nombre del proveedor activo: primero
 * `platformConfig/aiSettings` (IA-Configuración, Sprint 18, editable desde
 * el Panel de Super Admin sin redeploy), y si ese documento no existe
 * (deploys que todavia no lo configuraron desde la UI) o la lectura falla
 * por cualquier motivo, cae de vuelta a la variable de entorno
 * `AI_PROVIDER` (comportamiento original, Sprint 8).
 */
async function resolveProviderName(): Promise<ProviderName> {
  try {
    const snap = await adminDb.doc("platformConfig/aiSettings").get();
    const provider = snap.data()?.provider as ProviderName | undefined;
    if (provider && provider in PROVIDERS) return provider;
  } catch {
    // Cae al respaldo de la env var.
  }
  return (process.env.AI_PROVIDER || "anthropic") as ProviderName;
}

/**
 * Multi-proveedor de IA (Sprint 8, a pedido explicito del usuario): el
 * proveedor activo se elige sin tocar la ruta de la API. Agregar un cuarto
 * proveedor es agregar un archivo mas en lib/ai/providers/ y una entrada
 * aqui.
 */
export async function getAiProvider(): Promise<AiProvider> {
  const name = await resolveProviderName();
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(
      `Proveedor de IA desconocido: "${name}". Valores validos: anthropic, openai, google.`,
    );
  }

  const keyEnvVar = API_KEY_ENV[name];
  if (!process.env[keyEnvVar]) {
    throw new Error(
      `Falta la variable de entorno ${keyEnvVar} para el proveedor de IA activo ("${name}").`,
    );
  }

  return provider;
}
