import {
  BookOpen,
  FileText,
  FolderKanban,
  Home,
  Map,
  Package,
  Settings,
  TrendingUp,
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

/**
 * Sidebar del Administrador CON un Proyecto activo (Roadmap del Proyecto,
 * mockup "06-roadmap.png"): "Mis proyectos" se reemplaza por "Roadmap"
 * (apunta al proyecto activo) y se agrega "Mi progreso" - el resto de
 * items no cambia. Se activa solo cuando el usuario esta dentro de un
 * Proyecto (ver NavigatorProvider#activeProjectId).
 */
export function getAdminNavGroups(activeProjectId: string | null): NavGroup[] {
  if (!activeProjectId) return ADMIN_NAV_GROUPS;
  return [
    {
      label: "",
      items: [
        { href: "/dashboard", label: "Inicio", icon: Home },
        { href: `/projects/${activeProjectId}`, label: "Roadmap", icon: Map },
        {
          href: `/projects/${activeProjectId}/progress`,
          label: "Mi progreso",
          icon: TrendingUp,
        },
        { href: "/knowledge", label: "Biblioteca", icon: BookOpen },
        { href: "/documents", label: "Documentos", icon: FileText },
        { href: "/marketplace", label: "Recursos", icon: Package },
        { href: "/team", label: "Equipo", icon: Users },
        { href: "/settings", label: "Configuración", icon: Settings },
      ],
    },
  ];
}
