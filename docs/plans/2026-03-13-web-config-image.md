# web-config-image Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a unified image analysis web component (`<web-config-image>`) and Cloudflare Worker that supports multiple AI analysis presets (starting with alt text and food recognition).

**Architecture:** One Cloudflare Worker at `image.stoumann.workers.dev` with a preset registry pattern — each preset defines a system prompt, max tokens, and response parser. One web component with preset-specific renderers. External wiring pattern (host page handles fetch with credentials).

**Tech Stack:** Cloudflare Workers, D1, Claude Haiku 4.5, Web Components (Shadow DOM, adopted stylesheets), TypeScript (worker), ES Modules (component).

---

### Task 1: Scaffold the package directory

**Files:**
- Create: `ui/web-config-image/package.json`
- Create: `ui/web-config-image/CLAUDE.md`

**Step 1: Create package.json**

```json
{
  "name": "@browser.style/web-config-image",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.js",
  "dependencies": {
    "@browser.style/web-config-shared": "^1.0.0"
  }
}
```

**Step 2: Create CLAUDE.md**

```markdown
@AGENTS.md
```

**Step 3: Commit**

```bash
git add ui/web-config-image/package.json ui/web-config-image/CLAUDE.md
git commit -m "chore: scaffold web-config-image package"
```

---

### Task 2: Create the worker scaffold

**Files:**
- Create: `ui/web-config-image/worker/package.json`
- Create: `ui/web-config-image/worker/tsconfig.json`
- Create: `ui/web-config-image/worker/wrangler.toml`
- Create: `ui/web-config-image/worker/schema.sql`

**Step 1: Create worker/package.json**

```json
{
  "name": "image-worker",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260210.0",
    "typescript": "^5.9.3",
    "wrangler": "^4.64.0"
  }
}
```

**Step 2: Create worker/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"]
}
```

**Step 3: Create worker/wrangler.toml**

The worker name is `image-worker` and will be deployed to `image.stoumann.workers.dev`. A new D1 database needs to be created for this worker. Use `npx wrangler d1 create image-worker-db` to create it, then update the `database_id` in the toml.

```toml
name = "image-worker"
main = "src/index.ts"
compatibility_date = "2025-02-01"

[[d1_databases]]
binding = "DB"
database_name = "image-worker-db"
database_id = "REPLACE_AFTER_CREATION"
```

**Step 4: Create worker/schema.sql**

Uses a generic `source` column to store the preset name. No preset-specific columns.

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  daily_limit INTEGER DEFAULT 50,
  monthly_limit INTEGER DEFAULT 500,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_log(user_id, created_at);
```

**Step 5: Commit**

```bash
git add ui/web-config-image/worker/
git commit -m "chore: scaffold image worker with config files"
```

---

### Task 3: Create worker types and preset registry

**Files:**
- Create: `ui/web-config-image/worker/src/types.ts`
- Create: `ui/web-config-image/worker/src/presets.ts`

**Step 1: Create worker/src/types.ts**

```typescript
export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export interface ErrorResponse {
  error: string;
  code: ErrorCode;
}

export type ErrorCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "INVALID_IMAGE_TYPE"
  | "IMAGE_TOO_LARGE"
  | "NO_IMAGE"
  | "INVALID_URL"
  | "INVALID_PRESET"
  | "FETCH_FAILED"
  | "VISION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiKeyRow {
  id: string;
  key_hash: string;
  name: string;
  daily_limit: number;
  monthly_limit: number;
  is_active: number;
  created_at: string;
}

export interface PresetConfig {
  systemPrompt: string;
  maxTokens: number;
  parseResponse: (raw: string) => unknown;
}

export interface VisionSuccess {
  success: true;
  result: unknown;
  inputTokens: number;
  outputTokens: number;
}

export interface VisionError {
  success: false;
  error: string;
}

export type VisionResult = VisionSuccess | VisionError;
```

**Step 2: Create worker/src/presets.ts**

This is the core of the unified design. Each preset is a named entry with its own prompt and parser.

