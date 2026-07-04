"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TableContent as TableContentType } from "@/types/domain";

function normalize(content: unknown): TableContentType {
  if (
    content &&
    typeof content === "object" &&
    Array.isArray((content as TableContentType).headers) &&
    Array.isArray((content as TableContentType).rows)
  ) {
    return content as TableContentType;
  }
  return { headers: ["Columna 1", "Columna 2"], rows: [["", ""]] };
}

export function TableContentEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (content: TableContentType) => void;
}) {
  const table = normalize(content);

  function addColumn() {
    onChange({
      headers: [...table.headers, `Columna ${table.headers.length + 1}`],
      rows: table.rows.map((row) => [...row, ""]),
    });
  }

  function addRow() {
    onChange({ ...table, rows: [...table.rows, table.headers.map(() => "")] });
  }

  function removeRow(rowIndex: number) {
    onChange({ ...table, rows: table.rows.filter((_, i) => i !== rowIndex) });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border">
        <table className="text-body w-full">
          <thead>
            <tr className="border-b">
              {table.headers.map((header, colIndex) => (
                <th key={colIndex} className="p-1">
                  <Input
                    value={header}
                    onChange={(e) =>
                      onChange({
                        ...table,
                        headers: table.headers.map((h, i) => (i === colIndex ? e.target.value : h)),
                      })
                    }
                    className="h-7 font-medium"
                  />
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-0">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-1">
                    <Input
                      value={cell}
                      onChange={(e) =>
                        onChange({
                          ...table,
                          rows: table.rows.map((r, i) =>
                            i === rowIndex
                              ? r.map((c, j) => (j === colIndex ? e.target.value : c))
                              : r,
                          ),
                        })
                      }
                      className="h-7"
                    />
                  </td>
                ))}
                <td>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeRow(rowIndex)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" /> Fila
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-3.5 w-3.5" /> Columna
        </Button>
      </div>
    </div>
  );
}
