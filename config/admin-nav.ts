import {
  BookOpen,
  FileText,
  FolderKanban,
  Home,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Vacio = sin encabezado, siempre expandido (ver collapsible-sidebar.tsx). */
  label: string;
  items: NavItem[];
}

/**
 * Sidebar del rol Administrador (usuario final de una organizacion),
 * mockup "02-inicio.png" (Sprint "rediseno pantalla por pantalla"): lista
 * plana sin bloques desplegables - a diferencia del Super Admin (mas
 * secciones, si se benefician de agrupar), aqui son solo 7 items.
 */
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Inicio", icon: Home },
      { href: "/projects", label: "Mis proyectos", icon: FolderKanban },
      { href: "/knowledge", label: "Biblioteca", icon: BookOpen },
      { href: "/documents", label: "Documentos", icon: FileText },
      { href: "/marketplace", label: "Recursos", icon: Package },
      { href: "/team", label: "Equipo", icon: Users },
      { href: "/settings", label: "Configuración", icon: Settings },
    ],
  },
];
