---
sidebar_label: Edge Config Setup
---

# Vercel Edge Config — Setup Guide

Step-by-step guide to connecting a Next.js project to Vercel Edge Config. This enables sub-millisecond reads of CMS configuration (security headers, robots.txt, manifest, etc.) at the edge — no CMS calls at request time.

---

## Prerequisites

- A GitHub repository with a Next.js app
- [Vercel CLI](https://vercel.com/docs/cli) installed and authenticated (`npm i -g vercel && vercel login`)
- A Vercel account (Free, Pro, or Enterprise)

---

## Step 1: Create a Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. If it's a monorepo, set the **Root Directory** to the app folder (e.g. `apps/web`)
4. Set **Framework Preset** to **Next.js** (usually auto-detected)
5. Click **Deploy**

The first deploy can be minimal — the important thing is that the project exists and is linked to your repo.

---

## Step 2: Create an Edge Config Database

1. Go to [Vercel Dashboard → Storage](https://vercel.com/~/stores)
2. Click **Create Database** → select **Edge Config**
3. Give it a name (e.g. `my-site-edge-config`)
4. Note the **Store ID** from the URL — it looks like `ecfg_xxxxxxxxxxxx`

---

## Step 3: Connect Edge Config to Your Project

1. On the Edge Config page, click the **Projects** tab (or the **Connect to Project** button)
2. Select your project from the dropdown
3. Click **Connect**

This automatically injects the `EDGE_CONFIG` environment variable (the connection string) into your Vercel project. It looks like:

```
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxxxxxxxxxxx?token=...
```

---

## Step 4: Create a Vercel API Token

The connection string from Step 3 gives you **read** access. To **write** to Edge Config (from webhooks), you need an API token.

1. Go to [Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name it (e.g. `edge-config-write`)
4. Set the scope (Full Account, or scoped to the specific project)
5. Copy the token — you won't see it again

---

## Step 5: Set Environment Variables

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `EDGE_CONFIG` | _(already set by Step 3)_ | Connection string for reads |
| `EDGE_CONFIG_ID` | `ecfg_xxxxxxxxxxxx` | Store ID from Step 2 (for write API) |
| `VERCEL_API_TOKEN` | Token from Step 4 | Authorizes Edge Config writes |

Set all variables for **Production**, **Preview**, and **Development** environments.

---

## Step 6: Link Your Local Environment

From your project root (or monorepo root), run:

```bash
vercel link
```

It will prompt you:

| Prompt | Answer |
|--------|--------|
| Set up project? | **Y** |
| Which scope? | Select your team/org |
| Link to existing project? | **Y** |
| Project name? | Your project name (e.g. `my-site-web`) |

> **Tip:** If the interactive prompts don't find your project, use the explicit form:
> ```bash
> vercel link --project my-site-web --scope my-team-slug
> ```
> The scope slug is the part after `vercel.com/` in your project URL.

Then pull the environment variables locally:

```bash
vercel env pull apps/web/.env.local
```

(Adjust the path if your app isn't in a monorepo.)

---

## Step 7: Verify

Check that `apps/web/.env.local` contains:

```env
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxxxxxxxxxxx?token=...
```

Then manually add the write credentials (these are not auto-pulled since you set them manually):

```env
EDGE_CONFIG_ID=ecfg_xxxxxxxxxxxx
VERCEL_API_TOKEN=your_token_here
```

---

## Step 8: Install the SDK

In your Next.js app:

```bash
npm install @vercel/edge-config
```

---

## Step 9: Create the Client

```ts
// lib/edge-config.ts
import { createClient } from '@vercel/edge-config';

const client = createClient(process.env.EDGE_CONFIG);

export async function edgeGet<T>(key: string): Promise<T | undefined> {
  return client.get<T>(key);
}

export async function edgeGetAll(keys: string[]): Promise<Map<string, unknown>> {
  const entries = await client.getAll(keys);
  return new Map(Object.entries(entries));
}

export async function edgeWrite(
  items: Array<{ operation: 'upsert' | 'delete'; key: string; value?: unknown }>
) {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );
  if (!res.ok) {
    throw new Error(`Edge Config write failed: ${res.status} ${await res.text()}`);
  }
}
```

---

## Step 10: Test the Connection

Create a quick test route to verify everything works:

```ts
// app/api/edge-test/route.ts
import { edgeWrite, edgeGet } from '@/lib/edge-config';

export async function GET() {
  // Write a test value
  await edgeWrite([
    { operation: 'upsert', key: 'test:hello', value: 'Edge Config works!' },
  ]);

  // Read it back
  const value = await edgeGet<string>('test:hello');

  // Clean up
  await edgeWrite([
    { operation: 'delete', key: 'test:hello' },
  ]);

  return Response.json({ success: true, value });
}
```

Run `npm run dev`, visit `http://localhost:3000/api/edge-test`, and you should see:

```json
{ "success": true, "value": "Edge Config works!" }
```

---

## What's Next?

With Edge Config connected, you can:

- **Store CMS config singletons** (security headers, robots.txt, manifest.json) for sub-ms reads
- **Write from CMS webhooks** so config updates don't require a redeploy
- **Read in middleware** to apply security headers on every response
- **Serve config via edge route handlers** (e.g. `/robots.txt`, `/.well-known/security.txt`)

See [Vercel (Next.js)](./vercel.md) for the full architecture and webhook handler implementations.
