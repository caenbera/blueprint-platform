"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { KpiContent as KpiContentType } from "@/types/domain";

function normalize(content: unknown): KpiContentType {
  if (content && typeof content === "object" && "value" in content) {
    return content as KpiContentType;
  }
  return { value: "", target: "", unit: "", trend: "flat" };
}

const TREND_OPTIONS: { value: KpiContentType["trend"]; icon: typeof TrendingUp; label: string }[] =
  [
    { value: "up", icon: TrendingUp, label: "Al alza" },
    { value: "flat", icon: Minus, label: "Estable" },
    { value: "down", icon: TrendingDown, label: "A la baja" },
  ];

export function KpiContentEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (content: KpiContentType) => void;
}) {
  const kpi = normalize(content);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-caption">Valor</Label>
          <Input
            value={kpi.value}
            onChange={(e) => onChange({ ...kpi, value: e.target.value })}
            placeholder="24,750"
            className="text-h3 h-auto w-32"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-caption">Unidad</Label>
          <Input
            value={kpi.unit}
            onChange={(e) => onChange({ ...kpi, unit: e.target.value })}
            placeholder="$, %, clientes..."
            className="h-8 w-32"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-caption">Meta (opcional)</Label>
        <Input
          value={kpi.target}
          onChange={(e) => onChange({ ...kpi, target: e.target.value })}
          placeholder="Meta a alcanzar"
          className="h-8 max-w-52"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {TREND_OPTIONS.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            className={cn(kpi.trend === value && "border-primary text-primary")}
            onClick={() => onChange({ ...kpi, trend: value })}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
