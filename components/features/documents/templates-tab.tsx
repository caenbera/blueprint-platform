"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_TEMPLATES } from "@/config/document-templates";
import { createDocument } from "@/services/documents";

/** Grid de las 11 plantillas oficiales (Prompt 4.6). Elegir una crea el documento y abre el constructor. */
export function TemplatesTab({
  orgId,
  onDocumentCreated,
}: {
  orgId: string;
  onDocumentCreated: (documentId: string) => void;
}) {
  async function handleSelect(
    templateLabel: string,
    templateType: (typeof DOCUMENT_TEMPLATES)[number]["type"],
  ) {
    const id = await createDocument(orgId, templateLabel, templateType);
    onDocumentCreated(id);
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {DOCUMENT_TEMPLATES.map((template) => (
        <Card
          key={template.type}
          className="hover:border-primary/40 cursor-pointer transition-colors"
          onClick={() => handleSelect(template.label, template.type)}
        >
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
            <CardTitle className="text-h4">{template.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-muted-foreground">{template.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
