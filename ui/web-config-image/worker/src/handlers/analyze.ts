import { Env, ErrorResponse, ErrorCode } from "../types.js";
import { presets } from "../presets.js";
import { authenticate } from "../middleware/auth.js";
import { fetchImageFromUrl } from "../services/image.js";
import { analyzeImage } from "../services/vision.js";
import { logUsage, getTodayCount } from "../db/usage.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth.success) {
    return Response.json(
      { error: auth.error, code: auth.code } satisfies ErrorResponse,
      { status: auth.status }
    );
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  let image: { success: true; base64: string; mediaType: string } | { success: false; error: string; code: ErrorCode };
  let presetName: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    presetName = (formData.get("preset") as string) ?? "";
    const file = formData.get("image") as unknown;
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "No image file provided", code: "NO_IMAGE" } satisfies ErrorResponse,
        { status: 400 }
      );
    }
    image = await validateAndEncodeFile(file);
  } else {
    let body: { url?: string; preset?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body", code: "NO_IMAGE" } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    presetName = body.preset ?? "";

    if (!body.url) {
      return Response.json(
        { error: "Missing 'url' in JSON body", code: "NO_IMAGE" } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    image = await fetchImageFromUrl(body.url);
  }

  if (!presetName || !presets[presetName]) {
    return Response.json(
      { error: `Invalid preset: "${presetName}". Available: ${Object.keys(presets).join(", ")}`, code: "INVALID_PRESET" } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  if (!image.success) {
    return Response.json(
      { error: image.error, code: image.code } satisfies ErrorResponse,
      { status: image.code === "FETCH_FAILED" ? 502 : 400 }
    );
  }

  const preset = presets[presetName];
  const vision = await analyzeImage(
    image.base64,
    image.mediaType,
    env.ANTHROPIC_API_KEY,
    preset
  );
  if (!vision.success) {
    return Response.json(
      { error: vision.error, code: "VISION_ERROR" } satisfies ErrorResponse,
      { status: 502 }
    );
  }

  await logUsage(
    env,
    auth.apiKey.id,
    presetName,
    vision.inputTokens,
    vision.outputTokens,
  );

  const requestsToday = await getTodayCount(env, auth.apiKey.id);

  return Response.json({
    preset: presetName,
    result: vision.result,
    usage: {
      requests_today: requestsToday,
      daily_limit: auth.apiKey.daily_limit,
    },
  });
}

async function validateAndEncodeFile(file: File): Promise<
  { success: true; base64: string; mediaType: string } |
  { success: false; error: string; code: ErrorCode }
> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      success: false,
      error: `Invalid image type: ${file.type}. Accepted: jpeg, png, webp, gif`,
      code: "INVALID_IMAGE_TYPE",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
      code: "IMAGE_TOO_LARGE",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { success: true, base64: btoa(binary), mediaType: file.type };
}