```typescript
import { PresetConfig } from "./types.js";

const ALT_MAX = 125;
const LONGDESC_MAX = 512;

function truncateAtWord(text: string, maxLength: number): string {
  let result = text.trim();
  if (result.length > maxLength) {
    const truncated = result.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(" ");
    result = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
  return result;
}

function stripMarkdownFences(text: string): string {
  const raw = text.trim();
  const fenceMatch = raw.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : raw;
}

export const presets: Record<string, PresetConfig> = {
  alttext: {
    systemPrompt: `You generate image descriptions for web accessibility.
Return a JSON object with exactly two fields:
- "alt": A concise alt text, max ${ALT_MAX} characters. One short sentence naming the primary subject and its most essential attribute.
- "longdesc": A fuller description, max ${LONGDESC_MAX} characters. Two to three sentences covering the subject, setting, mood, colors, and spatial composition.

Rules:
- Return ONLY valid JSON — no markdown fencing, no extra text
- Identify recognizable public figures (politicians, heads of state, celebrities, athletes, etc.) by their full name
- Do not start either field with "Image of", "Photo of", "Picture of", or similar prefixes
- Stay within the character limits specified for each field`,
    maxTokens: 500,
    parseResponse(raw: string) {
      const json = JSON.parse(stripMarkdownFences(raw));
      if (!json.alt || !json.longdesc) {
        throw new Error("Response missing alt or longdesc field");
      }
      return {
        alt: truncateAtWord(json.alt, ALT_MAX),
        longdesc: truncateAtWord(json.longdesc, LONGDESC_MAX),
      };
    },
  },

  food: {
    systemPrompt: `You are a food ingredient identifier. Analyze the photo and return ONLY a JSON array of food items you can identify. Be specific about each item (e.g., "red bell pepper" not "vegetable", "sourdough bread" not "bread").

Rules:
- Return ONLY valid JSON, no other text
- Array of objects: [{"item": "...", "quantity": "..."}]
- Consolidate duplicates into a single entry. If you see 2 whole tomatoes and 2 halves, return ONE entry: {"item": "tomato", "quantity": "3"}. If you see 2 whole bell peppers and 1 halved, return {"item": "red bell pepper", "quantity": "2.5"}.
- quantity must be a single number or numeric estimate (e.g., "3", "2.5", "0.5", "12"). Use weight in grams only when count is impractical (e.g., "200g" for a block of cheese, "handful" for herbs).
- If no food items are visible, return []
- Maximum 30 items
- Ignore non-food items`,
    maxTokens: 400,
    parseResponse(raw: string) {
      const ingredients = JSON.parse(stripMarkdownFences(raw));
      return { ingredients };
    },
  },
};
```

**Step 3: Commit**

```bash
git add ui/web-config-image/worker/src/types.ts ui/web-config-image/worker/src/presets.ts
git commit -m "feat: add types and preset registry for alttext and food"
```

---

### Task 4: Create worker shared services (auth, image, usage)

These files are nearly identical to the existing `web-config-alt` worker. Copy and adapt.

**Files:**
- Create: `ui/web-config-image/worker/src/middleware/auth.ts`
- Create: `ui/web-config-image/worker/src/services/image.ts`
- Create: `ui/web-config-image/worker/src/db/usage.ts`

**Step 1: Create worker/src/middleware/auth.ts**

Identical to `ui/web-config-alt/worker/src/middleware/auth.ts`. Copy verbatim.

**Step 2: Create worker/src/services/image.ts**

Identical to `ui/web-config-alt/worker/src/services/image.ts`. Copy verbatim — it has both `fetchImageFromUrl` and the inline FormData validation pattern.

**Step 3: Create worker/src/db/usage.ts**

Same as `ui/web-config-alt/worker/src/db/usage.ts` but drop the `charCount` parameter — the `source` column now stores the preset name.

```typescript
import { Env } from "../types.js";

const INPUT_COST_PER_TOKEN = 0.80 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 4.00 / 1_000_000;

export async function logUsage(
  env: Env,
  userId: string,
  source: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const estimatedCost =
    inputTokens * INPUT_COST_PER_TOKEN +
    outputTokens * OUTPUT_COST_PER_TOKEN;

  await env.DB.prepare(
    `INSERT INTO usage_log (user_id, source, input_tokens, output_tokens, estimated_cost_usd)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(userId, source, inputTokens, outputTokens, estimatedCost)
    .run();
}

