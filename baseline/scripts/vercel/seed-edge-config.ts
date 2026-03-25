/**
 * Seed Edge Config from demo content
 *
 * Reads the JSON files in content/ and writes them to Edge Config.
 * Useful for initial population and local testing.
 *
 * Usage:
 *   npx tsx scripts/vercel/seed-edge-config.ts
 *
 * Requires in .env.local (same directory or parent):
 *   EDGE_CONFIG_ID=ecfg_xxxx
 *   VERCEL_API_TOKEN=your_token
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Load .env.local manually (no dotenv dependency needed)
function loadEnvFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* file not found — skip */ }
}

loadEnvFile(path.resolve(__dirname, '../../.env.local'));
loadEnvFile(path.resolve(__dirname, '../../../.env.local'));

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
  console.error('Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN in .env.local');
  process.exit(1);
}

type EdgeItem = { operation: string; key: string; value?: unknown };

async function edgeWrite(items: EdgeItem[]) {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );
  if (!res.ok) {
    throw new Error(`Edge Config write failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function readContent(filePath: string): Record<string, unknown> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function seed() {
  const contentDir = path.resolve(__dirname, '../../content');
  const items: EdgeItem[] = [];

  // --- Headers Config ---
  const headers = readContent(path.join(contentDir, 'headers-config/default.json'));
  const hf = headers.fields as any;
  console.log('Preparing headers-config ...');

  // Transform CSP from { directive: { added: [...] } } to flat arrays with defaults
  const cspDefaults: Record<string, string[]> = {
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
  const cspFlat: Record<string, string[]> = { ...cspDefaults };
  for (const [directive, config] of Object.entries(hf.csp as Record<string, { added?: string[] }>)) {
    const base = cspDefaults[directive] ?? [];
    cspFlat[directive] = [...base, ...(config.added ?? [])];
  }

  // Transform permissions_policy from { feature: string[] } to { feature: "(self)" | "()" }
  const ppFlat: Record<string, string> = {};
  for (const [feature, allowlist] of Object.entries(hf.permissions_policy as Record<string, string[]>)) {
    ppFlat[feature] = allowlist.length === 0 ? '()' : `(${allowlist.join(' ')})`;
  }

  items.push(
    { operation: 'upsert', key: 'headers_csp', value: cspFlat },
    { operation: 'upsert', key: 'headers_permissions', value: ppFlat },
    { operation: 'upsert', key: 'headers_referrer', value: { policy: hf.referrer_policy } },
    {
      operation: 'upsert',
      key: 'headers_hsts',
      value: {
        max_age: hf.hsts_max_age,
        include_sub_domains: hf.hsts_include_sub_domains,
        preload: hf.hsts_preload,
      },
    },
    { operation: 'upsert', key: 'headers_cors', value: hf.cors },
  );

  // --- Crawler Config ---
  const crawler = readContent(path.join(contentDir, 'crawler-config/default.json'));
  const cf = crawler.fields as any;
  console.log('Preparing crawler-config ...');
  items.push(
    { operation: 'upsert', key: 'crawler_robots', value: cf.robots_txt },
    { operation: 'upsert', key: 'crawler_manifest', value: cf.manifest },
    {
      operation: 'upsert',
      key: 'crawler_llms_config',
      value: {
        enabled: cf.llms_enabled,
        preamble: cf.llms_preamble,
        exclude_patterns: cf.llms_exclude_patterns,
      },
    },
  );

  // --- Security Config ---
  const security = readContent(path.join(contentDir, 'security-config/default.json'));
  const sf = security.fields as any;
  console.log('Preparing security-config ...');
  items.push(
    { operation: 'upsert', key: 'security_txt', value: sf.security_txt },
  );

  // --- Site Config ---
  const site = readContent(path.join(contentDir, 'site/config.json'));
  const sitef = site.fields as any;
  console.log('Preparing site ...');
  items.push({
    operation: 'upsert',
    key: 'site',
    value: {
      site_name: sitef.site_name,
      site_url: sitef.site_url,
      site_description: sitef.site_description,
      default_locale: sitef.default_locale,
      legal_name: sitef.legal_name,
      contact_email: sitef.contact_email,
      contact_phone: sitef.contact_phone,
      address: sitef.address,
    },
  });

  // --- Single batch write ---
  console.log(`Writing ${items.length} items to Edge Config ...`);
  await edgeWrite(items);
  console.log('Done! All config seeded.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
