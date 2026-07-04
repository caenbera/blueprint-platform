"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WidgetShell,
  type WidgetControlProps,
} from "@/components/features/mission-control/widget-shell";
import { getMissionControlWidgetConfig } from "@/config/mission-control-widgets";
import { useAuth } from "@/hooks/use-auth";
import { useNavigator } from "@/hooks/use-navigator";
import { listRecentActivity } from "@/services/activity";
import type { ActivityLogEntry } from "@/types/domain";

export function ContinueWorkingWidget({
  orgId,
  ...controls
}: { orgId: string } & WidgetControlProps) {
  const config = getMissionControlWidgetConfig("continueWorking");
  const { user } = useAuth();
  const { setActiveProject, setActiveBlueprint, setSelection } = useNavigator();
  const router = useRouter();
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);

  useEffect(() => {
    listRecentActivity(orgId, 50).then((all) => {
      setEntries(all.filter((e) => e.actorUid === user?.uid).slice(0, 5));
    });
  }, [orgId, user?.uid]);

  function handleContinue(entry: ActivityLogEntry) {
    const ref = entry.workspaceRef;
    if (!ref) return;
    setActiveProject(ref.projectId, null);
    setActiveBlueprint(ref.blueprintId, null);
    setSelection({
      projectId: ref.projectId,
      blueprintId: ref.blueprintId,
      phaseId: ref.phaseId,
      moduleId: ref.moduleId,
      chapterId: ref.chapterId,
      workspaceId: ref.workspaceId,
    });
    router.push("/workspace");
  }

  return (
    <WidgetShell label={config.label} icon={config.icon} {...controls}>
      {entries === null && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
      {entries?.length === 0 && (
        <p className="text-small text-muted-foreground">Aún no tienes actividad reciente.</p>
      )}
      <div className="flex flex-col gap-2">
        {entries?.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-2">
            <span className="text-small truncate">{entry.summary}</span>
            {entry.workspaceRef && (
              <Button size="sm" variant="ghost" onClick={() => handleContinue(entry)}>
                Continuar
              </Button>
            )}
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
