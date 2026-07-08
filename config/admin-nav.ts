import {
  BookOpen,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Store,
  type LucideIcon,
} from "lucide-react";

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
 * bloques desplegables (Sprint 12 - rediseno de layout). Sprint 14: el
 * link a "/workspace" (Card System viejo, retirado en el Sprint 13) se
 * reemplaza por "/projects" (Roadmap -> Fase -> Step, motor de datos nuevo).
 */
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/dashboard", label: "Mission Control", icon: LayoutDashboard },
      { href: "/projects", label: "Mis Proyectos", icon: FolderKanban },
    ],
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
