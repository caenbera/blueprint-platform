import {
  BookOpen,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Store,
  Users,
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
 * Sprint 15: se agrega el grupo "Equipo y Configuración".
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
  {
    label: "Equipo y Configuración",
    items: [
      { href: "/team", label: "Equipo", icon: Users },
      { href: "/settings", label: "Configuración", icon: Settings },
    ],
  },
];
