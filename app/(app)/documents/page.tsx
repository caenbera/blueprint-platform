"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTab } from "@/components/features/documents/documents-tab";
import { ExportsTab } from "@/components/features/documents/exports-tab";
import { TemplatesTab } from "@/components/features/documents/templates-tab";
import { useAuth } from "@/hooks/use-auth";

/** Documents Center (Prompt 4.6): un solo modulo con 3 pestañas (Templates/Documents/Exports). */
export default function DocumentsPage() {
  const { membership } = useAuth();
  const [tab, setTab] = useState("templates");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const orgId = membership?.orgId ?? null;

  if (!orgId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col gap-0 overflow-hidden">
      <TabsList className="mx-4 mt-3 w-fit">
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="exports">Exports</TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="flex-1 overflow-y-auto">
        <TemplatesTab
          orgId={orgId}
          onDocumentCreated={(id) => {
            setSelectedDocumentId(id);
            setTab("documents");
          }}
        />
      </TabsContent>

      <TabsContent value="documents" className="flex flex-1 overflow-hidden">
        <DocumentsTab
          orgId={orgId}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
        />
      </TabsContent>

      <TabsContent value="exports" className="flex-1 overflow-y-auto">
        <ExportsTab orgId={orgId} />
      </TabsContent>
    </Tabs>
  );
}
