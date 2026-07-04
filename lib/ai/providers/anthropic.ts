import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type {
  AiChatMessage,
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiToolCall,
} from "@/lib/ai/types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

function toAnthropicMessages(messages: AiChatMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export const anthropicProvider: AiProvider = {
  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    // Cliente construido bajo demanda (no al importar el modulo): los 3
    // adaptadores se importan siempre en lib/ai/index.ts, y el SDK de cada
    // proveedor lanza un error de inmediato si a su constructor le falta la
    // API key - eso rompería a los otros 2 proveedores aunque no esten activos.
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: params.systemPrompt,
      messages: toAnthropicMessages(params.messages),
      tools: params.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
    });

    let text = "";
    const toolCalls: AiToolCall[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({ name: block.name, input: block.input as Record<string, unknown> });
      }
    }

    return { text, toolCalls };
  },
};
