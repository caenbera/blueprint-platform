"use client";

import { useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadCardFile } from "@/services/storage";
import type { CardRef } from "@/lib/firestore-hierarchy";
import type { FileContent as FileContentType } from "@/types/domain";

function normalize(content: unknown): FileContentType | null {
  if (content && typeof content === "object" && "url" in content) {
    return content as FileContentType;
  }
  return null;
}

/** Compartido por los tipos "archivo" e "imagen" (Firebase Storage). */
export function FileContentEditor({
  type,
  cardRef,
  content,
  onChange,
}: {
  type: "archivo" | "imagen";
  cardRef: CardRef;
  content: unknown;
  onChange: (content: FileContentType) => void;
}) {
  const file = normalize(content);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(selected: File | undefined) {
    if (!selected) return;
    setUploading(true);
    const uploaded = await uploadCardFile(cardRef, selected);
    onChange(uploaded);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {type === "imagen" && file && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.url}
          alt={file.fileName}
          className="max-h-64 rounded-md border object-contain"
        />
      )}
      {type === "archivo" && file && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body text-primary flex items-center gap-2 hover:underline"
        >
          <Download className="h-4 w-4" />
          {file.fileName} ({(file.sizeBytes / 1024).toFixed(0)} KB)
        </a>
      )}

      <label className="w-fit">
        <input
          type="file"
          className="hidden"
          accept={type === "imagen" ? "image/*" : undefined}
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
        <Button variant="outline" size="sm" disabled={uploading} type="button" asChild>
          <span>
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {file ? "Reemplazar archivo" : "Subir archivo"}
          </span>
        </Button>
      </label>
    </div>
  );
}
