/**
 * <form-embed>
 * Embeds a published form by id on any site: loads its bundle (form + rules + function names),
 * resolves the named host functions from the registry, and runs <form-flow> in Shadow DOM
 * (mode="shadow", the default) or in the page (mode="light", styles kept inside @scope).
 */
import FormFlow from '../form-flow/index.js';

const SHEETS = [
	'./embed.css',
	'../base/form.css',
	'../base/button.css',
	'../step/ui-step.css',
	'../form-flow/index.css'
];
const PASS = ['explain', 'label-prev', 'label-next', 'label-submit', 'label-required', 'label-unavailable'];
const cache = new Map();

/* Fetches once per URL; a failed request is not cached. */
function once(key, load) {
	if (!cache.has(key)) cache.set(key, load().catch(error => { cache.delete(key); throw error; }));
	return cache.get(key);
}

async function fetchText(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url}: ${response.status}`);
	return response.text();
}

/* Relative url()s resolve against the sheet's own URL, not the client's page. */
const absoluteUrls = (css, base) => css.replace(/url\((['"]?)(?!data:|https?:|\/\/)([^'")]+)\1\)/g, (_, quote, path) => `url(${quote}${new URL(path, base)}${quote})`);

/* The token sheet maps onto :host; the form sheets are scoped to <form-flow>. Light DOM wraps both in @scope (form-embed). */
function sheetFor(mode) {
	return once(`sheet:${mode}`, async () => {
		const [tokens, ...rest] = await Promise.all(SHEETS.map(async path => {
			const url = new URL(path, import.meta.url);
			return absoluteUrls(await fetchText(url), url);
		}));
		const order = tokens.match(/^@layer [^{;]+;/m)?.[0] ?? '';
		const forms = `@scope (form-flow) {\n${rest.join('\n').replace(/:root\b/g, ':scope')}\n}`;
		let css = `${tokens}\n${forms}`;
		if (mode === 'light') {
			css = css.replace(order, '').replace(/:host\(([^)]*)\)/g, ':scope:is($1)').replace(/:host\b/g, ':scope');
			css = `${order}\n@scope (form-embed) {\n${css}\n}`;
		}
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(css);
		return sheet;
	});
}

function clientSheet(url) {
	return once(`client:${url}`, async () => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(absoluteUrls(await fetchText(url), url));
		return sheet;
	});
}

/* Imports the registry modules a bundle names; an unknown name throws (a check must never pass silently). */
async function loadFunctions(names = []) {
	if (!names.length) return {};
	const registryUrl = new URL('./functions/registry.json', import.meta.url);
	const registry = await once(`registry`, async () => JSON.parse(await fetchText(registryUrl)));
	const functions = {};
	await Promise.all(names.map(async name => {
		if (!registry[name] || name === '$comment') throw new Error(`Unknown function: ${name}`);
		const module = await import(new URL(registry[name], registryUrl));
		const fn = module.functions?.[name] ?? module[name];
		if (typeof fn !== 'function') throw new Error(`${registry[name]} has no function ${name}`);
		functions[name] = fn;
	}));
	return functions;
}

/* Service URLs in a bundle resolve against the bundle, not the client's page. */
function resolveServices(rules, base) {
	const wrapped = typeof rules?.model === 'string' && rules.fields;
	const body = wrapped ? rules.fields : rules;
	if (!body?.services) return rules;
	const services = Object.fromEntries(Object.entries(body.services).map(([name, service]) =>
		[name, service.url ? { ...service, url: new URL(service.url, base).href } : service]));
	return wrapped ? { ...rules, fields: { ...body, services } } : { ...body, services };
}

/* Gives the rendered controls part names, so ::part() reaches them from the client's CSS. */
function tagParts(root) {
	root.querySelectorAll('[data-field] input, [data-field] select, [data-field] textarea').forEach(el => el.part.add('input'));
	root.querySelectorAll('[data-field] > span, [data-field] > legend').forEach(el => el.part.add('label'));
	root.querySelectorAll('[data-field] small').forEach(el => el.part.add('hint'));
	root.querySelectorAll('[part~="nav"] button').forEach(el => {
		el.part.add('button');
		if (el.type === 'submit' || el.dataset.action === 'next') el.part.add('button-primary');
	});
}

export default class FormEmbed extends HTMLElement {
	static observedAttributes = ['form-id', 'version', 'src', 'mode', 'stylesheet'];

	#flow = null;
	#root = null;
	#bundle = null;
	#registry = {};
	#client = {};
	#observer = null;
	#loading = null;

	connectedCallback() {
		this.#loading ??= this.load();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === null || oldValue === newValue || !this.isConnected) return;
		this.#loading = this.load();
	}

	disconnectedCallback() {
		this.#observer?.disconnect();
	}

	get mode() { return this.getAttribute('mode') === 'light' ? 'light' : 'shadow'; }

	/* The bundle URL: src="…" wins, else forms/{form-id}/{version}.json next to this script. */
	get bundleUrl() {
		if (this.hasAttribute('src')) return new URL(this.getAttribute('src'), document.baseURI);
		const id = this.getAttribute('form-id');
		if (!id) return null;
		const version = this.getAttribute('version') ?? 'latest';
		return new URL(`./forms/${encodeURIComponent(id)}/${encodeURIComponent(version)}.json`, import.meta.url);
	}

	async load() {
		const url = this.bundleUrl;
		if (!url) return;
		try {
			if (this.getAttribute('mode') === 'iframe') throw new Error('mode="iframe" is not built yet');
			const [bundle, sheet, extra] = await Promise.all([
				once(`bundle:${url}`, async () => JSON.parse(await fetchText(url))),
				sheetFor(this.mode),
				this.hasAttribute('stylesheet') ? clientSheet(new URL(this.getAttribute('stylesheet'), document.baseURI)) : null
			]);
			this.#registry = await loadFunctions(bundle.functions);
			this.#bundle = bundle;
			this.#mount(sheet, extra);
			this.#flow.functions = this.functions;
			this.#flow.setup(bundle.form, resolveServices(bundle.rules, url));
			this.dispatchEvent(new CustomEvent('ff:ready', { bubbles: true, composed: true, detail: { id: bundle.id, version: bundle.version } }));
		} catch (error) {
			this.dispatchEvent(new CustomEvent('ff:error', { bubbles: true, composed: true, detail: { error } }));
		}
	}

	#mount(sheet, extra) {
		this.#observer?.disconnect();
		this.#flow?.remove();
		const sheets = [sheet, extra].filter(Boolean);
		if (this.mode === 'shadow') {
			this.#root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
			this.#root.adoptedStyleSheets = sheets;
		} else {
			this.#root = this;
			const host = this.getRootNode();
			const missing = sheets.filter(s => !host.adoptedStyleSheets.includes(s));
			if (missing.length) host.adoptedStyleSheets = [...host.adoptedStyleSheets, ...missing];
		}
		this.#flow = new FormFlow();
		PASS.forEach(name => { if (this.hasAttribute(name)) this.#flow.setAttribute(name, this.getAttribute(name)); });
		this.#root.append(this.#flow);
		this.#observer = new MutationObserver(() => tagParts(this.#flow));
		this.#observer.observe(this.#flow, { childList: true, subtree: true });
	}

	/* Registry functions the form names, plus the client's own (client wins on a name clash). */
	set functions(value) {
		this.#client = value ?? {};
		if (this.#flow) this.#flow.functions = this.functions;
	}
	get functions() { return { ...this.#registry, ...this.#client }; }

	get flow() { return this.#flow; }
	get bundle() { return this.#bundle; }
	get ready() { return this.#loading; }
	get state() { return this.#flow?.state ?? null; }
	get values() { return this.#flow?.values ?? {}; }

	set context(value) { this.#whenReady(flow => { flow.context = value; }); }
	get context() { return this.#flow?.context ?? {}; }
	set facts(value) { this.#whenReady(flow => { flow.facts = value; }); }
	get facts() { return this.#flow?.facts ?? {}; }

	receive(event) { return this.#flow?.receive(event); }
	goTo(step) { return this.#flow?.goTo(step) ?? false; }

	#whenReady(fn) {
		if (this.#flow?.state) fn(this.#flow);
		else Promise.resolve(this.#loading).then(() => this.#flow && fn(this.#flow));
	}
}

if (!customElements.get('form-embed')) customElements.define('form-embed', FormEmbed);