export async function getTodayCount(env: Env, userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const result = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM usage_log WHERE user_id = ? AND created_at >= ?"
  ).bind(userId, today).first<{ count: number }>();
  return result?.count ?? 0;
}
```

**Step 4: Commit**

```bash
git add ui/web-config-image/worker/src/middleware/ ui/web-config-image/worker/src/services/ ui/web-config-image/worker/src/db/
git commit -m "feat: add auth, image, and usage services"
```

---

### Task 5: Create vision service and analyze handler

**Files:**
- Create: `ui/web-config-image/worker/src/services/vision.ts`
- Create: `ui/web-config-image/worker/src/handlers/analyze.ts`
- Create: `ui/web-config-image/worker/src/handlers/health.ts`

**Step 1: Create worker/src/services/vision.ts**

This is the generic vision service that accepts a preset config, calls Claude, and uses the preset's parser.

```typescript
import { VisionResult, PresetConfig } from "../types.js";

export async function analyzeImage(
  base64: string,
  mediaType: string,
  apiKey: string,
  preset: PresetConfig
): Promise<VisionResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: preset.maxTokens,
      system: preset.systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { success: false, error: `Anthropic API error ${response.status}: ${body}` };
  }

  const data = await response.json() as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const textBlock = data.content.find(b => b.type === "text");
  if (!textBlock?.text) {
    return { success: false, error: "No text response from Claude" };
  }

  try {
    const result = preset.parseResponse(textBlock.text);
    return {
      success: true,
      result,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to parse response: ${message}` };
  }
}
```

**Step 2: Create worker/src/handlers/analyze.ts**

Reads `preset` from the JSON body, validates it against the registry, then follows the same pipeline as before.

```typescript
import { Env, ErrorResponse, ErrorCode } from "../types.js";
import { presets } from "../presets.js";
import { authenticate } from "../middleware/auth.js";
import { fetchImageFromUrl } from "../services/image.js";
import { analyzeImage } from "../services/vision.js";
import { logUsage, getTodayCount } from "../db/usage.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth.success) {
    return Response.json(
      { error: auth.error, code: auth.code } satisfies ErrorResponse,
      { status: auth.status }
    );
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  let image: { success: true; base64: string; mediaType: string } | { success: false; error: string; code: ErrorCode };
  let presetName: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    presetName = (formData.get("preset") as string) ?? "";
    const file = formData.get("image") as unknown;
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "No image file provided", code: "NO_IMAGE" } satisfies ErrorResponse,
        { status: 400 }
      );
    }
    image = await validateAndEncodeFile(file);
  } else {
    let body: { url?: string; preset?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body", code: "NO_IMAGE" } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    presetName = body.preset ?? "";

    if (!body.url) {
      return Response.json(
        { error: "Missing 'url' in JSON body", code: "NO_IMAGE" } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    image = await fetchImageFromUrl(body.url);
  }

  if (!presetName || !presets[presetName]) {
    return Response.json(
      { error: `Invalid preset: "${presetName}". Available: ${Object.keys(presets).join(", ")}`, code: "INVALID_PRESET" } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  if (!image.success) {
    return Response.json(
      { error: image.error, code: image.code } satisfies ErrorResponse,
      { status: image.code === "FETCH_FAILED" ? 502 : 400 }
    );
  }

  const preset = presets[presetName];
  const vision = await analyzeImage(
    image.base64,
    image.mediaType,
    env.ANTHROPIC_API_KEY,
    preset
  );
  if (!vision.success) {
    return Response.json(
      { error: vision.error, code: "VISION_ERROR" } satisfies ErrorResponse,
      { status: 502 }
    );
  }

  await logUsage(
    env,
    auth.apiKey.id,
    presetName,
    vision.inputTokens,
    vision.outputTokens,
  );

  const requestsToday = await getTodayCount(env, auth.apiKey.id);

  return Response.json({
    preset: presetName,
    result: vision.result,
    usage: {
      requests_today: requestsToday,
      daily_limit: auth.apiKey.daily_limit,
    },
  });
}

async function validateAndEncodeFile(file: File): Promise<
  { success: true; base64: string; mediaType: string } |
  { success: false; error: string; code: ErrorCode }
> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      success: false,
      error: `Invalid image type: ${file.type}. Accepted: jpeg, png, webp, gif`,
      code: "INVALID_IMAGE_TYPE",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`,
      code: "IMAGE_TOO_LARGE",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { success: true, base64: btoa(binary), mediaType: file.type };
}
```

**Step 3: Create worker/src/handlers/health.ts**

```typescript
import { Env } from "../types.js";

export async function handleHealth(env: Env): Promise<Response> {
  try {
    await env.DB.prepare("SELECT 1").run();
    return Response.json({ status: "ok" });
  } catch (e) {
    return Response.json(
      { status: "error", message: "Database connection failed" },
      { status: 503 }
    );
  }
}
```

**Step 4: Commit**

```bash
git add ui/web-config-image/worker/src/services/vision.ts ui/web-config-image/worker/src/handlers/
git commit -m "feat: add vision service and analyze/health handlers with preset support"
```

---

### Task 6: Create worker router

**Files:**
- Create: `ui/web-config-image/worker/src/index.ts`

**Step 1: Create worker/src/index.ts**

```typescript
import { Env } from "./types.js";
import { handleAnalyze } from "./handlers/analyze.js";
import { handleHealth } from "./handlers/health.js";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    let response: Response;

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        response = await handleHealth(env);
      } else if (url.pathname === "/analyze" && request.method === "POST") {
        response = await handleAnalyze(request, env);
      } else {
        response = Response.json(
          { error: "Not found" },
          { status: 404 }
        );
      }
    } catch (e) {
      console.error("Unhandled error:", e);
      response = Response.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    return withCors(response);
  },
};
```

**Step 2: Run type check**

```bash
cd ui/web-config-image/worker && npm install && npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add ui/web-config-image/worker/src/index.ts
git commit -m "feat: add worker router with CORS"
```

---

### Task 7: Create the web component

**Files:**
- Create: `ui/web-config-image/src/index.js`

**Step 1: Create the component**

The component has a `preset` attribute, a shared shell (generate button, spinner, error), and preset-specific renderers. The food renderer uses safe DOM creation methods (no innerHTML) to avoid XSS.

```javascript
import { adoptSharedStyles } from '@browser.style/web-config-shared';

