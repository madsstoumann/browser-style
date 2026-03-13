export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export interface AltTextResponse {
  alt: string;
  longdesc: string;
  usage: {
    requests_today: number;
    daily_limit: number;
  };
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
