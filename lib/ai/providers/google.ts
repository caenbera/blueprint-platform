import "server-only";
import { GoogleGenerativeAI, type FunctionDeclarationSchema } from "@google/generative-ai";
import type {
  AiChatMessage,
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiToolCall,
} from "@/lib/ai/types";

const MODEL = process.env.GOOGLE_AI_MODEL || "gemini-2.5-pro";

/**
 * `AiToolDefinition.inputSchema` ya usa el formato JSON Schema estandar
 * (type: "object"/"string"/...), cuyos valores coinciden 1:1 con los de
 * `SchemaType` de este SDK (es un string enum con los mismos literales) -
 * solo hace falta el cast de tipos, no una conversion real de datos.
 */
function toGoogleMessages(messages: AiChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export const googleProvider: AiProvider = {
  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    // Cliente construido bajo demanda - ver comentario en providers/anthropic.ts.
    const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: params.systemPrompt,
      tools:
        params.tools.length > 0
          ? [
              {
                functionDeclarations: params.tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parameters: t.inputSchema as unknown as FunctionDeclarationSchema,
                })),
              },
            ]
          : undefined,
    });

    const result = await model.generateContent({
      contents: toGoogleMessages(params.messages),
    });

    const toolCalls: AiToolCall[] = (result.response.functionCalls() ?? []).map((call) => ({
      name: call.name,
      input: call.args as Record<string, unknown>,
    }));

    return { text: result.response.text(), toolCalls };
  },
};
