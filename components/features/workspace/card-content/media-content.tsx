"use client";

import { Input } from "@/components/ui/input";
import type { MediaContent as MediaContentType } from "@/types/domain";

function normalize(content: unknown): MediaContentType {
  if (content && typeof content === "object" && "url" in content) {
    return content as MediaContentType;
  }
  return { url: "" };
}

/** Compartido por los tipos "video" y "audio": URL externa embebida, sin subida (ver plan Sprint 5). */
export function MediaContentEditor({
  type,
  content,
  onChange,
}: {
  type: "video" | "audio";
  content: unknown;
  onChange: (content: MediaContentType) => void;
}) {
  const media = normalize(content);

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={media.url}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="URL del video o audio (YouTube, MP4, MP3...)"
      />
      {media.url && type === "video" && (
        <video src={media.url} controls className="max-h-64 w-full rounded-md border" />
      )}
      {media.url && type === "audio" && <audio src={media.url} controls className="w-full" />}
    </div>
  );
}
