import { BookOpen, FileText, LayoutDashboard, Store, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Sidebar del rol Administrador (usuario final de una organizacion), por
 * bloques desplegables (Sprint 12 - rediseno de layout). Sprint 13: se
 * retiro el link a "/workspace" (Card System viejo) - el Sprint 14
 * reconstruye la navegacion sobre Proyecto -> Fase -> Step (Roadmap) y
 * agrega su propio link aqui.
 */
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [{ href: "/dashboard", label: "Mission Control", icon: LayoutDashboard }],
  },
  {
    label: "Contenido",
    items: [
      { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
      { href: "/documents", label: "Documentos", icon: FileText },
      { href: "/marketplace", label: "Marketplace", icon: Store },
    ],
  },
];
