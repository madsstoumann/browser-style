import { Env } from "../types.js";

const INPUT_COST_PER_TOKEN = 0.80 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 4.00 / 1_000_000;

export async function logUsage(
  env: Env,
  userId: string,
  source: string,
  inputTokens: number,
  outputTokens: number,
  charCount: number
): Promise<void> {
  const estimatedCost =
    inputTokens * INPUT_COST_PER_TOKEN +
    outputTokens * OUTPUT_COST_PER_TOKEN;

  await env.DB.prepare(
    `INSERT INTO usage_log (user_id, source, input_tokens, output_tokens, estimated_cost_usd, char_count)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(userId, source, inputTokens, outputTokens, estimatedCost, charCount)
    .run();
}

export async function getTodayCount(env: Env, userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const result = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM usage_log WHERE user_id = ? AND created_at >= ?"
  ).bind(userId, today).first<{ count: number }>();
  return result?.count ?? 0;
}
