"use client";

import { useEffect, useState } from "react";
import { Loader2, PanelRightClose, PanelRightOpen, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ASSISTANT_MODES, getAssistantModeConfig } from "@/config/assistant-modes";
import { listMessages, sendMessage } from "@/services/assistant";
import { AssistantActionCard } from "@/components/features/workspace/assistant-action-card";
import type { NavigatorSelection } from "@/providers/navigator-provider";
import type { AiMessage, AssistantMode } from "@/types/domain";

/**
 * Blueprint AI Engine (Sprint 8): copiloto contextual real (Anthropic/OpenAI/
 * Google segun AI_PROVIDER), nunca un chatbot generico. Conversacion continua
 * por usuario por organizacion; el contexto (Context/Knowledge Engine) se
 * arma en el servidor a partir de `selection` en cada mensaje.
 */
export function AssistantPanel({
  collapsed,
  onToggleCollapsed,
  orgId,
  selection,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  orgId: string | null;
  selection: NavigatorSelection | null;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<AssistantMode>("consultor");
  const [messages, setMessages] = useState<AiMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Carga inicial de la conversacion continua del usuario.
    if (!orgId || !user) return;
    listMessages(orgId, user.uid).then(setMessages);
  }, [orgId, user]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !orgId || sending) return;

    setSending(true);
    setInput("");
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: `local-${Date.now()}`,
        role: "user",
        content: text,
        createdBy: user?.uid ?? "",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const result = await sendMessage(orgId, text, mode, selection);
      setMessages((prev) => [
        ...(prev ?? []),
        {
          id: `local-${Date.now()}-assistant`,
          role: "assistant",
          content: result.reply,
          mode,
          sources: result.sources,
          proposedActions: result.proposedActions,
          createdBy: user?.uid ?? "",
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...(prev ?? []),
        {
          id: `local-${Date.now()}-error`,
          role: "assistant",
          content: error instanceof Error ? error.message : "El Assistant no pudo responder.",
          createdBy: user?.uid ?? "",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (collapsed) {
    return (
      <div className="flex justify-center border-l p-2">
        <Button variant="ghost" size="icon-sm" onClick={onToggleCollapsed}>
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-accent h-4 w-4" />
          <span className="text-body font-medium">Assistant</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onToggleCollapsed}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border-b p-2">
        {ASSISTANT_MODES.map((m) => (
          <Button
            key={m.value}
            size="sm"
            variant={mode === m.value ? "default" : "ghost"}
            title={m.description}
            onClick={() => setMode(m.value)}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {!orgId && (
          <p className="text-small text-muted-foreground">
            Selecciona una organización para usar el Assistant.
          </p>
        )}
        {orgId && messages === null && (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin self-center" />
        )}
        {orgId && messages?.length === 0 && (
          <p className="text-small text-muted-foreground">
            Pregúntale algo al Assistant sobre tu Workspace o tu Knowledge Base.
          </p>
        )}
        {messages?.map((message) => (
          <div
            key={message.id}
            className={cn("flex flex-col gap-1.5", message.role === "user" && "items-end")}
          >
            <div
              className={cn(
                "text-body max-w-[90%] rounded-lg px-3 py-2",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.content}
            </div>
            {message.role === "assistant" && (message.sources?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {message.sources?.map((s) => (
                  <span
                    key={s.id}
                    className="text-small text-muted-foreground rounded-full border px-2 py-0.5"
                    title={`Fuente: ${s.title}`}
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            )}
            {message.proposedActions?.map((action) => (
              <AssistantActionCard key={action.id} action={action} orgId={orgId ?? ""} />
            ))}
            {message.role === "assistant" && message.mode && (
              <span className="text-small text-muted-foreground">
                {getAssistantModeConfig(message.mode).label}
              </span>
            )}
          </div>
        ))}
        {sending && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin self-center" />}
      </div>

      <div className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe tu pregunta..."
          className="min-h-10"
          disabled={!orgId}
        />
        <Button size="icon-sm" onClick={handleSend} disabled={!orgId || !input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
