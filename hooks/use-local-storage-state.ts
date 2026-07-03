"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Sincroniza un estado de React con localStorage. Usado por el Navigator
 * para persistir nodos expandidos, workspace activo y busqueda -
 * sobrevive a cerrar sesion/recargar en el mismo navegador (Prompt 6,
 * "persistencia de estado"). Sincronizacion entre dispositivos vía
 * Firestore queda fuera de alcance por ahora (ver plan del Sprint 3).
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Sincronizacion deliberada con un sistema externo (localStorage) al
    // montar - patron estandar de hidratacion (SSR no tiene acceso a
    // window, por eso no puede leerse en el render inicial).
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setState(JSON.parse(raw) as T);
    } catch {
      // localStorage no disponible o valor corrupto: se mantiene el default.
    }
    setHydrated(true);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        if (hydrated) {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // almacenamiento lleno o no disponible: se ignora, no es critico.
          }
        }
        return next;
      });
    },
    [key, hydrated],
  );

  return [state, setValue];
}
