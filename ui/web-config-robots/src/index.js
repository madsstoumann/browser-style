import i18nData from './i18n.json' with { type: 'json' };

import { adoptSharedStyles, captureOpenDetailsState, createTranslator, restoreOpenDetailsState, setState } from '@browser.style/web-config-shared';

const RE_USER_AGENT = /^User-agent:\s*(.+)$/i;
const RE_SITEMAP = /^Sitemap:\s*(.+)$/i;
const RE_CRAWL_DELAY = /^Crawl-delay:\s*(\d+)$/i;
const RE_HOST = /^Host:\s*(.+)$/i;
const RE_CLEAN_PARAM = /^Clean-param:\s*(.+)$/i;
const RE_REQUEST_RATE = /^Request-rate:\s*(.+)$/i;
const RE_VISIT_TIME = /^Visit-time:\s*(.+)$/i;
const RE_ALLOW = /^Allow:\s*(.*)$/i;
const RE_DISALLOW = /^Disallow:\s*(.*)$/i;

class WebConfigRobots extends HTMLElement {
	static get observedAttributes() {
		return ['allow', 'disallow', 'src', 'value', 'lists', 'list-labels'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');
		this.listUrls = [];
		this.listLabels = [];
		this.state = {
			allow: [],
			disallow: [],
			botRules: {},
			sitemaps: [],
			crawlDelay: null,
			host: null,
			cleanParam: [],
			requestRate: null,
			visitTime: null,
			availableBots: []
		};

		this.ready = new Promise(resolve => this._resolveReady = resolve);
		this._loadedUrls = { allow: null, disallow: null, src: null };
	}

	_parseListUrls(value) {
		if (typeof value !== 'string') return [];
		// Accept both comma and semicolon separators.
		const urls = value
			.split(/[;,]/)
			.map(s => s.trim())
			.filter(Boolean);
		return [...new Set(urls)];
	}

	_normalizeImportUrl(url) {
		try {
			const u = new URL(url);
			if (u.hostname === 'github.com') {
				// Convert GitHub blob URLs to raw URLs.
				// /owner/repo/blob/branch/path -> raw.githubusercontent.com/owner/repo/branch/path
				const parts = u.pathname.split('/').filter(Boolean);
				const blobIndex = parts.indexOf('blob');
				if (parts.length >= 5 && blobIndex === 2) {
					const owner = parts[0];
					const repo = parts[1];
					const branch = parts[3];
					const path = parts.slice(4).join('/');
					return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
				}
			}
		} catch {
			// ignore
		}
		return url;
	}

	_labelForImportUrl(url) {
		try {
			const u = new URL(url);
			const file = u.pathname.split('/').filter(Boolean).pop();
			return file || u.hostname;
		} catch {
			return url;
		}
	}

	_escapeAttr(value) {
		return String(value)
			.replaceAll('&', '&amp;')
			.replaceAll('"', '&quot;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;');
	}

	_parseRobotsTxtToConfig(robotsTxtString) {
		const allow = [];
		const disallow = [];
		const botRules = {};
		const sitemaps = [];
		let crawlDelay = null;
		let host = null;
		const cleanParam = [];
		let requestRate = null;
		let visitTime = null;
		const foundBots = new Set();

		const lines = String(robotsTxtString || '').split('\n');
		let currentBot = null;
		let currentRules = null;
		let groupBots = [];
		let groupHasDirectives = false;

		for (const line of lines) {
			// RFC 9309: end-of-line may have optional trailing comment.
			// Treat inline '#' as comment start for all records.
			const commentIndex = line.indexOf('#');
			const withoutComment = commentIndex === -1 ? line : line.slice(0, commentIndex);
			const trimmed = withoutComment.trim();
			if (!trimmed) {
				// Blank line terminates the current group.
				currentBot = null;
				currentRules = null;
				groupBots = [];
				groupHasDirectives = false;
				continue;
			}
			// Comment-only lines are already handled by trimming.

			const agentMatch = trimmed.match(RE_USER_AGENT);
			if (agentMatch) {
				// New group starts when we see User-agent after any directive line.
				if (groupHasDirectives) {
					groupBots = [];
					groupHasDirectives = false;
				}

				currentBot = agentMatch[1].trim();
				if (currentBot && currentBot !== '*') foundBots.add(currentBot);
				groupBots.push(currentBot);
				if (!botRules[currentBot]) {
					botRules[currentBot] = { allow: [], disallow: [], crawlDelay: null };
				}
				currentRules = botRules[currentBot];
				continue;
			}

			const sitemapMatch = trimmed.match(RE_SITEMAP);
			if (sitemapMatch) {
				const sitemapUrl = sitemapMatch[1].trim();
				if (sitemapUrl && !sitemaps.includes(sitemapUrl)) sitemaps.push(sitemapUrl);
				// Sitemap is not a per-bot directive in this component's model; treat as global.
				groupHasDirectives = groupBots.length > 0 ? true : groupHasDirectives;
				continue;
			}

			const hostMatch = trimmed.match(RE_HOST);
			if (hostMatch) {
				host = hostMatch[1].trim();
				groupHasDirectives = groupBots.length > 0 ? true : groupHasDirectives;
				continue;
			}

			const cleanParamMatch = trimmed.match(RE_CLEAN_PARAM);
			if (cleanParamMatch) {
				cleanParam.push(cleanParamMatch[1].trim());
				groupHasDirectives = groupBots.length > 0 ? true : groupHasDirectives;
				continue;
			}

			const requestRateMatch = trimmed.match(RE_REQUEST_RATE);
			if (requestRateMatch) {
				requestRate = requestRateMatch[1].trim();
				groupHasDirectives = groupBots.length > 0 ? true : groupHasDirectives;
				continue;
			}

			const visitTimeMatch = trimmed.match(RE_VISIT_TIME);
			if (visitTimeMatch) {
				visitTime = visitTimeMatch[1].trim();
				groupHasDirectives = groupBots.length > 0 ? true : groupHasDirectives;
				continue;
			}

			const crawlDelayMatch = trimmed.match(RE_CRAWL_DELAY);
			if (crawlDelayMatch && currentBot) {
				const delay = parseInt(crawlDelayMatch[1], 10);
				if (currentBot === '*') crawlDelay = delay;
				else if (currentRules) currentRules.crawlDelay = delay;
				groupHasDirectives = true;
				continue;
			}

			const allowMatch = trimmed.match(RE_ALLOW);
			const disallowMatch = trimmed.match(RE_DISALLOW);

			// Per robots.txt grouping rules: multiple consecutive User-agent lines form a group.
			// Allow/Disallow lines apply to the whole group, not just the last User-agent.
			if (groupBots.length > 0 && (allowMatch || disallowMatch)) {
				const isAllow = !!allowMatch;
				const path = (allowMatch || disallowMatch)[1].trim();
				const listKey = isAllow ? 'allow' : 'disallow';

				for (const bot of groupBots) {
					const rules = botRules[bot] || (botRules[bot] = { allow: [], disallow: [], crawlDelay: null });
					// Special-case '*' (RFC fallback group): always model Allow/Disallow as path rules.
					if (bot === '*') {
						if (!rules[listKey].includes(path)) rules[listKey].push(path);
						continue;
					}

					if (path === '/') {
						const targetList = isAllow ? allow : disallow;
						if (!targetList.includes(bot)) targetList.push(bot);
					} else if (path === '') {
						// Disallow: (empty) means Allow everything.
						if (!isAllow && !allow.includes(bot)) allow.push(bot);
					} else if (!rules[listKey].includes(path)) {
						rules[listKey].push(path);
					}
				}
				groupHasDirectives = true;
				continue;
			}
		}

		const cleanedBotRules = {};
		for (const [bot, rules] of Object.entries(botRules)) {
			if (rules.allow.length > 0 || rules.disallow.length > 0 || rules.crawlDelay) {
				if (!allow.includes(bot) && !disallow.includes(bot)) cleanedBotRules[bot] = rules;
			}
		}

		return {
			allow,
			disallow,
			botRules: cleanedBotRules,
			sitemaps,
			crawlDelay,
			host,
			cleanParam,
			requestRate,
			visitTime,
			bots: Array.from(foundBots)
		};
	}

	_getGlobalPathRules() {
		const rules = this.state.botRules?.['*'];
		return {
			allow: Array.isArray(rules?.allow) ? rules.allow : [],
			disallow: Array.isArray(rules?.disallow) ? rules.disallow : []
		};
	}

	_addGlobalPathRule(type, pattern) {
		const directive = String(type || '').toLowerCase() === 'allow' ? 'allow' : 'disallow';
		const value = String(pattern ?? '').trim();
		if (!value) return;

		const nextBotRules = this.state.botRules ? JSON.parse(JSON.stringify(this.state.botRules)) : {};
		const rules = nextBotRules['*'] || { allow: [], disallow: [], crawlDelay: null };
		rules.allow = Array.isArray(rules.allow) ? rules.allow : [];
		rules.disallow = Array.isArray(rules.disallow) ? rules.disallow : [];

		if (directive === 'allow') {
			if (!rules.allow.includes(value)) rules.allow.push(value);
			// RFC 9309 suggests Allow wins when equivalent; keep this invariant in UI.
			rules.disallow = rules.disallow.filter(p => p !== value);
		} else {
			if (rules.allow.includes(value)) {
				// If Allow already exists for the same pattern, keep Allow (most implementations treat it as winner).
				// No-op.
			} else if (!rules.disallow.includes(value)) {
				rules.disallow.push(value);
			}
		}

		nextBotRules['*'] = rules;
		this._updateState({ botRules: nextBotRules });
	}

	_removeGlobalPathRule(type, pattern) {
		const directive = String(type || '').toLowerCase() === 'allow' ? 'allow' : 'disallow';
		const value = String(pattern ?? '').trim();
		if (!value) return;

		const current = this.state.botRules?.['*'];
		if (!current) return;
		const nextBotRules = this.state.botRules ? JSON.parse(JSON.stringify(this.state.botRules)) : {};
		const rules = nextBotRules['*'] || { allow: [], disallow: [], crawlDelay: null };
		rules.allow = Array.isArray(rules.allow) ? rules.allow : [];
		rules.disallow = Array.isArray(rules.disallow) ? rules.disallow : [];

		if (directive === 'allow') rules.allow = rules.allow.filter(p => p !== value);
		else rules.disallow = rules.disallow.filter(p => p !== value);

		// Remove empty '*' group so we don't emit an empty "User-agent: *" block.
		if (rules.allow.length === 0 && rules.disallow.length === 0 && !rules.crawlDelay) {
			delete nextBotRules['*'];
		} else {
			nextBotRules['*'] = rules;
		}
		this._updateState({ botRules: nextBotRules });
	}

	_mergeImportedConfig(parsed) {
		// Non-destructive merge: if the user has already placed a bot in one
		// section, do not re-add it to the opposite section on subsequent imports.
		const currentAllowSet = new Set(this.state.allow || []);
		const currentDisallowSet = new Set(this.state.disallow || []);

		const importedAllow = (parsed.allow || []).filter(bot => !currentDisallowSet.has(bot));
		const importedDisallow = (parsed.disallow || []).filter(bot => !currentAllowSet.has(bot));

		const mergedAllow = [...new Set([...(this.state.allow || []), ...importedAllow])];
		const mergedDisallow = [...new Set([...(this.state.disallow || []), ...importedDisallow])];

		const mergedBotRules = this.state.botRules
			? JSON.parse(JSON.stringify(this.state.botRules))
			: {};
		for (const [bot, rules] of Object.entries(parsed.botRules || {})) {
			const existing = mergedBotRules[bot];
			if (!existing) {
				mergedBotRules[bot] = {
					allow: [...(rules.allow || [])],
					disallow: [...(rules.disallow || [])],
					crawlDelay: rules.crawlDelay ?? null
				};
				continue;
			}
			existing.allow = [...new Set([...(existing.allow || []), ...(rules.allow || [])])];
			existing.disallow = [...new Set([...(existing.disallow || []), ...(rules.disallow || [])])];
			if (existing.crawlDelay == null && rules.crawlDelay != null) existing.crawlDelay = rules.crawlDelay;
		}

		const disallowSet = new Set(mergedDisallow);
		const allowSet = new Set(mergedAllow);
		for (const bot of Object.keys(mergedBotRules)) {
			if (disallowSet.has(bot) || allowSet.has(bot)) delete mergedBotRules[bot];
		}

		const bots = new Set(this.state.availableBots || []);
		(parsed.bots || []).forEach(b => bots.add(b));
		mergedAllow.forEach(b => bots.add(b));
		mergedDisallow.forEach(b => bots.add(b));
		Object.keys(mergedBotRules).forEach(b => bots.add(b));

		this._updateState({
			availableBots: Array.from(bots).sort(),
			allow: mergedAllow,
			disallow: mergedDisallow,
			botRules: mergedBotRules
		});
	}

	async importFromUrl(url) {
		if (!url) return;
		const normalizedUrl = this._normalizeImportUrl(url);
		try {
			const response = await fetch(normalizedUrl);
			const text = await response.text();
			const parsed = this._parseRobotsTxtToConfig(text);
			this._mergeImportedConfig(parsed);
		} catch (error) {
			console.error(`Failed to import robots.txt from ${normalizedUrl}:`, error);
		}
	}

	async _loadStyles() {
		try {
			await adoptSharedStyles(this.shadowRoot);
		} catch (error) {
			console.error('Failed to load styles:', error);
		}
	}

	async _loadBotsFromUrl(url, section) {
		try {
			const response = await fetch(url);
			const text = await response.text();
			const bots = this._parseRobotsTxt(text);

			const otherSection = section === 'allow' ? 'disallow' : 'allow';
			const otherSet = new Set(this.state[otherSection] || []);
			const botsForSection = bots.filter(bot => !otherSet.has(bot));

			// Add to availableBots if not already there
			const newBots = bots.filter(bot => !this.state.availableBots.includes(bot));
			this.state.availableBots = [...this.state.availableBots, ...newBots].sort();

			// Add to the specified section (allow or disallow) without overriding
			// user moves (i.e. don't re-add to the opposite section).
			const uniqueBots = [...new Set([...this.state[section], ...botsForSection])];
			this._updateState({ [section]: uniqueBots });

			return bots;
		} catch (error) {
			console.error(`Failed to load bots from ${url}:`, error);
			return [];
		}
	}

	async _loadFromRobotsTxt(url) {
		try {
			const response = await fetch(url);
			const text = await response.text();
			await this.fromString(text);
		} catch (error) {
			console.error(`Failed to load robots.txt from ${url}:`, error);
		}
	}

	_parseRobotsTxt(text) {
		const bots = new Set();
		const lines = text.split('\n');

		for (const line of lines) {
			const match = line.trim().match(RE_USER_AGENT);
			if (match && match[1] !== '*') {
				bots.add(match[1].trim());
			}
		}

		return Array.from(bots).sort();
	}

	_normalizeAllowDisallow(partialState) {
		const normalizeList = (list) => {
			if (!Array.isArray(list)) return [];
			const out = [];
			const seen = new Set();
			for (const item of list) {
				const bot = String(item ?? '').trim();
				if (!bot) continue;
				if (seen.has(bot)) continue;
				seen.add(bot);
				out.push(bot);
			}
			return out;
		};

		const nextAllow = normalizeList(partialState.allow ?? this.state.allow);
		const nextDisallow = normalizeList(partialState.disallow ?? this.state.disallow);
		const disallowSet = new Set(nextDisallow);
		const filteredAllow = nextAllow.filter(bot => !disallowSet.has(bot));

		return {
			...partialState,
			allow: filteredAllow,
			disallow: nextDisallow
		};
	}

	_updateState(partialState) {
		const nextPartialState = (partialState && (Object.hasOwn(partialState, 'allow') || Object.hasOwn(partialState, 'disallow')))
			? this._normalizeAllowDisallow(partialState)
			: partialState;

		const changedKeys = setState(this, nextPartialState);
		if (changedKeys.length === 0) return;

		const needsFullRender = changedKeys.some(k => k === 'allow' || k === 'disallow' || k === 'availableBots' || k === 'botRules');
		const updateSitemaps = changedKeys.includes('sitemaps');
		const updateSettings = changedKeys.some(k => ['crawlDelay', 'host', 'cleanParam', 'requestRate', 'visitTime'].includes(k));

		if (needsFullRender) {
			this.render();
		} else {
			if (updateSitemaps) this._updateSitemapsSection();
			if (updateSettings) this._updateSettingsSection();
			this._updateOutput();
		}
		this.dispatchChangeEvent();
	}

	_updateOutput() {
		const outputElement = this.shadowRoot.querySelector('pre code');
		if (outputElement) {
			outputElement.textContent = this.generateRobotsTxt() || this.t('ui.noRules');
		}
	}

	_updateSitemapsSection() {
		const sitemapsDetails = this.shadowRoot.querySelector('details[name="robtxt-sitemaps"]');
		if (sitemapsDetails) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = this._renderSitemaps();
			const newSitemaps = tempDiv.firstElementChild;
			sitemapsDetails.replaceWith(newSitemaps);
		}
	}

