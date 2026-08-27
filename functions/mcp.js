/**
 * /mcp — stateless Streamable-HTTP MCP server (proof of concept).
 * Cloudflare Pages Function; fronted ONLY on /mcp via /_routes.json.
 * No sessions (no Mcp-Session-Id issued), no SSE, no auth. Docs: docs/mcp-poc.md
 */

const SERVER_INFO = { name: 'browser-style-venue', title: 'browser.style Studio (demo venue)', version: '0.1.0' };
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const LATEST_PROTOCOL = '2025-06-18';

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
	'Access-Control-Max-Age': '86400',
};

/* Dummy data. Dates are ISO YYYY-MM-DD; hours are local venue time. */
const VENUE = {
	name: 'browser.style Studio',
	timezone: 'Europe/Copenhagen',
	weeklyHours: {
		mon: null,
		tue: { open: '10:00', close: '18:00' },
		wed: { open: '10:00', close: '18:00' },
		thu: { open: '10:00', close: '20:00' },
		fri: { open: '10:00', close: '22:00' },
		sat: { open: '09:00', close: '22:00' },
		sun: { open: '11:00', close: '16:00' },
	},
	/* Date-specific overrides beat weeklyHours. null = closed (holiday). */
	exceptions: {
		'2026-09-05': { open: '12:00', close: '23:59', note: 'Culture Night — extended hours' },
		'2026-12-24': null,
		'2026-12-25': null,
	},
	events: [
		{ id: 'css-live', name: 'CSS Live! — creative coding on stage', date: '2026-08-28', ticketsTotal: 120, ticketsAvailable: 14, price: '150 DKK' },
		{ id: 'grid-gala', name: 'The Grid Gala', date: '2026-09-05', ticketsTotal: 300, ticketsAvailable: 0, price: '250 DKK' },
		{ id: 'type-night', name: 'Typography Night', date: '2026-09-18', ticketsTotal: 80, ticketsAvailable: 62, price: '100 DKK' },
	],
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

class ToolInputError extends Error {}

/* Resolve an ISO date to hours; exceptions beat the weekly schedule. */
function hoursForDate(date) {
	const weekday = DAY_KEYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
	const slot = date in VENUE.exceptions ? VENUE.exceptions[date] : VENUE.weeklyHours[weekday];
	return slot === null
		? { date, weekday, closed: true }
		: { date, weekday, closed: false, open: slot.open, close: slot.close, ...(slot.note && { note: slot.note }) };
}

const TOOLS = [
	{
		name: 'get_opening_hours',
		description:
			`Get opening hours for ${VENUE.name} (timezone ${VENUE.timezone}). ` +
			'Pass "date" as an ISO date (YYYY-MM-DD) — resolve relative expressions like ' +
			'"this Friday" or "tomorrow" to a concrete ISO date yourself before calling. ' +
			'Omit "date" to get the full weekly schedule plus known holiday exceptions.',
		inputSchema: {
			type: 'object',
			properties: {
				date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'ISO date, e.g. 2026-08-28. Optional.' },
			},
		},
	},
	{
		name: 'check_ticket_availability',
		description:
			`Check ticket availability for events at ${VENUE.name} on a given date. ` +
			'Pass "date" as an ISO date (YYYY-MM-DD) — resolve relative expressions like ' +
			'"this Friday" yourself before calling. Optionally pass "event" (name or id, ' +
			'case-insensitive substring) to filter.',
		inputSchema: {
			type: 'object',
			properties: {
				date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'ISO date, e.g. 2026-08-28.' },
				event: { type: 'string', description: 'Event name or id to filter by. Optional.' },
			},
			required: ['date'],
		},
	},
];