const _localSheet = new CSSStyleSheet();
const _localReady = _localSheet.replace(`
	:host {
		display: grid;
		gap: var(--web-config-gap);
	}
	label {
		display: grid;
		font-size: small;
		font-weight: 500;
		gap: 0.25em;
	}
	label small {
		color: var(--web-config-color-muted, #666);
		margin-inline-start: 0.5ch;
	}
	textarea {
		font: inherit;
		min-height: 2lh;
		padding: var(--web-config-gap);
		resize: vertical;
		width: 100%;
	}
	textarea[data-longdesc] {
		min-height: 4lh;
	}
	table {
		border-collapse: collapse;
		font-size: small;
		width: 100%;
	}
	th, td {
		border: 1px solid var(--web-config-bdc, #ddd);
		padding: 0.35em 0.75em;
		text-align: start;
	}
	th {
		background: var(--web-config-bg-muted, #f5f5f5);
		font-weight: 600;
	}
	button[data-generate] {
		justify-self: end;
	}
	.error,
	.spinner {
		display: none;
	}
	.error.active {
		display: block;
		background: var(--web-config-status-danger-bg);
		border: 1px solid var(--web-config-status-danger);
		border-radius: var(--web-config-bdrs);
		color: var(--web-config-status-danger);
		padding: var(--web-config-gap);
		font-size: small;
	}
	.spinner.active {
		display: block;
		text-align: center;
		padding: var(--web-config-gap) 0;
	}
	.spinner.active::after {
		content: '';
		display: inline-block;
		width: 20px;
		height: 20px;
		border: 2px solid var(--web-config-bdc);
		border-top-color: var(--web-config-accent-dark);
		border-radius: 50%;
		animation: wci-spin 0.7s linear infinite;
	}
	@keyframes wci-spin {
		to { transform: rotate(360deg); }
	}
`);

function createEl(tag, attrs = {}, text) {
	const el = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	if (text) el.textContent = text;
	return el;
}

