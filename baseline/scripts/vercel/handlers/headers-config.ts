import { edgeWrite } from '../lib/edge-config';

interface HeadersConfigFields {
  title: string;
  csp: Record<string, { added?: string[] }>;
  permissions_policy: Record<string, string[]>;
  referrer_policy: string;
  hsts_max_age: number;
  hsts_include_sub_domains: boolean;
  hsts_preload: boolean;
  cors: {
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    expose_headers: string[];
    max_age: number;
    allow_credentials: boolean;
  };
}

/**
 * Transforms CSP from the UCM "added" format into flat directive arrays.
 * The baseline defaults ('self') are prepended; the CMS only supplies additions.
 */
function buildCspDirectives(
  csp: Record<string, { added?: string[] }>
): Record<string, string[]> {
  const defaults: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'nonce-{nonce}'"],
    'style-src': ["'self'"],
    'img-src': ["'self'"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const result: Record<string, string[]> = { ...defaults };

  for (const [directive, config] of Object.entries(csp)) {
    const base = defaults[directive] ?? [];
    result[directive] = [...base, ...(config.added ?? [])];
  }

  return result;
}

/**
 * Transforms permissions_policy from { feature: string[] } into
 * the format middleware expects: { feature: "(self)" | "()" | "(origin ...)" }
 */
function buildPermissionsPolicy(
  pp: Record<string, string[]>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [feature, allowlist] of Object.entries(pp)) {
    if (allowlist.length === 0) {
      result[feature] = '()';
    } else {
      result[feature] = `(${allowlist.join(' ')})`;
    }
  }
  return result;
}

export async function handleHeadersConfig(fields: HeadersConfigFields) {
  await edgeWrite([
    { operation: 'upsert', key: 'headers_csp', value: buildCspDirectives(fields.csp) },
    { operation: 'upsert', key: 'headers_permissions', value: buildPermissionsPolicy(fields.permissions_policy) },
    { operation: 'upsert', key: 'headers_referrer', value: { policy: fields.referrer_policy } },
    {
      operation: 'upsert',
      key: 'headers_hsts',
      value: {
        max_age: fields.hsts_max_age,
        include_sub_domains: fields.hsts_include_sub_domains,
        preload: fields.hsts_preload,
      },
    },
    { operation: 'upsert', key: 'headers_cors', value: fields.cors },
  ]);
}