	_updateSettingsSection() {
		const settingsDetails = this.shadowRoot.querySelector('details[name="robtxt-settings"]');
		if (settingsDetails) {
			const crawlDelayInput = settingsDetails.querySelector('#crawl-delay-input');
			if (crawlDelayInput) crawlDelayInput.value = this.state.crawlDelay || '';

			const hostInput = settingsDetails.querySelector('#host-input');
			if (hostInput) hostInput.value = this.state.host || '';

			const cleanParamInput = settingsDetails.querySelector('#clean-param-input');
			if (cleanParamInput) cleanParamInput.value = this.state.cleanParam.join('\n') || '';

			const requestRateInput = settingsDetails.querySelector('#request-rate-input');
			if (requestRateInput) requestRateInput.value = this.state.requestRate || '';

			const visitTimeInput = settingsDetails.querySelector('#visit-time-input');
			if (visitTimeInput) visitTimeInput.value = this.state.visitTime || '';
		}
	}

	get config() {
		return {
			allow: [...this.state.allow],
			disallow: [...this.state.disallow],
			botRules: JSON.parse(JSON.stringify(this.state.botRules)),
			sitemaps: [...this.state.sitemaps],
			crawlDelay: this.state.crawlDelay,
			host: this.state.host,
			cleanParam: [...this.state.cleanParam],
			requestRate: this.state.requestRate,
			visitTime: this.state.visitTime
		};
	}

