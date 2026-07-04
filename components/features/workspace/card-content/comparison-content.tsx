"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ComparisonContent as ComparisonContentType, ComparisonRow } from "@/types/domain";

function normalize(content: unknown): ComparisonContentType {
  if (content && typeof content === "object" && "rows" in content) {
    return content as ComparisonContentType;
  }
  return { labelA: "Opción A", labelB: "Opción B", rows: [] };
}

export function ComparisonContentEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (content: ComparisonContentType) => void;
}) {
  const comparison = normalize(content);

  function updateRow(index: number, patch: Partial<ComparisonRow>) {
    onChange({
      ...comparison,
      rows: comparison.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  }

  function addRow() {
    onChange({
      ...comparison,
      rows: [...comparison.rows, { id: crypto.randomUUID(), aspect: "", optionA: "", optionB: "" }],
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
        <span className="text-caption text-muted-foreground">Aspecto</span>
        <Input
          value={comparison.labelA}
          onChange={(e) => onChange({ ...comparison, labelA: e.target.value })}
          className="h-7 font-medium"
        />
        <Input
          value={comparison.labelB}
          onChange={(e) => onChange({ ...comparison, labelB: e.target.value })}
          className="h-7 font-medium"
        />
        <span />

        {comparison.rows.map((row, index) => (
          <div key={row.id} className="col-span-4 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            <Input
              value={row.aspect}
              onChange={(e) => updateRow(index, { aspect: e.target.value })}
              placeholder="Aspecto"
              className="h-7"
            />
            <Input
              value={row.optionA}
              onChange={(e) => updateRow(index, { optionA: e.target.value })}
              className="h-7"
            />
            <Input
              value={row.optionB}
              onChange={(e) => updateRow(index, { optionB: e.target.value })}
              className="h-7"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                onChange({ ...comparison, rows: comparison.rows.filter((_, i) => i !== index) })
              }
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addRow} className="self-start">
        <Plus className="h-3.5 w-3.5" /> Agregar fila
      </Button>
    </div>
  );
}
