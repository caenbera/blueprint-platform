"use client";

import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDERS: Record<string, string> = {
  informacion: "Escribe la información aquí...",
  objetivo: "¿Qué pretende resolver esta Card?",
  pregunta: "Escribe la pregunta...",
  respuesta: "Escribe la respuesta...",
  documento: "Escribe el contenido del documento...",
  resumen: "Escribe el resumen...",
  proceso: "Describe el proceso paso a paso...",
  plantilla: "Escribe el contenido reutilizable de la plantilla...",
};

export function TextContent({
  type,
  content,
  onChange,
}: {
  type: string;
  content: unknown;
  onChange: (content: string) => void;
}) {
  const value = typeof content === "string" ? content : "";

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={PLACEHOLDERS[type] ?? "Escribe el contenido aquí..."}
      className="min-h-24"
    />
  );
}
