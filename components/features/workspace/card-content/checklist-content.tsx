"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ChecklistContent as ChecklistContentType, ChecklistItem } from "@/types/domain";

function normalize(content: unknown): ChecklistContentType {
  return Array.isArray(content) ? (content as ChecklistItem[]) : [];
}

export function ChecklistContent({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (content: ChecklistContentType) => void;
}) {
  const items = normalize(content);
  const [newText, setNewText] = useState("");

  function addItem() {
    if (!newText.trim()) return;
    onChange([...items, { id: crypto.randomUUID(), text: newText.trim(), done: false }]);
    setNewText("");
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.done}
            onCheckedChange={(checked) =>
              onChange(items.map((it, i) => (i === index ? { ...it, done: checked === true } : it)))
            }
          />
          <Input
            value={item.text}
            onChange={(e) =>
              onChange(items.map((it, i) => (i === index ? { ...it, text: e.target.value } : it)))
            }
            className={item.done ? "text-muted-foreground line-through" : ""}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Nuevo ítem..."
          onKeyDown={(e) => {
            if (e.key === "Enter") addItem();
          }}
        />
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Agregar
        </Button>
      </div>
    </div>
  );
}
