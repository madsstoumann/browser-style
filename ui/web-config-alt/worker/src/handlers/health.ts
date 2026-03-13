import { Env } from "../types.js";

export async function handleHealth(env: Env): Promise<Response> {
  try {
    await env.DB.prepare("SELECT 1").first();
    return Response.json({ status: "ok", db: "connected" });
  } catch (e) {
    return Response.json(
      { status: "degraded", db: "error", detail: String(e) },
      { status: 503 }
    );
  }
}
