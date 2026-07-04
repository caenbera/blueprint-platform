"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormContent as FormContentType, FormField } from "@/types/domain";

function normalize(content: unknown): FormContentType {
  return Array.isArray(content) ? (content as FormField[]) : [];
}

/**
 * Formulario simple de pares pregunta/respuesta - no es un form-builder
 * completo con tipos de campo (select, fecha, etc.), suficiente para
 * capturar informacion estructurada por ahora (ver plan Sprint 5).
 */
export function FormContentEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (content: FormContentType) => void;
}) {
  const fields = normalize(content);

  function addField() {
    onChange([...fields, { id: crypto.randomUUID(), label: "", answer: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-1 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Input
              value={field.label}
              onChange={(e) =>
                onChange(fields.map((f, i) => (i === index ? { ...f, label: e.target.value } : f)))
              }
              placeholder="Pregunta"
              className="h-7 font-medium"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(fields.filter((_, i) => i !== index))}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input
            value={field.answer}
            onChange={(e) =>
              onChange(fields.map((f, i) => (i === index ? { ...f, answer: e.target.value } : f)))
            }
            placeholder="Respuesta"
            className="h-7"
          />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addField} className="self-start">
        <Plus className="h-3.5 w-3.5" /> Agregar pregunta
      </Button>
    </div>
  );
}
