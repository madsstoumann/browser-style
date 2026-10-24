/**
 * Beacon tracker: batches ff:track events and posts them to an endpoint the site owns.
 * Sends every `interval` ms or `batch` events, and on pagehide with navigator.sendBeacon.
 * Docs: ../readme.md § Tracking
 */
const MAX_QUEUE = 500;

/* text/plain keeps sendBeacon a simple request (no CORS preflight); the body is a JSON array. */
function defaultSend(url, events) {
	const body = JSON.stringify(events);
	if (globalThis.navigator?.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return;
	globalThis.fetch?.(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}

export function beacon(url, { batch = 20, interval = 10000, consent = true, send = defaultSend } = {}) {
	let queue = [];
	let granted = consent;
	let timer = null;

	const flush = () => {
		clearTimeout(timer);
		timer = null;
		if (!granted || !queue.length) return;
		const events = queue;
		queue = [];
		send(url, events);
	};

	const track = event => {
		queue.push(event);
		if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
		if (!granted) return;
		if (queue.length >= batch) flush();
		else timer ??= setTimeout(flush, interval);
	};

	globalThis.addEventListener?.('pagehide', flush);

	return Object.assign(track, {
		flush,
		/* Consent given: send what was buffered. */
		grant() { granted = true; flush(); },
		/* Consent withdrawn: drop the buffer and stop sending. */
		revoke() { granted = false; queue = []; clearTimeout(timer); timer = null; },
		get pending() { return queue.length; }
	});
}
