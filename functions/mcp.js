/**
 * /mcp — stateless Streamable-HTTP MCP server (proof of concept).
 * Cloudflare Pages Function; fronted ONLY on /mcp via /_routes.json.
 * Thin wrapper over the static /api/venue-availability.json (ASSETS binding).
 * No sessions (no Mcp-Session-Id issued), no SSE, no auth. Docs: docs/mcp-poc.md
 */

const SERVER_INFO = { name: 'browser-style-venue', title: 'browser.style Studio (demo venue)', version: '0.2.0' };
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const LATEST_PROTOCOL = '2025-06-18';
const DATA_PATH = '/api/venue-availability.json';

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
	'Access-Control-Max-Age': '86400',
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

class ToolInputError extends Error {}

let venuePromise;
const loadVenue = (env, requestUrl) =>
	(venuePromise ??= env.ASSETS.fetch(new URL(DATA_PATH, requestUrl)).then((r) => r.json()));

/* Resolve an ISO date to hours; exceptions beat the weekly schedule. Slots are [open, close, note?]. */
function hoursForDate(venue, date) {
	const weekday = DAY_KEYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
	const slot = date in venue.exceptions ? venue.exceptions[date] : venue.weeklyHours[weekday];
	return slot === null
		? { date, weekday, closed: true }
		: { date, weekday, closed: false, open: slot[0], close: slot[1], ...(slot[2] && { note: slot[2] }) };
}

const inWindow = (venue, date) => date >= venue.window[0] && date <= venue.window[1];
const ticketsFor = (venue, date) => venue.tickets[date.slice(0, 7)]?.[Number(date.slice(8)) - 1];