const renderers = {
	alttext: {
		render(root) {
			const frag = document.createDocumentFragment();

			const label1 = createEl('label');
			const span1 = createEl('span');
			span1.textContent = 'Alt text ';
			span1.appendChild(createEl('small', {}, '(max 125 chars)'));
			label1.appendChild(span1);
			label1.appendChild(createEl('textarea', { 'data-alt': '', placeholder: 'Alt text will appear here...', maxlength: '125' }));
			frag.appendChild(label1);

			const label2 = createEl('label');
			const span2 = createEl('span');
			span2.textContent = 'Long description ';
			span2.appendChild(createEl('small', {}, '(max 512 chars)'));
			label2.appendChild(span2);
			label2.appendChild(createEl('textarea', { 'data-longdesc': '', placeholder: 'Long description will appear here...', maxlength: '512' }));
			frag.appendChild(label2);

			root.appendChild(frag);
		},
		populate(root, result) {
			const alt = root.querySelector('[data-alt]');
			const longdesc = root.querySelector('[data-longdesc]');
			if (alt) alt.value = result.alt || '';
			if (longdesc) longdesc.value = result.longdesc || '';
		},
		getValue(root) {
			const alt = root.querySelector('[data-alt]')?.value ?? '';
			const longdesc = root.querySelector('[data-longdesc]')?.value ?? '';
			return JSON.stringify({ alt, longdesc });
		},
		bindEvents(root, emitChange) {
			root.querySelector('[data-alt]')?.addEventListener('input', emitChange);
			root.querySelector('[data-longdesc]')?.addEventListener('input', emitChange);
		},
	},
	food: {
		render(root) {
			const table = createEl('table');
			const thead = createEl('thead');
			const headRow = createEl('tr');
			headRow.appendChild(createEl('th', {}, 'Item'));
			headRow.appendChild(createEl('th', {}, 'Qty'));
			thead.appendChild(headRow);
			table.appendChild(thead);
			table.appendChild(createEl('tbody', { 'data-food': '' }));
			root.appendChild(table);
		},
		populate(root, result) {
			const tbody = root.querySelector('[data-food]');
			if (!tbody) return;
			tbody.replaceChildren();
			const items = result.ingredients || [];
			if (!items.length) {
				const row = createEl('tr');
				row.appendChild(createEl('td', { colspan: '2' }, 'No food items detected'));
				tbody.appendChild(row);
				return;
			}
			for (const i of items) {
				const row = createEl('tr');
				row.appendChild(createEl('td', {}, i.item));
				row.appendChild(createEl('td', {}, i.quantity));
				tbody.appendChild(row);
			}
		},
		getValue(root) {
			const tbody = root.querySelector('[data-food]');
			if (!tbody) return '[]';
			const rows = tbody.querySelectorAll('tr');
			const items = [];
			for (const row of rows) {
				const cells = row.querySelectorAll('td');
				if (cells.length === 2) {
					items.push({ item: cells[0].textContent, quantity: cells[1].textContent });
				}
			}
			return JSON.stringify(items);
		},
		bindEvents() {},
	},
};

