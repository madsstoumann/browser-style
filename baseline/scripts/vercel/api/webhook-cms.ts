/**
 * CMS Webhook Router
 *
 * Copy to: app/api/webhook/cms/route.ts in your Next.js project.
 * Adjust import paths to match your project structure.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { validateWebhook } from '../lib/webhook-validate';
import { handleHeadersConfig } from '../handlers/headers-config';
import { handleCrawlerConfig } from '../handlers/crawler-config';
import { handleSecurityConfig } from '../handlers/security-config';
import { handleSiteConfig } from '../handlers/site-config';
import { handlePersonas } from '../handlers/persona';

interface ContentfulWebhookPayload {
  sys: {
    type: string;
    id: string;
    contentType: { sys: { id: string } };
  };
  fields?: Record<string, Record<string, unknown>>;
}

/**
 * Flattens Contentful's locale-keyed fields to a flat object.
 * { fieldName: { "en-US": value } } → { fieldName: value }
 */
function flattenFields(
  fields: Record<string, Record<string, unknown>>,
  locale = 'en-US'
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, locales] of Object.entries(fields)) {
    result[key] = locales[locale];
  }
  return result;
}

async function triggerDeployHook() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    console.warn('[webhook] VERCEL_DEPLOY_HOOK_URL not set — skipping deploy');
    return;
  }
  await fetch(url, { method: 'POST' });
}

export async function POST(request: NextRequest) {
  if (!validateWebhook(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: ContentfulWebhookPayload = await request.json();
    const contentType = payload.sys.contentType.sys.id;
    const entryId = payload.sys.id;
    const fields = payload.fields ? flattenFields(payload.fields) : {};

    console.log(`[webhook] ${contentType} (${entryId})`);

    switch (contentType) {
      // --- Edge Config singletons ---
      case 'headersConfig':
      case 'headers-config':
        await handleHeadersConfig(fields as any);
        break;

      case 'crawlerConfig':
      case 'crawler-config':
        await handleCrawlerConfig(fields as any);
        break;

      case 'securityConfig':
      case 'security-config':
        await handleSecurityConfig(fields as any);
        break;

      case 'siteSettings':
      case 'site':
        await handleSiteConfig(fields as any);
        break;

      case 'persona':
        await handlePersonas([fields as any]);
        break;

      // --- Cache invalidation ---
      case 'navigation':
      case 'mainNavigation':
      case 'navigation-item':
        revalidateTag('navigation');
        break;

      // --- ISR revalidation ---
      case 'page': {
        const slug = fields.slug as string;
        if (slug) {
          revalidatePath(`/${slug}`);
        }
        break;
      }

      // --- Full rebuild ---
      case 'translationNamespace':
      case 'translation-namespace':
        await triggerDeployHook();
        break;

      default:
        console.log(`[webhook] Unhandled content type: ${contentType}`);
    }

    return NextResponse.json({
      success: true,
      contentType,
      entryId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
