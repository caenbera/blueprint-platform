"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronsUpDown, Layers, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * Sidebar izquierdo (Sprint 12 - rediseno de layout), compartido por el rol
 * Administrador y Super Admin - cada uno le pasa su propio `groups` (ver
 * config/admin-nav.ts y config/super-admin-nav.ts). Un grupo con
 * `label: ""` se renderiza sin encabezado/chevron, siempre expandido
 * (mockup "02-inicio.png": el Administrador tiene solo 7 items, sin
 * bloques desplegables - el Super Admin si los usa, mas secciones).
 */
export function CollapsibleSidebar({
  groups,
  brandSubtitle,
  footerTop,
  userName,
  userRoleLabel,
  onSignOut,
}: {
  groups: NavGroup[];
  brandSubtitle: string;
  /** Contenido extra sobre el chip de usuario (ej. acceso rapido al Asistente IA). */
  footerTop?: ReactNode;
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
          const ungrouped = group.label === "";
          const isCollapsed = !ungrouped && (collapsedGroups[group.label] ?? false);
          const items = (
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
          );

          if (ungrouped) {
            return <div key="ungrouped">{items}</div>;
          }

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
              {!isCollapsed && items}
            </div>
          );
        })}
      </nav>

      <div className="border-t px-3 py-3">
        {footerTop && <div className="mb-3">{footerTop}</div>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hover:bg-muted flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-left"
            >
              <div className="bg-primary/10 text-primary text-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold">
                {initials(userName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body truncate leading-tight font-medium">{userName}</p>
                <p className="text-caption text-muted-foreground leading-tight">{userRoleLabel}</p>
              </div>
              <ChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="h-4 w-4" /> Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