const TOOLS = [
	{
		name: 'get_opening_hours',
		description:
			'Get opening hours for browser.style Studio (timezone Europe/Copenhagen). ' +
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
			'Check day-ticket availability (and any named events) at browser.style Studio ' +
			'on a given date. Data covers 2026-08-01 to 2027-08-31, per day. ' +
			'Pass "date" as an ISO date (YYYY-MM-DD) — resolve relative expressions like ' +
			'"this Friday" yourself before calling. Optionally pass "event" (name or id, ' +
			'case-insensitive substring) to filter the named events.',
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

function runGetOpeningHours(venue, { date } = {}) {
	if (date !== undefined) {
		if (!ISO_DATE.test(date)) throw new ToolInputError(`"date" must be YYYY-MM-DD, got: ${JSON.stringify(date)}`);
		const h = hoursForDate(venue, date);
		return {
			structured: h,
			text: h.closed
				? `${venue.venue} is CLOSED on ${date} (${h.weekday}).`
				: `${venue.venue} is open on ${date} (${h.weekday}) from ${h.open} to ${h.close} (${venue.timezone})${h.note ? ` — ${h.note}` : ''}.`,
		};
	}
	const structured = { weeklyHours: venue.weeklyHours, exceptions: venue.exceptions, timezone: venue.timezone };
	return { structured, text: `Weekly schedule for ${venue.venue} (closed = null; slots are [open, close, note?]):\n${JSON.stringify(structured, null, 2)}` };
}

function runCheckTicketAvailability(venue, { date, event } = {}) {
	if (!ISO_DATE.test(date ?? '')) throw new ToolInputError(`"date" is required and must be YYYY-MM-DD, got: ${JSON.stringify(date)}`);
	const filter = event?.toLowerCase();
	let events = venue.events.filter((e) => e.date === date);
	if (filter) events = events.filter((e) => e.name.toLowerCase().includes(filter) || e.id.toLowerCase().includes(filter));
	const eventLines = events.map((e) => e.ticketsAvailable > 0
		? `${e.name} on ${e.date}: ${e.ticketsAvailable} of ${e.ticketsTotal} tickets available at ${e.price}.`
		: `${e.name} on ${e.date}: SOLD OUT.`);

	if (!inWindow(venue, date)) {
		return {
			structured: { date, events, dayTickets: null },
			text: [`No availability data for ${date} (data covers ${venue.window[0]} to ${venue.window[1]}).`, ...eventLines].join('\n'),
		};
	}
	const h = hoursForDate(venue, date);
	const dayTickets = ticketsFor(venue, date) ?? 0;
	const dayLine = h.closed
		? `${venue.venue} is CLOSED on ${date} (${h.weekday}) — no tickets sold.`
		: dayTickets === 0
			? `${date} (${h.weekday}): SOLD OUT — 0 day tickets left.`
			: dayTickets < 5
				? `${date} (${h.weekday}): only ${dayTickets} day ticket${dayTickets === 1 ? '' : 's'} left.`
				: `${date} (${h.weekday}): ${dayTickets} day tickets available.`;
	return {
		structured: { date, closed: h.closed, dayTickets: h.closed ? 0 : dayTickets, events },
		text: [dayLine, ...eventLines].join('\n'),
	};
}

const TOOL_IMPLS = { get_opening_hours: runGetOpeningHours, check_ticket_availability: runCheckTicketAvailability };

const json = (body, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const rpcResult = (id, result) => json({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export async function onRequestPost({ request, env }) {
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
					'All dates must be ISO YYYY-MM-DD; resolve relative dates before calling tools. ' +
					'Availability data covers 2026-08-01 to 2027-08-31.',
			});
		}
		case 'ping':
			return rpcResult(msg.id, {});
		case 'tools/list':
			return rpcResult(msg.id, { tools: TOOLS });
		case 'tools/call': {
			const { name, arguments: args } = msg.params ?? {};
			const impl = TOOL_IMPLS[name];
			if (!impl) return rpcError(msg.id, -32602, `Unknown tool: ${name}`);
			try {
				const venue = await loadVenue(env, request.url);
				const { text, structured } = impl(venue, args);
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

/* GET bridge — a POC affordance for GET-only agents, NOT part of the MCP spec. Docs: docs/mcp-poc.md */
export async function onRequestGet({ request, env }) {
	const url = new URL(request.url);
	const tool = url.searchParams.get('tool');
	if (!tool) {
		return json({
			server: SERVER_INFO,
			protocol: 'MCP Streamable HTTP (stateless) — POST JSON-RPC 2.0 to this URL',
			discovery: [
				'https://v4.browser.style/.well-known/mcp-server-card',
				'https://v4.browser.style/.well-known/mcp.json',
			],
			data: `https://v4.browser.style${DATA_PATH}`,
			dataWindow: ['2026-08-01', '2027-08-31'],
			tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, parameters: inputSchema })),
			examples: {
				post: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'check_ticket_availability', arguments: { date: '2026-08-28' } } },
				get: [
					'https://v4.browser.style/mcp?tool=get_opening_hours&date=2026-08-28',
					'https://v4.browser.style/mcp?tool=check_ticket_availability&date=2026-08-28',
				],
			},
			note: 'The GET bridge (?tool=…) is a read-only proof-of-concept affordance for GET-only agents; it is not part of the MCP specification. All data is static dummy data.',
		});
	}
	const impl = TOOL_IMPLS[tool];
	if (!impl) return json({ error: `Unknown tool: ${tool}`, tools: Object.keys(TOOL_IMPLS) }, 400);
	const args = Object.fromEntries(url.searchParams);
	delete args.tool;
	try {
		const venue = await loadVenue(env, request.url);
		const { text, structured } = impl(venue, args);
		return json({ tool, isError: false, content: [{ type: 'text', text }], structuredContent: structured });
	} catch (err) {
		if (err instanceof ToolInputError) return json({ tool, isError: true, content: [{ type: 'text', text: err.message }] });
		throw err;
	}
}

/* Fallback for PUT/DELETE/etc — no SSE stream, no session to delete. */
export function onRequest() {
	return new Response('Method Not Allowed. POST JSON-RPC to this endpoint (MCP Streamable HTTP, stateless), or GET for a self-description.', {
		status: 405,
		headers: { Allow: 'GET, POST, OPTIONS', 'Content-Type': 'text/plain', ...CORS },
	});
}
