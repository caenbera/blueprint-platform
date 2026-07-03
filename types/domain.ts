/**
 * Contratos de dominio compartidos entre services/, hooks/ y componentes.
 * Ver docs/blueprint-master-spec.md para el modelo completo.
 */

export type Role = "owner" | "administrator" | "manager" | "editor" | "collaborator" | "viewer";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Membership {
  uid: string;
  orgId: string;
  role: Role;
  displayName: string;
  email: string;
  joinedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
}

export type SupportAccessStatus = "pending" | "approved" | "denied" | "revoked";

export interface SupportAccessGrant {
  superAdminUid: string;
  orgId: string;
  status: SupportAccessStatus;
  requestedAt: string;
  respondedAt: string | null;
  respondedBy: string | null;
}
