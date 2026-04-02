/**
 * security.txt Edge Route Handler
 *
 * Copy to: app/.well-known/security.txt/route.ts in your Next.js project.
 * Adjust the import path for edgeGet.
 */

import { edgeGet } from '../lib/edge-config';

export const runtime = 'edge';

export async function GET() {
  const content = await edgeGet<string>('security_txt');

  return new Response(content ?? '', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
