const ALT_MAX = 125;
const LONGDESC_MAX = 512;

const SYSTEM_PROMPT = `You generate image descriptions for web accessibility.
Return a JSON object with exactly two fields:
- "alt": A concise alt text, max ${ALT_MAX} characters. One short sentence naming the primary subject and its most essential attribute.
- "longdesc": A fuller description, max ${LONGDESC_MAX} characters. Two to three sentences covering the subject, setting, mood, colors, and spatial composition.

Rules:
- Return ONLY valid JSON — no markdown fencing, no extra text
- Identify recognizable public figures (politicians, heads of state, celebrities, athletes, etc.) by their full name
- Do not start either field with "Image of", "Photo of", "Picture of", or similar prefixes
- Stay within the character limits specified for each field`;

interface VisionSuccess {
  success: true;
  alt: string;
  longdesc: string;
  inputTokens: number;
  outputTokens: number;
}

interface VisionError {
  success: false;
  error: string;
}

type VisionResult = VisionSuccess | VisionError;

function truncateAtWord(text: string, maxLength: number): string {
  let result = text.trim();
  if (result.length > maxLength) {
    const truncated = result.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(" ");
    result = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
  return result;
}

export async function generateAltText(
  base64: string,
  mediaType: string,
  apiKey: string
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
      max_tokens: 500,
      system: SYSTEM_PROMPT,
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

  // Strip markdown fencing if present
  let raw = textBlock.text.trim();
  const fenceMatch = raw.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) raw = fenceMatch[1].trim();

  let parsed: { alt?: string; longdesc?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, error: "Failed to parse JSON from Claude response" };
  }

  if (!parsed.alt || !parsed.longdesc) {
    return { success: false, error: "Response missing alt or longdesc field" };
  }

  return {
    success: true,
    alt: truncateAtWord(parsed.alt, ALT_MAX),
    longdesc: truncateAtWord(parsed.longdesc, LONGDESC_MAX),
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
  };
}