	set config(data) {
		if (typeof data !== 'object' || data === null) return;

		// Ensure all bots in the new config are added to availableBots
		const bots = new Set(this.state.availableBots);
		if (data.allow) data.allow.forEach(b => bots.add(b));
		if (data.disallow) data.disallow.forEach(b => bots.add(b));
		if (data.botRules) Object.keys(data.botRules).forEach(b => bots.add(b));

		const newState = {
			...this.state,
			availableBots: Array.from(bots).sort(),
			allow: [...(data.allow || [])],
			disallow: [...(data.disallow || [])],
			botRules: data.botRules ? JSON.parse(JSON.stringify(data.botRules)) : {},
			sitemaps: [...(data.sitemaps || [])],
			crawlDelay: data.crawlDelay || null,
			host: data.host || null,
			cleanParam: [...(data.cleanParam || [])],
			requestRate: data.requestRate || null,
			visitTime: data.visitTime || null
		};

		// Disallow wins over allow.
		const normalized = this._normalizeAllowDisallow({ allow: newState.allow, disallow: newState.disallow });
		newState.allow = normalized.allow;
		newState.disallow = normalized.disallow;

		this.state = newState;
		this.render();
		this.dispatchChangeEvent();
	}

	get value() {
		return this.generateRobotsTxt();
	}

