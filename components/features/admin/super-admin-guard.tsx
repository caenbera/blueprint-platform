"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/** Guard client-side compartido por las paginas de Super Admin (Sprint 16), mismo patron que app/(app)/layout.tsx. */
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, isSuperAdmin, router]);

  if (loading || !isSuperAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
