import { describe, expect, it, vi } from "vitest";

/**
 * Simula una transaccion real de Firestore con un Map en memoria - cada
 * `it()` usa un uid distinto para no compartir estado entre pruebas.
 */
const store = new Map<string, { windowStart: number; count: number }>();

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn((id: string) => ({ id })),
    })),
    runTransaction: vi.fn(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        get: async (ref: { id: string }) => ({ data: () => store.get(ref.id) }),
        set: (ref: { id: string }, data: { windowStart: number; count: number }) =>
          store.set(ref.id, data),
        update: (ref: { id: string }, data: { count: number }) => {
          const current = store.get(ref.id);
          if (current) store.set(ref.id, { ...current, ...data });
        },
      };
      return fn(tx);
    }),
  },
}));

import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("permite la primera solicitud de un usuario", async () => {
    const result = await checkRateLimit("user-1", {
      key: "chat",
      maxRequests: 2,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
  });

  it("permite solicitudes dentro del limite y las cuenta", async () => {
    const config = { key: "chat", maxRequests: 3, windowMs: 60_000 };
    await checkRateLimit("user-2", config);
    await checkRateLimit("user-2", config);
    const third = await checkRateLimit("user-2", config);
    expect(third.allowed).toBe(true);
  });

  it("bloquea al superar el maximo dentro de la misma ventana", async () => {
    const config = { key: "chat", maxRequests: 2, windowMs: 60_000 };
    await checkRateLimit("user-3", config);
    await checkRateLimit("user-3", config);
    const third = await checkRateLimit("user-3", config);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("reinicia el contador cuando la ventana ya expiro", async () => {
    const config = { key: "chat", maxRequests: 1, windowMs: 10 };
    await checkRateLimit("user-4", config);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const afterWindow = await checkRateLimit("user-4", config);
    expect(afterWindow.allowed).toBe(true);
  });
});
