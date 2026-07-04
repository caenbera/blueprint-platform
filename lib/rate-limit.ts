import "server-only";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Rate limiting real para endpoints que llaman a una API de pago (Sprint 11,
 * auditoria de seguridad - prometido desde el Sprint 8/9, nunca construido).
 * Contador de ventana fija por usuario, guardado SOLO con el Admin SDK
 * (`rateLimits/{uid}_{key}`) - el cliente nunca lo toca, asi que no hace
 * falta ninguna regla de Firestore nueva. Una transaccion evita condiciones
 * de carrera si el mismo usuario dispara 2 solicitudes casi simultaneas.
 */

export interface RateLimitConfig {
  /** Identifica el endpoint/uso (ej. "assistant-chat"). */
  key: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Solo presente cuando `allowed` es false. */
  retryAfterMs?: number;
}

export async function checkRateLimit(
  uid: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const ref = adminDb.collection("rateLimits").doc(`${uid}_${config.key}`);
  const now = Date.now();

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { windowStart: number; count: number } | undefined;

    if (!data || now - data.windowStart >= config.windowMs) {
      tx.set(ref, { windowStart: now, count: 1 });
      return { allowed: true };
    }

    if (data.count >= config.maxRequests) {
      return { allowed: false, retryAfterMs: config.windowMs - (now - data.windowStart) };
    }

    tx.update(ref, { count: data.count + 1 });
    return { allowed: true };
  });
}
