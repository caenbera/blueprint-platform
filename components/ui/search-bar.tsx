"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Componente oficial #24 (Prompt 5): busqueda instantanea reutilizable en
 * toda la plataforma (Navigator, Knowledge Base, Documents Center,
 * Marketplace). Filtros e historial reciente se componen aparte segun el
 * contexto de cada modulo.
 */
export function SearchBar({
  value,
  onValueChange,
  placeholder = "Buscar...",
  className,
  autoFocus,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pr-8 pl-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Limpiar búsqueda"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
