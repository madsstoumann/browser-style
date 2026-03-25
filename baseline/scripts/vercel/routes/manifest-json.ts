/**
 * manifest.json Edge Route Handler
 *
 * Copy to: app/manifest.json/route.ts in your Next.js project.
 * Adjust the import path for edgeGet.
 */

import { edgeGet } from '../lib/edge-config';

export const runtime = 'edge';

export async function GET() {
  const manifest = await edgeGet<Record<string, unknown>>('crawler_manifest');

  return Response.json(manifest ?? {}, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
