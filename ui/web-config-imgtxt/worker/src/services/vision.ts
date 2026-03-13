import { VisionResult, PresetConfig } from "../types.js";

export async function analyzeImage(
  base64: string,
  mediaType: string,
  apiKey: string,
  preset: PresetConfig
): Promise<VisionResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: preset.maxTokens,
      system: preset.systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { success: false, error: `Anthropic API error ${response.status}: ${body}` };
  }

  const data = await response.json() as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const textBlock = data.content.find(b => b.type === "text");
  if (!textBlock?.text) {
    return { success: false, error: "No text response from Claude" };
  }

  try {
    const result = preset.parseResponse(textBlock.text);
    return {
      success: true,
      result,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to parse response: ${message}` };
  }
}
