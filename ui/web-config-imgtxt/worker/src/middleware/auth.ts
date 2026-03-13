import { Env, ApiKeyRow, ErrorCode } from "../types.js";

type AuthResult = {
  success: true;
  apiKey: ApiKeyRow;
} | {
  success: false;
  error: string;
  code: ErrorCode;
  status: number;
};

export async function authenticate(request: Request, env: Env): Promise<AuthResult> {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return { success: false, error: "Missing API key", code: "UNAUTHORIZED", status: 401 };
  }

  const keyHash = await hashApiKey(apiKey);
  const row = await env.DB.prepare(
    "SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1"
  ).bind(keyHash).first<ApiKeyRow>();

  if (!row) {
    return { success: false, error: "Invalid API key", code: "UNAUTHORIZED", status: 401 };
  }

  const today = new Date().toISOString().split("T")[0];
  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM usage_log WHERE user_id = ? AND created_at >= ?"
  ).bind(row.id, today).first<{ count: number }>();

  const requestsToday = countResult?.count ?? 0;
  if (requestsToday >= row.daily_limit) {
    return { success: false, error: "Daily rate limit exceeded", code: "RATE_LIMITED", status: 429 };
  }

  return { success: true, apiKey: row };
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
