import "server-only";
import OpenAI from "openai";
import type {
  AiChatMessage,
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiToolCall,
} from "@/lib/ai/types";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.1";

function toOpenAiMessages(
  systemPrompt: string,
  messages: AiChatMessage[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map(
      (m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam,
    ),
  ];
}

export const openaiProvider: AiProvider = {
  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    // Cliente construido bajo demanda - ver comentario en providers/anthropic.ts.
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      messages: toOpenAiMessages(params.systemPrompt, params.messages),
      tools: params.tools.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
    });

    const message = response.choices[0]?.message;
    const toolCalls: AiToolCall[] = [];
    for (const call of message?.tool_calls ?? []) {
      if (call.type !== "function") continue;
      toolCalls.push({
        name: call.function.name,
        input: JSON.parse(call.function.arguments || "{}"),
      });
    }

    return { text: message?.content ?? "", toolCalls };
  },
};