class WebConfigImage extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['preset'];

	#src = '';
	#isGenerating = false;
	#result = null;
	#els = {};

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
		this.#loadStyles();
	}

	async #loadStyles() {
		await adoptSharedStyles(this.shadowRoot);
		await _localReady;
		this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, _localSheet];
	}

	get preset() { return this.getAttribute('preset') || ''; }

	get src() { return this.#src; }
	set src(v) {
		this.#src = v;
		this.#updateButton();
	}

	get value() {
		const renderer = renderers[this.preset];
		if (!renderer) return '';
		return renderer.getValue(this.shadowRoot);
	}
	set value(v) {
		this._internals.setFormValue(v || '');
	}

	get result() { return this.#result; }
	set result(v) {
		this.#result = v;
		const renderer = renderers[this.preset];
		if (renderer && v) renderer.populate(this.shadowRoot, v);
		this._internals.setFormValue(this.value);
	}

	get generating() { return this.#isGenerating; }
	set generating(v) {
		this.#isGenerating = !!v;
		this.#updateButton();
		const spinner = this.shadowRoot.querySelector('.spinner');
		if (spinner) spinner.classList.toggle('active', !!v);
	}

	showError(msg) {
		const el = this.shadowRoot.querySelector('.error');
		if (!el) return;
		el.textContent = msg;
		el.classList.add('active');
	}

	connectedCallback() {
		this.#render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'preset' && this.isConnected) this.#render();
	}

	#render() {
		const root = this.shadowRoot;
		root.replaceChildren();

		const renderer = renderers[this.preset];
		if (renderer) {
			renderer.render(root);
		} else {
			root.appendChild(createEl('p', {}, `Unknown preset: "${this.preset}"`));
		}

		root.appendChild(createEl('button', { type: 'button', 'data-generate': '', 'data-action': '', disabled: '' }, 'Generate'));
		root.appendChild(createEl('div', { class: 'spinner' }));
		root.appendChild(createEl('div', { class: 'error' }));

		this.#els = {
			btn: root.querySelector('[data-generate]'),
		};

		this.#updateButton();

		this.#els.btn.addEventListener('click', () => {
			if (this.#isGenerating || !this.#src) return;
			this.generating = true;
			root.querySelector('.error')?.classList.remove('active');
			this.dispatchEvent(new CustomEvent('requestGenerate', {
				bubbles: true,
				composed: true,
			}));
		});

		if (renderer) {
			renderer.bindEvents(root, () => {
				this._internals.setFormValue(this.value);
				this.dispatchEvent(new CustomEvent('change', {
					bubbles: true,
					composed: true,
					detail: JSON.parse(this.value),
				}));
			});
		}

		if (this.#result) {
			renderer?.populate(root, this.#result);
		}
	}

	#updateButton() {
		if (this.#els.btn) this.#els.btn.disabled = !this.#src || this.#isGenerating;
	}
}

customElements.define('web-config-image', WebConfigImage);
```

**Step 2: Commit**

```bash
git add ui/web-config-image/src/index.js
git commit -m "feat: add web-config-image component with alttext and food renderers"
```

---

### Task 8: Create demo page

**Files:**
- Create: `ui/web-config-image/index.html`

**Step 1: Create index.html**

The demo page shows both presets side by side. It uses event delegation on `requestGenerate` to handle both editors with the same code.

```html
<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>Web Config Image</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="Web Config Image - AI-powered image analysis with presets">
	<meta name="view-transition" content="same-origin">
	<link rel="stylesheet" href="/ui/base/index.css">
	<script type="importmap">
		{
			"imports": {
				"@browser.style/web-config-shared": "../web-config-shared/index.js"
			}
		}
	</script>
	<style>
		.grid { display: grid; gap: 2ch; grid-template-columns: 1fr 1fr; }
		@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
	</style>
</head>
<body>
	<h1>Web Config: Image Analysis</h1>
	<p>AI-powered image analysis with presets. Configure the worker URL and API key, provide an image URL, then click Generate on either preset.</p>

	<fieldset style="margin-block-end:2ch;">
		<label>
			Worker URL
			<input type="url" id="workerUrl" placeholder="https://image.stoumann.workers.dev" value="http://localhost:8787">
		</label>
		<label>
			API Key
			<input type="password" id="apiKey" placeholder="Enter your API key">
		</label>
		<label>
			Image URL
			<input type="url" id="imageSrc" placeholder="https://example.com/photo.jpg" value="https://picsum.photos/id/237/400/300.jpg">
		</label>
	</fieldset>

	<div class="grid">
		<fieldset>
			<legend>Alt Text</legend>
			<web-config-image id="altEditor" preset="alttext"></web-config-image>
		</fieldset>
		<fieldset>
			<legend>Food Recognition</legend>
			<web-config-image id="foodEditor" preset="food"></web-config-image>
		</fieldset>
	</div>

	<script type="module">
		import './src/index.js';

		const workerUrlInput = document.getElementById('workerUrl');
		const apiKeyInput = document.getElementById('apiKey');
		const imageSrcInput = document.getElementById('imageSrc');

		workerUrlInput.value = localStorage.getItem('wci-worker-url') || workerUrlInput.value;
		apiKeyInput.value = localStorage.getItem('wci-api-key') || '';

		function update() {
			localStorage.setItem('wci-worker-url', workerUrlInput.value);
			localStorage.setItem('wci-api-key', apiKeyInput.value);
			document.querySelectorAll('web-config-image').forEach(el => {
				el.src = imageSrcInput.value;
			});
		}

		workerUrlInput.addEventListener('input', update);
		apiKeyInput.addEventListener('input', update);
		imageSrcInput.addEventListener('input', update);

		document.addEventListener('requestGenerate', async (e) => {
			const editor = e.target;
			const workerUrl = workerUrlInput.value;
			const apiKey = apiKeyInput.value;
			const src = imageSrcInput.value;

			if (!workerUrl || !src) {
				editor.showError('Worker URL and Image URL are required.');
				editor.generating = false;
				return;
			}

			try {
				const endpoint = workerUrl.replace(/\/+$/, '') + '/analyze';
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-API-Key': apiKey,
					},
					body: JSON.stringify({ url: src, preset: editor.preset }),
				});

				if (!response.ok) {
					const text = await response.text();
					throw new Error('HTTP ' + response.status + ': ' + text);
				}

				const data = await response.json();
				editor.result = data.result;
			} catch (err) {
				editor.showError(err.message);
			} finally {
				editor.generating = false;
			}
		});

		update();
	</script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add ui/web-config-image/index.html