	set value(val) {
		this.fromString(val);
	}

	get robotsTxt() {
		return this.generateRobotsTxt();
	}

	async fromString(robotsTxtString) {
		if (typeof robotsTxtString !== 'string' || !robotsTxtString.trim()) return;
		await this.ready;

		const parsed = this._parseRobotsTxtToConfig(robotsTxtString);
		const bots = new Set(this.state.availableBots);
		parsed.bots.forEach(b => bots.add(b));
		parsed.allow.forEach(b => bots.add(b));
		parsed.disallow.forEach(b => bots.add(b));
		Object.keys(parsed.botRules).forEach(b => bots.add(b));
		this.state.availableBots = Array.from(bots).sort();

		this.config = {
			allow: parsed.allow,
			disallow: parsed.disallow,
			botRules: parsed.botRules,
			sitemaps: parsed.sitemaps,
			crawlDelay: parsed.crawlDelay,
			host: parsed.host,
			cleanParam: parsed.cleanParam,
			requestRate: parsed.requestRate,
			visitTime: parsed.visitTime
		};
	}

	dispatchChangeEvent() {
		const detail = {
			config: this.config,
			robotsTxt: this.robotsTxt
		};
		this.dispatchEvent(new CustomEvent('robtxt-change', {
			bubbles: true,
			composed: true,
			detail
		}));
	}

