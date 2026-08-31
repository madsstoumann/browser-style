/* Zaraz config-as-code — pull/push/publish the zone's Zaraz configuration.
 *
 * WHY: Zaraz (GA4 pageview tracking + consent banner + bot blocking for
 * v4.browser.style) is configured on the Cloudflare zone, not in this repo's
 * pages — the edge injects the script into every HTML response. Wrangler has
 * no Zaraz support, so the only automation surface is the Zaraz Config API.
 * This script keeps the live config mirrored in scripts/zaraz/config.json so
 * changes are reviewable, diffable and restorable like any other source.
 *
 * The loop: dashboard change? -> `pull` and commit. Repo-side change? edit
 * config.json -> `push` (lands in preview when the workflow is preview) ->
 * `publish -m "message"`. Full setup + verification: docs/zaraz.md.
 *
 * Auth (never written to disk):
 *   export CLOUDFLARE_API_TOKEN=…   # token with zone permission "Zaraz: Edit"
 *   export CLOUDFLARE_ZONE_ID=…     # browser.style zone id (dashboard Overview)
 *
 * Usage:
 *   node scripts/zaraz/zaraz.js pull            # GET  live config -> config.json
 *   node scripts/zaraz/zaraz.js push            # PUT  config.json -> zone (preview)
 *   node scripts/zaraz/zaraz.js publish -m "…"  # POST publish preview -> live
 *   node scripts/zaraz/zaraz.js status          # workflow + recent history
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const here = dirname(new URL(import.meta.url).pathname);
const CONFIG_FILE = join(here, 'config.json');

const token = process.env.CLOUDFLARE_API_TOKEN;
const zone = process.env.CLOUDFLARE_ZONE_ID;
if (!token || !zone) {
	console.error('Missing CLOUDFLARE_API_TOKEN and/or CLOUDFLARE_ZONE_ID in the environment.');
	console.error('Token needs the zone permission "Zaraz: Edit". See docs/zaraz.md.');
	process.exit(1);
}

const BASE = `https://api.cloudflare.com/client/v4/zones/${zone}/settings/zaraz`;

const api = async (path, init = {}) => {
	const res = await fetch(`${BASE}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...init.headers,
		},
	});
	let body;
	try { body = await res.json(); } catch { body = null; }
	if (!res.ok || body?.success === false) {
		console.error(`${init.method || 'GET'} ${path} -> HTTP ${res.status}`);
		console.error(JSON.stringify(body?.errors ?? body, null, 2));
		process.exit(1);
	}
	return body?.result ?? body;
};

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
	case 'pull': {
		const config = await api('/config');
		writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, '\t')}\n`);
		console.log(`Wrote ${CONFIG_FILE} (zarazVersion ${config.zarazVersion ?? '?'}). Review + commit it.`);
		break;
	}
	case 'push': {
		const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
		const result = await api('/config', { method: 'PUT', body: JSON.stringify(config) });
		console.log(`Pushed config (zarazVersion ${result.zarazVersion ?? '?'}).`);
		const workflow = await api('/workflow');
		console.log(workflow === 'preview'
			? 'Workflow is "preview" — run `publish -m "…"` to go live.'
			: `Workflow is "${workflow}" — the change is LIVE.`);
		break;
	}
	case 'publish': {
		const m = rest.indexOf('-m');
		const message = m !== -1 ? rest[m + 1] : rest.join(' ').trim();
		if (!message) {
			console.error('A description is required: publish -m "what changed"');
			process.exit(1);
		}
		await api('/publish', { method: 'POST', body: JSON.stringify(message) });
		console.log(`Published: ${message}`);
		break;
	}
	case 'status': {
		const workflow = await api('/workflow');
		console.log(`Workflow: ${workflow}`);
		const history = await api('/history?limit=5&sortField=updated_at&sortOrder=DESC');
		for (const h of Array.isArray(history) ? history : []) {
			console.log(`  #${h.id}  ${h.updatedAt ?? h.createdAt ?? ''}  ${h.userId ?? ''}  ${h.description ?? ''}`);
		}
		break;
	}
	default:
		console.error('Usage: node scripts/zaraz/zaraz.js <pull|push|publish -m "msg"|status>');
		process.exit(1);
}
