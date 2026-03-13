import { Env } from "../types.js";

export async function handleHealth(env: Env): Promise<Response> {
  try {
    await env.DB.prepare("SELECT 1").run();
    return Response.json({ status: "ok" });
  } catch (e) {
    return Response.json(
      { status: "error", message: "Database connection failed" },
      { status: 503 }
    );
  }
}
