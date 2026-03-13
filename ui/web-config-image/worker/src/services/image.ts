import { ErrorCode } from "../types.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const URL_FETCH_TIMEOUT_MS = 10_000;

interface ImageSuccess {
  success: true;
  base64: string;
  mediaType: string;
}

interface ImageError {
  success: false;
  error: string;
  code: ErrorCode;
}

type ImageResult = ImageSuccess | ImageError;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function validateType(mimeType: string): boolean {
  return ALLOWED_TYPES.has(mimeType);
}

export async function extractImageFromFormData(request: Request): Promise<ImageResult> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { success: false, error: "Invalid form data", code: "NO_IMAGE" };
  }

  const file = formData.get("image") as unknown;
  if (!file || !(file instanceof File)) {
    return { success: false, error: "No image file provided", code: "NO_IMAGE" };
  }

  if (!validateType(file.type)) {
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
  return { success: true, base64: toBase64(bytes), mediaType: file.type };
}

export async function fetchImageFromUrl(url: string): Promise<ImageResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { success: false, error: `Invalid URL: ${url}`, code: "INVALID_URL" };
  }

  if (!parsedUrl.protocol.startsWith("http")) {
    return { success: false, error: "URL must use http or https", code: "INVALID_URL" };
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);
    response = await fetch(parsedUrl.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to fetch image: ${message}`, code: "FETCH_FAILED" };
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Image fetch returned ${response.status}`,
      code: "FETCH_FAILED",
    };
  }

  const contentType = response.headers.get("Content-Type")?.split(";")[0]?.trim() ?? "";
  if (!validateType(contentType)) {
    return {
      success: false,
      error: `Invalid image type: ${contentType}. Accepted: jpeg, png, webp, gif`,
      code: "INVALID_IMAGE_TYPE",
    };
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: `Image too large: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
      code: "IMAGE_TOO_LARGE",
    };
  }

  const bytes = new Uint8Array(arrayBuffer);
  return { success: true, base64: toBase64(bytes), mediaType: contentType };
}