git commit -m "feat: add demo page with alttext and food presets side by side"
```

---

### Task 9: Create AGENTS.md documentation

**Files:**
- Create: `ui/web-config-image/AGENTS.md`

**Step 1: Write AGENTS.md**

Document the component API, worker API, preset registry pattern, and file structure. Follow the pattern from `ui/web-config-alt/AGENTS.md` but updated for the new multi-preset architecture.

**Step 2: Commit**

```bash
git add ui/web-config-image/AGENTS.md
git commit -m "docs: add AGENTS.md for web-config-image"
```

---

### Task 10: Worker deployment setup

**Step 1: Create D1 database**

```bash
cd ui/web-config-image/worker
npx wrangler d1 create image-worker-db
```

Copy the `database_id` from the output and update `wrangler.toml`.

**Step 2: Apply schema**

```bash
npx wrangler d1 execute image-worker-db --file=./schema.sql --local
```

**Step 3: Set Anthropic API key secret**

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

**Step 4: Create .dev.vars for local development**

```
ANTHROPIC_API_KEY=sk-ant-...
```

**Step 5: Test locally**

```bash
npx wrangler dev
```

Then test with:
```bash
curl -X POST http://localhost:8787/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"url": "https://picsum.photos/id/237/400/300.jpg", "preset": "alttext"}'
```

**Step 6: Commit wrangler.toml with real database ID**

```bash
git add ui/web-config-image/worker/wrangler.toml
git commit -m "chore: configure D1 database for image worker"
```

---

## File Summary

| File | Source |
|------|--------|
| `ui/web-config-image/package.json` | New |
| `ui/web-config-image/CLAUDE.md` | New |
| `ui/web-config-image/AGENTS.md` | New |
| `ui/web-config-image/index.html` | New |
| `ui/web-config-image/src/index.js` | New (based on web-config-alt component) |
| `ui/web-config-image/worker/package.json` | New (based on web-config-alt worker) |
| `ui/web-config-image/worker/tsconfig.json` | Copied from web-config-alt |
| `ui/web-config-image/worker/wrangler.toml` | New |
| `ui/web-config-image/worker/schema.sql` | New (simplified from web-config-alt) |
| `ui/web-config-image/worker/src/index.ts` | Copied from web-config-alt |
| `ui/web-config-image/worker/src/types.ts` | Extended from web-config-alt |
| `ui/web-config-image/worker/src/presets.ts` | New — preset registry |
| `ui/web-config-image/worker/src/middleware/auth.ts` | Copied from web-config-alt |
| `ui/web-config-image/worker/src/services/image.ts` | Copied from web-config-alt |
| `ui/web-config-image/worker/src/services/vision.ts` | Rewritten — generic with preset param |
| `ui/web-config-image/worker/src/handlers/analyze.ts` | Rewritten — reads preset from body |
| `ui/web-config-image/worker/src/handlers/health.ts` | Copied from web-config-alt |
| `ui/web-config-image/worker/src/db/usage.ts` | Simplified from web-config-alt |
