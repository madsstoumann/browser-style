import { Env } from "./types.js";
import { handleAnalyze } from "./handlers/analyze.js";
import { handleHealth } from "./handlers/health.js";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    let response: Response;

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        response = await handleHealth(env);
      } else if (url.pathname === "/analyze" && request.method === "POST") {
        response = await handleAnalyze(request, env);
      } else {
        response = Response.json(
          { error: "Not found" },
          { status: 404 }
        );
      }
    } catch (e) {
      console.error("Unhandled error:", e);
      response = Response.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return withCors(response);
  },
};
