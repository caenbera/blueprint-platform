import "server-only";
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
 * Multi-proveedor de IA (Sprint 8, a pedido explicito del usuario): el
 * proveedor activo se elige por variable de entorno (AI_PROVIDER), sin
 * tocar la ruta de la API. Agregar un cuarto proveedor es agregar un
 * archivo mas en lib/ai/providers/ y una entrada aqui.
 */
export function getAiProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER || "anthropic") as ProviderName;
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(
      `AI_PROVIDER desconocido: "${name}". Valores validos: anthropic, openai, google.`,
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
