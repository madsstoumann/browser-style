import { PresetConfig } from "./types.js";

const ALT_MAX = 125;
const LONGDESC_MAX = 512;

function truncateAtWord(text: string, maxLength: number): string {
  let result = text.trim();
  if (result.length > maxLength) {
    const truncated = result.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(" ");
    result = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
  return result;
}

function stripMarkdownFences(text: string): string {
  const raw = text.trim();
  const fenceMatch = raw.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : raw;
}

export const presets: Record<string, PresetConfig> = {
  alttext: {
    systemPrompt: `You generate image descriptions for web accessibility.
Return a JSON object with exactly two fields:
- "alt": A concise alt text, max ${ALT_MAX} characters. One short sentence naming the primary subject and its most essential attribute.
- "longdesc": A fuller description, max ${LONGDESC_MAX} characters. Two to three sentences covering the subject, setting, mood, colors, and spatial composition.

Rules:
- Return ONLY valid JSON — no markdown fencing, no extra text
- Identify recognizable public figures (politicians, heads of state, celebrities, athletes, etc.) by their full name
- Do not start either field with "Image of", "Photo of", "Picture of", or similar prefixes
- Stay within the character limits specified for each field`,
    maxTokens: 500,
    parseResponse(raw: string) {
      const json = JSON.parse(stripMarkdownFences(raw));
      if (!json.alt || !json.longdesc) {
        throw new Error("Response missing alt or longdesc field");
      }
      return {
        alt: truncateAtWord(json.alt, ALT_MAX),
        longdesc: truncateAtWord(json.longdesc, LONGDESC_MAX),
      };
    },
  },

  food: {
    systemPrompt: `You are a food ingredient identifier. Analyze the photo and return ONLY a JSON array of food items you can identify. Be specific about each item (e.g., "red bell pepper" not "vegetable", "sourdough bread" not "bread").

Rules:
- Return ONLY valid JSON, no other text
- Array of objects: [{"item": "...", "quantity": "..."}]
- Consolidate duplicates into a single entry. If you see 2 whole tomatoes and 2 halves, return ONE entry: {"item": "tomato", "quantity": "3"}. If you see 2 whole bell peppers and 1 halved, return {"item": "red bell pepper", "quantity": "2.5"}.
- quantity must be a single number or numeric estimate (e.g., "3", "2.5", "0.5", "12"). Use weight in grams only when count is impractical (e.g., "200g" for a block of cheese, "handful" for herbs).
- If no food items are visible, return []
- Maximum 30 items
- Ignore non-food items`,
    maxTokens: 400,
    parseResponse(raw: string) {
      const ingredients = JSON.parse(stripMarkdownFences(raw));
      return { ingredients };
    },
  },
};
