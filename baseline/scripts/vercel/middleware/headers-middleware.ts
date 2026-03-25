/**
 * Security Headers Middleware
 *
 * Copy to: middleware.ts at the root of your Next.js app (NOT inside src/).
 * Adjust the import path for edgeGetAll.
 *
 * Reads CSP, Permissions-Policy, Referrer-Policy, HSTS, and CORS
 * from Edge Config on every request (sub-ms batch read).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { edgeGetAll } from '../lib/edge-config';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const config = await edgeGetAll([
    'headers_csp',
    'headers_permissions',
    'headers_referrer',
    'headers_hsts',
    'headers_cors',
  ]);

  const csp = config.get('headers_csp') as Record<string, string[]> | undefined;
  const permissions = config.get('headers_permissions') as Record<string, string> | undefined;
  const referrer = config.get('headers_referrer') as { policy: string } | undefined;
  const hsts = config.get('headers_hsts') as {
    max_age: number;
    include_sub_domains?: boolean;
    preload?: boolean;
  } | undefined;
  const cors = config.get('headers_cors') as {
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    expose_headers?: string[];
    max_age?: number;
    allow_credentials?: boolean;
  } | undefined;

  // --- CSP with per-request nonce ---
  if (csp) {
    const nonce = generateNonce();
    response.headers.set('Content-Security-Policy', buildCspString(csp, nonce));
    response.headers.set('x-nonce', nonce);
  }

  // --- Permissions-Policy ---
  if (permissions) {
    const pp = Object.entries(permissions)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
    response.headers.set('Permissions-Policy', pp);
  }

  // --- Referrer-Policy ---
  if (referrer?.policy) {
    response.headers.set('Referrer-Policy', referrer.policy);
  }

  // --- HSTS ---
  if (hsts) {
    let value = `max-age=${hsts.max_age}`;
    if (hsts.include_sub_domains) value += '; includeSubDomains';
    if (hsts.preload) value += '; preload';
    response.headers.set('Strict-Transport-Security', value);
  }

  // --- CORS (cross-origin requests only) ---
  const origin = request.headers.get('Origin');
  if (cors && origin && cors.allowed_origins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', cors.allowed_methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', cors.allowed_headers.join(', '));
    if (cors.expose_headers?.length) {
      response.headers.set('Access-Control-Expose-Headers', cors.expose_headers.join(', '));
    }
    if (cors.max_age) {
      response.headers.set('Access-Control-Max-Age', String(cors.max_age));
    }
    if (cors.allow_credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  return response;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function buildCspString(csp: Record<string, string[]>, nonce: string): string {
  return Object.entries(csp)
    .map(([directive, values]) => {
      const resolved = values.map((v) => v.replace('{nonce}', nonce));
      return `${directive} ${resolved.join(' ')}`;
    })
    .join('; ');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
