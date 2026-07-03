"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved";

/**
 * Guarda `value` automaticamente 800ms despues del ultimo cambio (Prompt 2
 * "Feedback": confirmacion discreta, nunca bloquear la edicion). No
 * dispara guardado en el render inicial, solo ante cambios reales.
 */
export function useAutosave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delayMs = 800,
): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const isFirstRender = useRef(true);
  const onSaveRef = useRef(onSave);

  // Mantiene la referencia a la ultima version de onSave sin volver a
  // disparar el efecto de guardado (que solo debe depender de `value`).
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const saveTimeout = setTimeout(() => {
      setStatus("saving");
      onSaveRef.current(value).then(() => {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      });
    }, delayMs);

    return () => clearTimeout(saveTimeout);
  }, [value, delayMs]);

  return status;
}
