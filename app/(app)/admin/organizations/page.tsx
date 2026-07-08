import { OrganizationDirectory } from "@/components/features/admin/organization-directory";
import { SuperAdminGuard } from "@/components/features/admin/super-admin-guard";

export default function AdminOrganizationsPage() {
  return (
    <SuperAdminGuard>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h1 className="text-h3 mb-1">Organizaciones</h1>
        <p className="text-body text-muted-foreground mb-4">
          Administra todas las organizaciones registradas en la plataforma.
        </p>
        <OrganizationDirectory />
      </div>
    </SuperAdminGuard>
  );
}
