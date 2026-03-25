import { type NextRequest } from 'next/server';

/**
 * Validates inbound CMS webhook requests.
 * Returns true if the shared secret matches.
 */
export function validateWebhook(request: NextRequest): boolean {
  const secret = request.headers.get('x-cms-webhook-secret');
  return !!secret && secret === process.env.CMS_WEBHOOK_SECRET;
}