	_addBot(section, bot) {
		if (!bot || this.state[section].includes(bot)) return;

		// Add to availableBots if not already there
		if (!this.state.availableBots.includes(bot)) {
			this.state.availableBots = [...this.state.availableBots, bot].sort();
		}

		// Remove from other section if present
		const otherSection = section === 'allow' ? 'disallow' : 'allow';
		const otherFiltered = this.state[otherSection].filter(b => b !== bot);

		this._updateState({
			[section]: [...this.state[section], bot],
			[otherSection]: otherFiltered
		});
	}

	_removeBot(section, bot) {
		const filtered = this.state[section].filter(b => b !== bot);
		this._updateState({ [section]: filtered });
	}

	_moveBot(fromSection, toSection, bot) {
		const fromFiltered = this.state[fromSection].filter(b => b !== bot);
		const toUpdated = this.state[toSection].includes(bot)
			? this.state[toSection]
			: [...this.state[toSection], bot];

		this._updateState({
			[fromSection]: fromFiltered,
			[toSection]: toUpdated
		});
	}

	_getUnusedBots() {
		const used = new Set([...this.state.allow, ...this.state.disallow, ...Object.keys(this.state.botRules)]);
		return this.state.availableBots.filter(bot => !used.has(bot));
	}

	// Sitemap management
	addSitemap(url) {
		if (!url || this.state.sitemaps.includes(url)) return;
		this._updateState({ sitemaps: [...this.state.sitemaps, url] });
	}

	removeSitemap(url) {
		const filtered = this.state.sitemaps.filter(s => s !== url);
		this._updateState({ sitemaps: filtered });
	}

	// Crawl-delay management
	setCrawlDelay(seconds) {
		this._updateState({ crawlDelay: seconds > 0 ? seconds : null });
	}

