"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TimelineContent as TimelineContentType, TimelineEntry } from "@/types/domain";

function normalize(content: unknown): TimelineContentType {
  return Array.isArray(content) ? (content as TimelineEntry[]) : [];
}

export function TimelineContentEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (content: TimelineContentType) => void;
}) {
  const entries = normalize(content);

  function addEntry() {
    onChange([...entries, { id: crypto.randomUUID(), date: "", title: "", description: "" }]);
  }

  function updateEntry(index: number, patch: Partial<TimelineEntry>) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, index) => (
        <div key={entry.id} className="flex gap-2 rounded-md border p-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                type="date"
                value={entry.date}
                onChange={(e) => updateEntry(index, { date: e.target.value })}
                className="h-7 w-40"
              />
              <Input
                value={entry.title}
                onChange={(e) => updateEntry(index, { title: e.target.value })}
                placeholder="Título del evento"
                className="h-7 font-medium"
              />
            </div>
            <Input
              value={entry.description}
              onChange={(e) => updateEntry(index, { description: e.target.value })}
              placeholder="Descripción"
              className="h-7"
            />
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(entries.filter((_, i) => i !== index))}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="self-start">
        <Plus className="h-3.5 w-3.5" /> Agregar evento
      </Button>
    </div>
  );
}
