"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CARD_TYPES, CARD_TYPE_CATEGORIES } from "@/config/card-types";
import type { CardType } from "@/types/domain";

/** Selector de tipo al crear una Card (Card System, Sprint 5). */
export function CreateCardMenu({ onSelect }: { onSelect: (type: CardType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nueva Card
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
        {CARD_TYPE_CATEGORIES.map((category, index) => (
          <div key={category}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{category}</DropdownMenuLabel>
            {CARD_TYPES.filter((c) => c.category === category).map((cardType) => (
              <DropdownMenuItem key={cardType.type} onClick={() => onSelect(cardType.type)}>
                <cardType.icon />
                {cardType.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
