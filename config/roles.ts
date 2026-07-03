import type { Role } from "@/types/domain";

/**
 * Catalogo de roles y permisos (Prompt 1, secciones 5-6). Los permisos
 * nunca se hardcodean por rol en la logica de negocio: siempre se
 * consultan a traves de hasPermission().
 */

export type Permission =
  "read" | "write" | "update" | "delete" | "approve" | "publish" | "export" | "share";

export const ROLES: Role[] = [
  "owner",
  "administrator",
  "manager",
  "editor",
  "collaborator",
  "viewer",
];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  administrator: "Administrador",
  manager: "Manager",
  editor: "Editor",
  collaborator: "Colaborador",
  viewer: "Lector",
};

const ALL_PERMISSIONS: Permission[] = [
  "read",
  "write",
  "update",
  "delete",
  "approve",
  "publish",
  "export",
  "share",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL_PERMISSIONS,
  administrator: ALL_PERMISSIONS,
  manager: ["read", "write", "update", "approve", "publish", "export", "share"],
  editor: ["read", "write", "update", "export", "share"],
  collaborator: ["read", "write", "share"],
  viewer: ["read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Roles con capacidad de aprobar/denegar una solicitud de acceso de soporte del Super Admin. */
export const SUPPORT_ACCESS_APPROVER_ROLES: Role[] = ["owner", "administrator"];
