---
sidebar_label: Error Page
---

# 🟠 Error Page

An `error-page` maps an HTTP status code to a custom [page](./page.md). The site references an array of these, so any status code can have a custom error page — no schema changes needed.

Schema: [`models/error-page.schema.json`](../../models/error-page.schema.json)

---

## Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `status_code` | select | yes | HTTP status code: `401`, `403`, `404`, `410`, `500`, `503` |
| `page_id` | ref ► page | yes | The page to render for this error |

The referenced page is a regular `page` entry with layouts and content — it can have a hero, a search box, helpful links, whatever makes sense for the error context. These pages should have `robots: ["noindex", "nofollow"]` set.

---

## Common Error Pages

| Code | Name | When to use |
|------|------|-------------|
| `401` | Unauthorized | User is not authenticated — show login prompt or redirect |
| `403` | Forbidden | User is authenticated but lacks permission |
| `404` | Not Found | URL doesn't match any page — the most common error page |
| `410` | Gone | Content was intentionally removed (useful for SEO — tells crawlers to stop indexing) |
| `500` | Internal Server Error | Unexpected server failure |
| `503` | Service Unavailable | Planned maintenance or temporary overload |

---

## How It Works at Runtime

The site webhook resolves `error_pages` into a lookup map keyed by status code. The rendering code uses this map to find the right page for any error.

### Edge store payload

The webhook flattens the array into a `status_code → page URL` map for instant lookup:

```
edge key: site → {
  ...
  error_pages: {
    "401": "/not-authenticated",
    "403": "/forbidden",
    "404": "/error-404",
    "500": "/error-500"
  }
}
```

The rendering code reads this map and redirects to the appropriate page URL — or renders it inline, depending on the framework.

---

## Platform Handling

### Vercel (Next.js)

Next.js has built-in error handling for 404 and 500 via `not-found.tsx` and `error.tsx`. For other status codes, use middleware or route-level error boundaries.

```ts
// lib/errors.ts
import { edgeGet } from '@/lib/edge-config';

type ErrorPageMap = Record<string, string>;

export async function getErrorPageUrl(statusCode: number): Promise<string | null> {
  const site = await edgeGet<{ error_pages: ErrorPageMap }>('site');
  return site?.error_pages?.[String(statusCode)] ?? null;
}
```

#### 404 — Not Found

```tsx
// app/not-found.tsx
import { getErrorPageUrl } from '@/lib/errors';
import { getPage } from '@/lib/pages';

export default async function NotFound() {
  const url = await getErrorPageUrl(404);
  if (!url) return <h1>Page not found</h1>;

  const page = await getPage(url);
  return <PageRenderer page={page} />;
}
```

#### 500 — Server Error

```tsx
// app/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // Client component — cannot read edge store directly.
  // Pre-render the 500 page content at build time or use a static fallback.
  return (
    <div>
      <h1>Something went wrong</h1>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

#### 401 / 403 — Auth errors

Handle in middleware by checking authentication state before the page renders:

```ts
// middleware.ts (auth section)
import { getErrorPageUrl } from '@/lib/errors';

// Inside the middleware function, after auth check:
if (!session && protectedRoute) {
  const errorUrl = await getErrorPageUrl(401);
  if (errorUrl) {
    return NextResponse.rewrite(new URL(errorUrl, request.url));
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

if (session && !hasPermission) {
  const errorUrl = await getErrorPageUrl(403);
  if (errorUrl) {
    return NextResponse.rewrite(new URL(errorUrl, request.url));
  }
}
```

#### 503 — Maintenance mode

Use middleware to intercept all requests when maintenance mode is active:

```ts
// middleware.ts (maintenance section)
const maintenance = await edgeGet<boolean>('maintenance');
if (maintenance) {
  const errorUrl = await getErrorPageUrl(503);
  if (errorUrl) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Retry-After': '3600',
        'X-Rewrite-Url': errorUrl,
      },
    });
  }
}
```

### Cloudflare (Workers)

Workers handle errors in the fetch handler. The error page map is read from KV alongside the site config.

```ts
// src/lib/errors.ts
type ErrorPageMap = Record<string, string>;