function runGetOpeningHours({ date } = {}) {
	if (date !== undefined) {
		if (!ISO_DATE.test(date)) throw new ToolInputError(`"date" must be YYYY-MM-DD, got: ${JSON.stringify(date)}`);
		const h = hoursForDate(date);
		return {
			structured: h,
			text: h.closed
				? `${VENUE.name} is CLOSED on ${date} (${h.weekday}).`
				: `${VENUE.name} is open on ${date} (${h.weekday}) from ${h.open} to ${h.close} (${VENUE.timezone})${h.note ? ` — ${h.note}` : ''}.`,
		};
	}
	const structured = { weeklyHours: VENUE.weeklyHours, exceptions: VENUE.exceptions, timezone: VENUE.timezone };
	return { structured, text: `Weekly schedule for ${VENUE.name} (closed = null):\n${JSON.stringify(structured, null, 2)}` };
}

function runCheckTicketAvailability({ date, event } = {}) {
	if (!ISO_DATE.test(date ?? '')) throw new ToolInputError(`"date" is required and must be YYYY-MM-DD, got: ${JSON.stringify(date)}`);
	const filter = event?.toLowerCase();
	let matches = VENUE.events.filter((e) => e.date === date);
	if (filter) matches = matches.filter((e) => e.name.toLowerCase().includes(filter) || e.id.toLowerCase().includes(filter));
	if (matches.length === 0) {
		const upcoming = VENUE.events.filter((e) => e.date > date).map((e) => `${e.name} on ${e.date}`);
		return {
			structured: { date, events: [] },
			text: `No ${filter ? 'matching ' : ''}events at ${VENUE.name} on ${date}.` +
				(upcoming.length ? ` Upcoming events: ${upcoming.join('; ')}.` : ''),
		};
	}
	return {
		structured: { date, events: matches },
		text: matches
			.map((e) => e.ticketsAvailable > 0
				? `${e.name} on ${e.date}: ${e.ticketsAvailable} of ${e.ticketsTotal} tickets available at ${e.price}.`
				: `${e.name} on ${e.date}: SOLD OUT.`)
			.join('\n'),
	};
}

const json = (body, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const rpcResult = (id, result) => json({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export async function onRequestPost({ request }) {
	let msg;
	try { msg = await request.json(); }
	catch { return rpcError(null, -32700, 'Parse error'); }

	if (Array.isArray(msg)) return rpcError(null, -32600, 'JSON-RPC batching is not supported (removed in MCP 2025-06-18)');
	if (msg?.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(msg?.id, -32600, 'Invalid Request');

	/* Notifications (no id): accept and ignore — stateless server, no bookkeeping. */
	if (msg.id === undefined || msg.id === null) return new Response(null, { status: 202, headers: CORS });

	switch (msg.method) {
		case 'initialize': {
			const requested = msg.params?.protocolVersion;
			return rpcResult(msg.id, {
				protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : LATEST_PROTOCOL,
				capabilities: { tools: {} },
				serverInfo: SERVER_INFO,
				instructions:
					'Demo MCP server with STATIC DUMMY DATA for a fictional venue on v4.browser.style. ' +
					'All dates must be ISO YYYY-MM-DD; resolve relative dates before calling tools.',
			});
		}
		case 'ping':
			return rpcResult(msg.id, {});
		case 'tools/list':
			return rpcResult(msg.id, { tools: TOOLS });
		case 'tools/call': {
			const { name, arguments: args } = msg.params ?? {};
			const impl = { get_opening_hours: runGetOpeningHours, check_ticket_availability: runCheckTicketAvailability }[name];
			if (!impl) return rpcError(msg.id, -32602, `Unknown tool: ${name}`);
			try {
				const { text, structured } = impl(args);
				return rpcResult(msg.id, { content: [{ type: 'text', text }], structuredContent: structured, isError: false });
			} catch (err) {
				if (err instanceof ToolInputError)
					return rpcResult(msg.id, { content: [{ type: 'text', text: err.message }], isError: true });
				throw err;
			}
		}
		default:
			return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
	}
}

export function onRequestOptions() {
	return new Response(null, { status: 204, headers: CORS });
}

/* Fallback for GET/DELETE/etc — no SSE stream, no session to delete. */
export function onRequest() {
	return new Response('Method Not Allowed. POST JSON-RPC to this endpoint (MCP Streamable HTTP, stateless).', {
		status: 405,
		headers: { Allow: 'POST, OPTIONS', 'Content-Type': 'text/plain', ...CORS },
	});
}