	generateRobotsTxt() {
		let output = '';

		// Simple Allow section (entire site)
		if (this.state.allow.length > 0) {
			output += `# ${this.t('output.allowedBots')}\n`;
			this.state.allow.forEach(bot => {
				output += `User-agent: ${bot}\n`;
			});
			output += `Allow: /\n\n`;
		}

		// Simple Disallow section (entire site)
		if (this.state.disallow.length > 0) {
			output += `# ${this.t('output.disallowedBots')}\n`;
			this.state.disallow.forEach(bot => {
				output += `User-agent: ${bot}\n`;
			});
			output += `Disallow: /\n\n`;
		}

		const hasGlobalPathRules = Boolean(this.state.botRules?.['*']);

		// Per-bot custom rules
		for (const [bot, rules] of Object.entries(this.state.botRules)) {
			const allowPaths = Array.isArray(rules?.allow) ? rules.allow : [];
			const disallowPaths = Array.isArray(rules?.disallow) ? rules.disallow : [];
			const crawl = rules?.crawlDelay;

			// Skip empty groups to reduce noise.
			const hasInlineCrawlDelay = Boolean(crawl);
			const shouldInlineGlobalCrawlDelay = bot === '*' && this.state.crawlDelay && !hasInlineCrawlDelay;
			const hasAnyRule = hasInlineCrawlDelay || shouldInlineGlobalCrawlDelay || allowPaths.length > 0 || disallowPaths.length > 0;
			if (!hasAnyRule) continue;

			output += `# ${this.t('output.customRulesFor')} ${bot}\n`;
			output += `User-agent: ${bot}\n`;

			// If we have path rules for '*', prefer emitting the global crawl-delay here to avoid duplicate UA:* blocks.
			if (shouldInlineGlobalCrawlDelay) {
				output += `Crawl-delay: ${this.state.crawlDelay}\n`;
			}

			if (hasInlineCrawlDelay) {
				output += `Crawl-delay: ${crawl}\n`;
			}

			allowPaths.forEach(path => {
				output += `Allow: ${path}\n`;
			});

			disallowPaths.forEach(path => {
				output += `Disallow: ${path}\n`;
			});

			output += '\n';
		}

		// Global crawl-delay for all bots
		if (this.state.crawlDelay && !hasGlobalPathRules) {
			output += `# ${this.t('output.globalCrawlDelay')}\n`;
			output += `User-agent: *\n`;
			output += `Crawl-delay: ${this.state.crawlDelay}\n\n`;
		}

		// Other global settings
		if (this.state.host) output += `Host: ${this.state.host}\n`;
		if (this.state.requestRate) output += `Request-rate: ${this.state.requestRate}\n`;
		if (this.state.visitTime) output += `Visit-time: ${this.state.visitTime}\n`;
		if (this.state.cleanParam.length > 0) {
			this.state.cleanParam.forEach(param => {
				output += `Clean-param: ${param}\n`;
			});
		}
		if (this.state.host || this.state.requestRate || this.state.visitTime || this.state.cleanParam.length > 0) output += '\n';

		// Sitemaps
		if (this.state.sitemaps.length > 0) {
			output += `# ${this.t('output.sitemaps')}\n`;
			this.state.sitemaps.forEach(sitemap => {
				output += `Sitemap: ${sitemap}\n`;
			});
		}

		return output.trim();
	}