export async function getErrorPageUrl(
  statusCode: number,
  env: Env
): Promise<string | null> {
  const siteStr = await env.CONFIG_KV.get('site');
  if (!siteStr) return null;
  const site = JSON.parse(siteStr);
  return site.error_pages?.[String(statusCode)] ?? null;
}
```

#### 404 — Not Found

```ts
// src/index.ts — inside fetch handler
const page = await getPage(slug, env);
if (!page) {
  const errorUrl = await getErrorPageUrl(404, env);
  if (errorUrl) {
    const errorPage = await getPage(errorUrl, env);
    return renderPage(errorPage, { status: 404 });
  }
  return new Response('Not Found', { status: 404 });
}
```

#### 401 / 403 — Auth errors

```ts
// src/middleware/auth.ts
export async function handleAuth(request: Request, env: Env): Promise<Response | null> {
  const session = await getSession(request, env);

  if (!session && isProtectedRoute(request.url)) {
    const errorUrl = await getErrorPageUrl(401, env);
    if (errorUrl) {
      const errorPage = await getPage(errorUrl, env);
      return renderPage(errorPage, { status: 401 });
    }
    return Response.redirect(new URL('/login', request.url).toString());
  }

  if (session && !hasPermission(session, request.url)) {
    const errorUrl = await getErrorPageUrl(403, env);
    if (errorUrl) {
      const errorPage = await getPage(errorUrl, env);
      return renderPage(errorPage, { status: 403 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  return null; // No error — continue to page handler
}
```

#### 503 — Maintenance mode

```ts
// src/index.ts — at the top of fetch handler
const maintenance = await env.CONFIG_KV.get('maintenance');
if (maintenance === 'true') {
  const errorUrl = await getErrorPageUrl(503, env);
  if (errorUrl) {
    const errorPage = await getPage(errorUrl, env);
    return renderPage(errorPage, {
      status: 503,
      headers: { 'Retry-After': '3600' },
    });
  }
  return new Response('Service Unavailable', {
    status: 503,
    headers: { 'Retry-After': '3600' },
  });
}
```

### MVC / Server-Rendered CMS

In MVC CMSes, error page routing is typically handled by the framework's error handler or webserver configuration.

**WordPress:**
```php
// functions.php or theme template
function custom_error_page($template) {
  if (is_404()) {
    $error_pages = get_field('error_pages', 'option'); // ACF options page
    foreach ($error_pages as $entry) {
      if ($entry['status_code'] === '404') {
        return get_page_template_slug($entry['page_id']);
      }
    }
  }
  return $template;
}
add_filter('template_include', 'custom_error_page');
```

**Laravel / Craft CMS:**
```php
// app/Exceptions/Handler.php
public function render($request, Throwable $e)
{
    $statusCode = $this->isHttpException($e) ? $e->getStatusCode() : 500;
    $errorPage = Site::singleton()->errorPages()
        ->where('status_code', $statusCode)
        ->first();

    if ($errorPage) {
        return response()
            ->view('page', ['page' => $errorPage->page])
            ->setStatusCode($statusCode);
    }

    return parent::render($request, $e);
}
```

---

## Webhook Handling

The site webhook resolves `error_pages` references into the status code map:

```ts
// In handleSite webhook (both platforms)
const errorPages = await resolveRefs(site.fields.error_pages);
const errorPageMap: Record<string, string> = {};
for (const ep of errorPages) {
  const page = await resolveRef(ep.page_id, ['url']);
  errorPageMap[ep.status_code] = page.url;
}

// Written as part of the site payload:
// error_pages: { "404": "/error-404", "500": "/error-500", "401": "/not-authenticated" }
```

---

## Static Fallback

The error page system depends on the edge store being reachable. If the edge store itself is down, the middleware can't look up error pages — so it needs a hardcoded last-resort fallback baked directly into the code.

```ts
// Inline fallback — no external dependencies
const STATIC_FALLBACK = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Error</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#333}
.e{text-align:center}h1{font-size:2rem;margin:0 0 .5rem}p{color:#666}</style></head>
<body><div class="e"><h1>Something went wrong</h1><p>Please try again later.</p></div></body>
</html>`;
```

Use it as the final fallback in every error code path:

```ts
// Vercel middleware
const errorUrl = await getErrorPageUrl(404).catch(() => null);
if (errorUrl) {
  return NextResponse.rewrite(new URL(errorUrl, request.url), { status: 404 });
}
return new NextResponse(STATIC_FALLBACK, {
  status: 404,
  headers: { 'Content-Type': 'text/html' },
});
```

```ts
// Cloudflare Worker
const errorUrl = await getErrorPageUrl(404, env).catch(() => null);
if (errorUrl) {
  const errorPage = await getPage(errorUrl, env);
  if (errorPage) return renderPage(errorPage, { status: 404 });
}
return new Response(STATIC_FALLBACK, {
  status: 404,
  headers: { 'Content-Type': 'text/html' },
});
```

This ensures the site always returns a valid HTML response with the correct status code, even during a complete edge store outage.

---

## Important Notes

- **Always set the correct HTTP status code** — rendering a pretty error page should not return `200 OK`. Use `rewrite` (not `redirect`) to keep the original URL while serving the error content with the correct status.
- **Client-side error boundaries** (React `error.tsx`) run in the browser and can't read edge stores. Pre-render critical error pages or use static fallbacks.
- **The `Retry-After` header** is important for `503` responses — it tells crawlers when to come back, preventing them from treating the downtime as a permanent issue.
- **`410 Gone`** is worth using when content is intentionally removed — it signals crawlers to drop the URL from their index faster than a `404`.
