"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/config/admin-nav";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Sidebar izquierdo por bloques desplegables (Sprint 12 - rediseno de
 * layout), compartido por el rol Administrador y Super Admin - cada uno le
 * pasa su propio `groups` (ver config/admin-nav.ts y
 * config/super-admin-nav.ts). Reemplaza el <nav> horizontal anterior.
 */
export function CollapsibleSidebar({
  groups,
  brandSubtitle,
  userName,
  userRoleLabel,
  onSignOut,
}: {
  groups: NavGroup[];
  brandSubtitle: string;
  userName: string;
  userRoleLabel: string;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.label, true])),
  );

  // "Mas especifico gana": entre rutas anidadas (ej. "/admin" y
  // "/admin/organizations"), solo la de href mas largo que matchea se
  // resalta como activa - evita que ambas se vean resaltadas a la vez.
  const allHrefs = groups.flatMap((g) => g.items.map((item) => item.href));
  const activeHref = allHrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="bg-sidebar flex h-full w-64 shrink-0 flex-col border-r">
      <div className="flex items-center gap-2 px-4 py-4">
        <Layers className="text-primary h-6 w-6 shrink-0" strokeWidth={2.5} />
        <div className="min-w-0">
          <p className="text-body leading-none font-bold tracking-wide">BLUEPRINT</p>
          <p className="text-caption text-muted-foreground mt-1 truncate">{brandSubtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups[group.label] ?? false;
          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="text-caption text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-2 py-1 font-semibold tracking-wider uppercase"
              >
                {group.label}
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", isCollapsed && "-rotate-90")}
                />
              </button>
              {!isCollapsed && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === activeHref;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "text-body flex items-center gap-2.5 rounded-md px-2.5 py-1.5",
                          active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="bg-primary/10 text-primary text-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold">
            {initials(userName)}
          </div>
          <div className="min-w-0">
            <p className="text-body truncate leading-tight font-medium">{userName}</p>
            <p className="text-caption text-muted-foreground leading-tight">{userRoleLabel}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={onSignOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
