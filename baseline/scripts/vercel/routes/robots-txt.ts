/**
 * robots.txt Edge Route Handler
 *
 * Copy to: app/robots.txt/route.ts in your Next.js project.
 * Adjust the import path for edgeGet.
 */

import { edgeGet } from '../lib/edge-config';

export const runtime = 'edge';

export async function GET() {
  const content = await edgeGet<string>('crawler_robots');

  if (!content) {
    return new Response('User-agent: *\nAllow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}
