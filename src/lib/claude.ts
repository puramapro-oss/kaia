import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export type ClaudeModel = "main" | "fast" | "pro";

const MODEL_MAP: Record<ClaudeModel, string> = {
  main: process.env.ANTHROPIC_MODEL_MAIN ?? "claude-sonnet-4-6",
  fast: process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001",
  pro: process.env.ANTHROPIC_MODEL_PRO ?? "claude-opus-4-7",
};

export interface AskClaudeOptions {
  model?: ClaudeModel;
  maxTokens?: number;
  systemPrompt?: string;
  temperature?: number;
}

export async function askClaude(
  userMessage: string,
  options: AskClaudeOptions = {}
): Promise<string> {
  const { model = "main", maxTokens = 4096, systemPrompt, temperature = 0.7 } = options;

  const response = await client.messages.create({
    model: MODEL_MAP[model],
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return text;
}

export async function streamClaude(
  userMessage: string,
  options: AskClaudeOptions = {}
): Promise<AsyncIterable<string>> {
  const { model = "main", maxTokens = 4096, systemPrompt, temperature = 0.7 } = options;

  const stream = await client.messages.stream({
    model: MODEL_MAP[model],
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return (async function* () {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  })();
}

export async function askClaudeJSON<T>(
  userMessage: string,
  options: AskClaudeOptions & { jsonShapeHint?: string } = {}
): Promise<T> {
  const systemPrompt = `${options.systemPrompt ?? ""}

Respond with VALID JSON only — no markdown fences, no commentary.${
    options.jsonShapeHint ? `\nExpected shape:\n${options.jsonShapeHint}` : ""
  }`.trim();

  const raw = await askClaude(userMessage, { ...options, systemPrompt });

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

export { MODEL_MAP };