	async connectedCallback() {
		this.lang = this.getAttribute('lang') || 'en';
		this._resolveReady();
		this.listUrls = this._parseListUrls(this.getAttribute('lists'));
		this.listLabels = this._parseListUrls(this.getAttribute('list-labels'));

		// Load existing robots.txt file if src attribute is present
		const srcUrl = this.getAttribute('src');
		const value = this.getAttribute('value');

		if (srcUrl) {
			this._loadedUrls.src = srcUrl;
			await this._loadFromRobotsTxt(srcUrl);
		} else if (value) {
			await this.fromString(value);
		}

		// Load initial allow/disallow lists from URLs
		const allowUrl = this.getAttribute('allow');
		const disallowUrl = this.getAttribute('disallow');

		if (allowUrl) {
			this._loadedUrls.allow = allowUrl;
			await this._loadBotsFromUrl(allowUrl, 'allow');
		}

		if (disallowUrl) {
			this._loadedUrls.disallow = disallowUrl;
			await this._loadBotsFromUrl(disallowUrl, 'disallow');
		}

		const initialConfig = this.getAttribute('initial-config');
		if (initialConfig) {
			try {
				this.config = JSON.parse(initialConfig);
			} catch (e) {
				console.error('Failed to parse initial-config attribute:', e);
				this.render();
			}
		} else if (!srcUrl && !value) {
			this.render();
		}

		this._attachEventListeners();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'src' && oldValue !== newValue) {
			if (newValue && this._loadedUrls.src !== newValue) {
				this._loadedUrls.src = newValue;
				await this._loadFromRobotsTxt(newValue);
			}
		} else if (name === 'value' && oldValue !== newValue) {
			await this.fromString(newValue);
		} else if (name === 'lists' && oldValue !== newValue) {
			this.listUrls = this._parseListUrls(newValue);
			this.render();
		} else if (name === 'list-labels' && oldValue !== newValue) {
			this.listLabels = this._parseListUrls(newValue);
			this.render();
		} else if ((name === 'allow' || name === 'disallow') && oldValue !== newValue) {
			if (newValue && this._loadedUrls[name] !== newValue) {
				this._loadedUrls[name] = newValue;
				await this._loadBotsFromUrl(newValue, name);
			}
		}
	}

	_attachEventListeners() {
		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target.closest('button');
			if (!target) return;

			if (target.dataset.action !== undefined && target.dataset.url) {
				const url = target.dataset.url;
				this.importFromUrl(url);
				return;
			}

			if (target.dataset.addGlobalRule !== undefined) {
				const type = this.shadowRoot.querySelector('#global-rule-type')?.value;
				const input = this.shadowRoot.querySelector('#global-rule-pattern');
				const pattern = input?.value;
				this._addGlobalPathRule(type, pattern);
				if (input) input.value = '';
				return;
			}

			if (target.dataset.removeGlobalRule !== undefined) {
				const type = target.dataset.type;
				const pattern = target.dataset.pattern;
				this._removeGlobalPathRule(type, pattern);
				return;
			}

			const section = target.dataset.section;
			const bot = target.dataset.bot;

			if (target.dataset.add !== undefined) {
				const input = this.shadowRoot.querySelector(`input[data-section="${section}"]`);
				if (input?.value) {
					this._addBot(section, input.value.trim());
					input.value = '';
				}
			} else if (target.dataset.remove !== undefined) {
				this._removeBot(section, bot);
			} else if (target.dataset.move !== undefined) {
				const toSection = target.dataset.move;
				this._moveBot(section, toSection, bot);
			} else if (target.dataset.addFromList !== undefined) {
				this._addBot(section, bot);
			} else if (target.dataset.addSitemap !== undefined) {
				const input = this.shadowRoot.querySelector('#sitemap-input');
				if (input?.value) {
					this.addSitemap(input.value.trim());
					input.value = '';
				}
			} else if (target.dataset.removeSitemap !== undefined) {
				const sitemap = target.dataset.sitemap;
				this.removeSitemap(sitemap);
			}
		});

		this.shadowRoot.addEventListener('input', (e) => {
			if (e.target.id === 'crawl-delay-input') {
				const value = parseInt(e.target.value, 10);
				this.setCrawlDelay(value || null);
			} else if (e.target.id === 'host-input') {
				this._updateState({ host: e.target.value.trim() || null });
			} else if (e.target.id === 'request-rate-input') {
				this._updateState({ requestRate: e.target.value.trim() || null });
			} else if (e.target.id === 'visit-time-input') {
				this._updateState({ visitTime: e.target.value.trim() || null });
			}
		});

		this.shadowRoot.addEventListener('change', (e) => {
			if (e.target.id === 'clean-param-input') {
				const params = e.target.value.split('\n').map(p => p.trim()).filter(p => p);
				this._updateState({ cleanParam: params });
			}
		});
	}

	_renderBotChip(bot, section) {
		const otherSection = section === 'allow' ? 'disallow' : 'allow';
		const moveTitle = section === 'allow' ? this.t('ui.moveToDisallow') : this.t('ui.moveToAllow');
		const statusAttr = section === 'allow'
			? ' data-status="ok"'
			: (section === 'disallow' ? ' data-status="danger"' : '');

		return `
			<li${statusAttr}>
				${bot}
				<button data-move="${otherSection}" data-section="${section}" data-bot="${bot}" title="${moveTitle}">⇄</button>
				<button data-remove data-section="${section}" data-bot="${bot}">×</button>
			</li>
		`;
	}

	_renderSection(section, title, unusedBots) {
		const bots = this.state[section];
		const statusAttr = section === 'allow'
			? ' data-status="ok"'
			: (section === 'disallow' ? ' data-status="danger"' : '');

		return `
			<details name="robtxt-manager" data-panel="${section}"${section === 'allow' ? ' open' : ''}${statusAttr}>
				<summary>${title} (${bots.length})</summary>
				<div>
					<ul data-ul-for="${section}">
						${bots.length > 0
							? bots.map(bot => this._renderBotChip(bot, section)).join('')
							: `<li>${this.t('ui.noBotsInSection')}</li>`
						}
					</ul>
					<fieldset>
						<input
							type="text"
							data-section="${section}"
							placeholder="${this.t('ui.addCustomBot')}"
							list="${section}-bots"
						>
						<button data-add data-section="${section}">${this.t('ui.add')}</button>
					</fieldset>
					${unusedBots.length > 0 ? `
						<datalist id="${section}-bots">
							${unusedBots.slice(0, 100).map(bot => `<option value="${bot}"></option>`).join('')}
						</datalist>
						<small>${this.t('ui.quickAddBots')}</small>
						<ul>
							${unusedBots.slice(0, 20).map(bot => `
							<li>
								<button
									data-add-from-list
									data-section="${section}"
									data-bot="${bot}"
								>${bot}</button>
							</li>`).join('')}
						</ul>` : ''}
				</div>
			</details>
		`;
	}

	render() {
		const openState = captureOpenDetailsState(this.shadowRoot);

		const unusedBots = this._getUnusedBots();
		const allowSection = this._renderSection('allow', this.t('ui.allow'), unusedBots);
		const disallowSection = this._renderSection('disallow', this.t('ui.disallow'), unusedBots);
		const settingsSection = this._renderSettings();
		const sitemapSection = this._renderSitemaps();

		this.shadowRoot.innerHTML = `
			${allowSection}
			${disallowSection}
			${sitemapSection}
			${settingsSection}
			<pre><code>${this.generateRobotsTxt() || this.t('ui.noRules')}</code></pre>
		`;

		restoreOpenDetailsState(this.shadowRoot, openState);
	}

	_renderSettings() {
		const globalRules = this._getGlobalPathRules();
		const importText = this.t('ui.import');
		const globalRulesMarkup = (globalRules.allow.length > 0 || globalRules.disallow.length > 0)
			? `
				<ul>
					${globalRules.allow.map(p => `
						<li data-status="ok">
							${this._escapeAttr(this.t('ui.allow'))}: ${this._escapeAttr(p)}
							<button type="button" data-remove-global-rule data-type="allow" data-pattern="${this._escapeAttr(p)}">×</button>
						</li>
					`).join('')}
					${globalRules.disallow.map(p => `
						<li data-status="danger">
							${this._escapeAttr(this.t('ui.disallow'))}: ${this._escapeAttr(p)}
							<button type="button" data-remove-global-rule data-type="disallow" data-pattern="${this._escapeAttr(p)}">×</button>
						</li>
					`).join('')}
				</ul>
			`
			: '';

		const listButtons = this.listUrls.length > 0
			? `
				<div>
					<small>${this.t('ui.importBotLists')}</small>
					${this.listUrls.map((rawUrl, index) => {
						const normalized = this._normalizeImportUrl(rawUrl);
						const customLabel = this.listLabels[index];
						const label = customLabel || `${importText} ${this._labelForImportUrl(rawUrl)}`;
						return `<button data-action data-url="${this._escapeAttr(normalized)}" type="button">${this._escapeAttr(label)}</button>`;
					}).join('')}
				</div>
			`
			: '';

		return `
			<details name="robtxt-settings" data-panel="settings">
				<summary>${this.t('ui.globalSettings')}</summary>
				<div>
					${listButtons}
					<hr>
					${globalRulesMarkup}
					<label>
						<small>${this.t('ui.pathRulesStar')}</small>
						<select id="global-rule-type">
							<option value="disallow">${this.t('ui.disallow')}</option>
							<option value="allow">${this.t('ui.allow')}</option>
						</select>
					</label>
					<fieldset>
						<input
							type="text"
							id="global-rule-pattern"
							placeholder="${this.t('ui.pathRulePlaceholder')}"
						>
						<button type="button" data-add-global-rule>${this.t('ui.add')}</button>
					</fieldset>
					<label for="crawl-delay-input">
						<small>${this.t('ui.crawlDelay')}</small>
						<input
							type="number"
							id="crawl-delay-input"
							min="0"
							step="1"
							placeholder="${this.t('ui.noCrawlDelay')}"
							value="${this.state.crawlDelay || ''}"
						>
					</label>
					<label for="host-input">
						<small>${this.t('ui.host')}</small>
						<input
							type="text"
							id="host-input"
							placeholder="${this.t('ui.hostHint')}"
							value="${this.state.host || ''}"
						>
					</label>
					<label for="clean-param-input">
						<small>${this.t('ui.cleanParam')}</small>
						<textarea
							id="clean-param-input"
							placeholder="${this.t('ui.cleanParamHint')}"
							rows="3"
						>${this.state.cleanParam.join('\n')}</textarea>
					</label>
					<label for="request-rate-input">
						<small>${this.t('ui.requestRate')}</small>
						<input
							type="text"
							id="request-rate-input"
							placeholder="${this.t('ui.requestRateHint')}"
							value="${this.state.requestRate || ''}"
						>
					</label>
					<label for="visit-time-input">
						<small>${this.t('ui.visitTime')}</small>
						<input
							type="text"
							id="visit-time-input"
							placeholder="${this.t('ui.visitTimeHint')}"
							value="${this.state.visitTime || ''}"
						>
					</label>
				</div>
			</details>
		`;
	}

	_renderSitemaps() {
		return `
			<details name="robtxt-sitemaps" data-panel="sitemaps" data-status="info">
				<summary>${this.t('ui.sitemaps')} (${this.state.sitemaps.length})</summary>
				<div>
					${this.state.sitemaps.length > 0 ? `
						<ul>
							${this.state.sitemaps.map(sitemap => `
								<li>
									${sitemap}
									<button data-remove-sitemap data-sitemap="${sitemap}">×</button>
								</li>
							`).join('')}
						</ul>
					` : `<p>${this.t('ui.noSitemaps')}</p>`}
					<fieldset>
						<input
							type="url"
							id="sitemap-input"
							placeholder="${this.t('ui.sitemapPlaceholder')}"
						>
						<button data-add-sitemap>${this.t('ui.addSitemap')}</button>
					</fieldset>
				</div>
			</details>
		`;
	}
}

customElements.define('web-config-robots', WebConfigRobots);
