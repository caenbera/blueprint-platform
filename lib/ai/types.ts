import "server-only";

/**
 * Contrato neutral del AI Engine (Sprint 8): la API route habla contra estas
 * formas, nunca contra el SDK de un proveedor especifico. Cada adaptador en
 * lib/ai/providers/ traduce este contrato al formato propio de su SDK y
 * normaliza la respuesta de vuelta - asi cambiar de proveedor (Anthropic /
 * OpenAI / Google) es solo una variable de entorno, sin tocar la ruta.
 */

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** JSON Schema estandar (subset) - suficiente para las 2 herramientas del Action Engine. */
export interface AiToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AiToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface AiCompletionResult {
  text: string;
  toolCalls: AiToolCall[];
}

export interface AiCompletionParams {
  systemPrompt: string;
  messages: AiChatMessage[];
  tools: AiToolDefinition[];
}

export interface AiProvider {
  complete(params: AiCompletionParams): Promise<AiCompletionResult>;
}
