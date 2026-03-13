export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export interface ErrorResponse {
  error: string;
  code: ErrorCode;
}

export type ErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "INVALID_IMAGE_TYPE"
  | "IMAGE_TOO_LARGE"
  | "NO_IMAGE"
  | "INVALID_URL"
  | "INVALID_PRESET"
  | "FETCH_FAILED"
  | "VISION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiKeyRow {
  id: string;
  key_hash: string;
  name: string;
  daily_limit: number;
  monthly_limit: number;
  is_active: number;
  created_at: string;
}

export interface PresetConfig {
  systemPrompt: string;
  maxTokens: number;
  parseResponse: (raw: string) => unknown;
}

export interface VisionSuccess {
  success: true;
  result: unknown;
  inputTokens: number;
  outputTokens: number;
}

export interface VisionError {
  success: false;
  error: string;
}

export type VisionResult = VisionSuccess | VisionError;
