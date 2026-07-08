import { Building2, LayoutDashboard, ShieldAlert, Users } from "lucide-react";
import { ADMIN_NAV_GROUPS, type NavGroup } from "@/config/admin-nav";

/**
 * Sidebar del rol Super Admin, por bloques desplegables (Sprint 12).
 * Sprint 16: el bloque "Plataforma" pasa de un unico link a las 4
 * secciones reales del Panel de Super Admin. Incluye ademas un bloque
 * "Vista de Administrador" con las mismas rutas que ve un Administrador
 * normal (el Super Admin tiene su propia organizacion/membership igual
 * que cualquier usuario, asi que esas rutas ya funcionan tal cual sin
 * necesitar paginas nuevas) - le permite ver como se visualizan esas
 * pantallas sin salir de su propio sidebar.
 */
export const SUPER_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Plataforma",
    items: [
      { href: "/admin", label: "Dashboard General", icon: LayoutDashboard },
      { href: "/admin/organizations", label: "Organizaciones", icon: Building2 },
      { href: "/admin/users", label: "Usuarios", icon: Users },
      { href: "/admin/audit", label: "Auditoría", icon: ShieldAlert },
    ],
  },
  {
    label: "Vista de Administrador",
    items: ADMIN_NAV_GROUPS.flatMap((group) => group.items),
  },
];
