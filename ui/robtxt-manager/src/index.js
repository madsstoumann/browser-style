import i18nData from './i18n.json' with { type: 'json' };

const RE_USER_AGENT = /^User-agent:\s*(.+)$/i;
const RE_SITEMAP = /^Sitemap:\s*(.+)$/i;
const RE_CRAWL_DELAY = /^Crawl-delay:\s*(\d+)$/i;
const RE_HOST = /^Host:\s*(.+)$/i;
const RE_CLEAN_PARAM = /^Clean-param:\s*(.+)$/i;
const RE_REQUEST_RATE = /^Request-rate:\s*(.+)$/i;
const RE_VISIT_TIME = /^Visit-time:\s*(.+)$/i;
const RE_ALLOW = /^Allow:\s*(.*)$/i;
const RE_DISALLOW = /^Disallow:\s*(.*)$/i;

class RobtxtManager extends HTMLElement {
	static get observedAttributes() {
		return ['allow', 'disallow', 'src', 'value'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this.i18nConfig = i18nData;
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

	t(key) {
		const keys = key.split('.');
		let value = this.i18nConfig[this.lang];
		for (const k of keys) {
			value = value?.[k];
		}
		return typeof value === 'string' ? value : key;
	}

	async _loadStyles() {
		try {
			const cssText = await fetch(new URL('./index.css', import.meta.url)).then(r => r.text());
			const sheet = new CSSStyleSheet();
			await sheet.replace(cssText);
			this.shadowRoot.adoptedStyleSheets = [sheet];
		} catch (error) {
			console.error('Failed to load styles:', error);
		}
	}

	async _loadBotsFromUrl(url, section) {
		try {
			const response = await fetch(url);
			const text = await response.text();
			const bots = this._parseRobotsTxt(text);

			// Add to availableBots if not already there
			const newBots = bots.filter(bot => !this.state.availableBots.includes(bot));
			this.state.availableBots = [...this.state.availableBots, ...newBots].sort();

			// Add to the specified section (allow or disallow)
			const uniqueBots = [...new Set([...this.state[section], ...bots])];
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

	_updateState(partialState) {
		let stateChanged = false;
		let needsFullRender = false;
		let updateSitemaps = false;
		let updateSettings = false;

		for (const [key, newValue] of Object.entries(partialState)) {
			if (this.state[key] !== newValue) {
				this.state[key] = newValue;
				stateChanged = true;

				if (key === 'allow' || key === 'disallow') needsFullRender = true;
				else if (key === 'sitemaps') updateSitemaps = true;
				else if (['crawlDelay', 'host', 'cleanParam', 'requestRate', 'visitTime'].includes(key)) updateSettings = true;
			}
		}

		if (stateChanged) {
			if (needsFullRender) {
				this.render();
			} else {
				if (updateSitemaps) this._updateSitemapsSection();
				if (updateSettings) this._updateSettingsSection();
				this._updateOutput();
			}
			this.dispatchChangeEvent();
		}
	}

	_updateOutput() {
		const outputElement = this.shadowRoot.querySelector('pre code');
		if (outputElement) {
			outputElement.textContent = this.generateRobotsTxt() || '# No rules defined yet';
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

		const allow = [];
		const disallow = [];
		const botRules = {};
		const sitemaps = [];
		let crawlDelay = null;
		let host = null;
		const cleanParam = [];
		let requestRate = null;
		let visitTime = null;

		const lines = robotsTxtString.split('\n');
		let currentBot = null;
		let currentRules = null;

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;

			// Match User-agent
			const agentMatch = trimmed.match(RE_USER_AGENT);
			if (agentMatch) {
				currentBot = agentMatch[1].trim();
				if (currentBot !== '*' && !this.state.availableBots.includes(currentBot)) {
					this.state.availableBots = [...this.state.availableBots, currentBot].sort();
				}
				if (!botRules[currentBot]) {
					botRules[currentBot] = { allow: [], disallow: [], crawlDelay: null };
				}
				currentRules = botRules[currentBot];
				continue;
			}

			// Match Sitemap
			const sitemapMatch = trimmed.match(RE_SITEMAP);
			if (sitemapMatch) {
				const sitemapUrl = sitemapMatch[1].trim();
				if (!sitemaps.includes(sitemapUrl)) {
					sitemaps.push(sitemapUrl);
				}
				continue;
			}

			// Match Host
			const hostMatch = trimmed.match(RE_HOST);
			if (hostMatch) {
				host = hostMatch[1].trim();
				continue;
			}

			// Match Clean-param
			const cleanParamMatch = trimmed.match(RE_CLEAN_PARAM);
			if (cleanParamMatch) {
				cleanParam.push(cleanParamMatch[1].trim());
				continue;
			}

			// Match Request-rate
			const requestRateMatch = trimmed.match(RE_REQUEST_RATE);
			if (requestRateMatch) {
				requestRate = requestRateMatch[1].trim();
				continue;
			}

			// Match Visit-time
			const visitTimeMatch = trimmed.match(RE_VISIT_TIME);
			if (visitTimeMatch) {
				visitTime = visitTimeMatch[1].trim();
				continue;
			}

			// Match Crawl-delay
			const crawlDelayMatch = trimmed.match(RE_CRAWL_DELAY);
			if (crawlDelayMatch && currentBot) {
				const delay = parseInt(crawlDelayMatch[1], 10);
				if (currentBot === '*') {
					crawlDelay = delay;
				} else if (currentRules) {
					currentRules.crawlDelay = delay;
				}
				continue;
			}

			// Match Allow/Disallow rules
			const allowMatch = trimmed.match(RE_ALLOW);
			const disallowMatch = trimmed.match(RE_DISALLOW);

			if (currentBot && currentRules) {
				if (allowMatch) {
					const path = allowMatch[1].trim();
					if (path === '/' || path === '') {
						// Simple allow - add to main allow list
						if (!allow.includes(currentBot)) allow.push(currentBot);
					} else {
						// Path-specific allow
						if (!currentRules.allow.includes(path)) {
							currentRules.allow.push(path);
						}
					}
				} else if (disallowMatch) {
					const path = disallowMatch[1].trim();
					if (path === '/' || path === '') {
						// Simple disallow - add to main disallow list
						if (!disallow.includes(currentBot)) disallow.push(currentBot);
					} else {
						// Path-specific disallow
						if (!currentRules.disallow.includes(path)) {
							currentRules.disallow.push(path);
						}
					}
				}
			}
		}

		// Clean up botRules - only keep bots with actual custom rules
		const cleanedBotRules = {};
		for (const [bot, rules] of Object.entries(botRules)) {
			if (rules.allow.length > 0 || rules.disallow.length > 0 || rules.crawlDelay) {
				// Don't add if bot is in simple allow/disallow
				if (!allow.includes(bot) && !disallow.includes(bot)) {
					cleanedBotRules[bot] = rules;
				}
			}
		}

		this.config = { allow, disallow, botRules: cleanedBotRules, sitemaps, crawlDelay, host, cleanParam, requestRate, visitTime };
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
			output += '# Allowed Bots\n';
			this.state.allow.forEach(bot => {
				output += `User-agent: ${bot}\n`;
			});
			output += `Allow: /\n\n`;
		}

		// Simple Disallow section (entire site)
		if (this.state.disallow.length > 0) {
			output += '# Disallowed Bots\n';
			this.state.disallow.forEach(bot => {
				output += `User-agent: ${bot}\n`;
			});
			output += `Disallow: /\n\n`;
		}

		// Per-bot custom rules
		for (const [bot, rules] of Object.entries(this.state.botRules)) {
			output += `# Custom rules for ${bot}\n`;
			output += `User-agent: ${bot}\n`;

			if (rules.crawlDelay) {
				output += `Crawl-delay: ${rules.crawlDelay}\n`;
			}

			if (rules.allow && rules.allow.length > 0) {
				rules.allow.forEach(path => {
					output += `Allow: ${path}\n`;
				});
			}

			if (rules.disallow && rules.disallow.length > 0) {
				rules.disallow.forEach(path => {
					output += `Disallow: ${path}\n`;
				});
			}

			output += '\n';
		}

		// Global crawl-delay for all bots
		if (this.state.crawlDelay) {
			output += `# Global crawl delay\n`;
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
			output += '# Sitemaps\n';
			this.state.sitemaps.forEach(sitemap => {
				output += `Sitemap: ${sitemap}\n`;
			});
		}

		return output.trim();
	}

	async connectedCallback() {
		this.lang = this.getAttribute('lang') || 'en';
		this._resolveReady();

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
			} else if (e.target.id === 'clean-param-input') {
				const params = e.target.value.split('\n').map(p => p.trim()).filter(p => p);
				this._updateState({ cleanParam: params });
			} else if (e.target.id === 'request-rate-input') {
				this._updateState({ requestRate: e.target.value.trim() || null });
			} else if (e.target.id === 'visit-time-input') {
				this._updateState({ visitTime: e.target.value.trim() || null });
			}
		});
	}

	_renderBotChip(bot, section) {
		const otherSection = section === 'allow' ? 'disallow' : 'allow';
		const moveTitle = section === 'allow' ? this.t('ui.moveToDisallow') : this.t('ui.moveToAllow');

		return `
			<li>
				${bot}
				<button data-move="${otherSection}" data-section="${section}" data-bot="${bot}" title="${moveTitle}">⇄</button>
				<button data-remove data-section="${section}" data-bot="${bot}">×</button>
			</li>
		`;
	}

	_renderSection(section, title, unusedBots) {
		const bots = this.state[section];

		return `
			<details name="robtxt-manager" class="robtxt-${section}" open>
				<summary>${title} (${bots.length})</summary>
				<div>
					<ul data-ul-for="${section}">
						${bots.length > 0
							? bots.map(bot => this._renderBotChip(bot, section)).join('')
							: `<li class="empty">${this.t('ui.noBotsInSection')}</li>`
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
						<div class="bot-suggestions">
							<small>${this.t('ui.quickAddBots')}</small>
							<div class="bot-grid">
								${unusedBots.slice(0, 20).map(bot => `
									<button
										data-add-from-list
										data-section="${section}"
										data-bot="${bot}"
										class="bot-chip"
									>${bot}</button>
								`).join('')}
							</div>
							${unusedBots.length > 20 ? `<small class="muted">${this.t('ui.andMore')} ${unusedBots.length - 20} ${this.t('ui.more')}</small>` : ''}
						</div>
					` : ''}
				</div>
			</details>
		`;
	}

	render() {
		const unusedBots = this._getUnusedBots();
		const allowSection = this._renderSection('allow', this.t('ui.allow'), unusedBots);
		const disallowSection = this._renderSection('disallow', this.t('ui.disallow'), unusedBots);
		const settingsSection = this._renderSettings();
		const sitemapSection = this._renderSitemaps();

		this.shadowRoot.innerHTML = `
			${allowSection}
			${disallowSection}
			${settingsSection}
			${sitemapSection}
			<pre><code>${this.generateRobotsTxt() || this.t('ui.noRules')}</code></pre>
		`;
	}

	_renderSettings() {
		return `
			<details name="robtxt-manager" class="robtxt-settings">
				<summary>${this.t('ui.globalSettings')}</summary>
				<div>
					<fieldset>
						<label for="crawl-delay-input">
							<small>${this.t('ui.crawlDelay')}</small>
						</label>
						<input
							type="number"
							id="crawl-delay-input"
							min="0"
							step="1"
							placeholder="${this.t('ui.noCrawlDelay')}"
							value="${this.state.crawlDelay || ''}"
						>
					</fieldset>

					<fieldset>
						<label for="host-input">
							<small>${this.t('ui.host')}</small>
						</label>
						<input
							type="text"
							id="host-input"
							placeholder="${this.t('ui.hostHint')}"
							value="${this.state.host || ''}"
						>
					</fieldset>

					<fieldset>
						<label for="clean-param-input">
							<small>${this.t('ui.cleanParam')}</small>
						</label>
						<textarea
							id="clean-param-input"
							placeholder="${this.t('ui.cleanParamHint')}"
							rows="3"
						>${this.state.cleanParam.join('\n')}</textarea>
					</fieldset>

					<fieldset>
						<label for="request-rate-input">
							<small>${this.t('ui.requestRate')}</small>
						</label>
						<input
							type="text"
							id="request-rate-input"
							placeholder="${this.t('ui.requestRateHint')}"
							value="${this.state.requestRate || ''}"
						>
					</fieldset>

					<fieldset>
						<label for="visit-time-input">
							<small>${this.t('ui.visitTime')}</small>
						</label>
						<input
							type="text"
							id="visit-time-input"
							placeholder="${this.t('ui.visitTimeHint')}"
							value="${this.state.visitTime || ''}"
						>
					</fieldset>
				</div>
			</details>
		`;
	}

	_renderSitemaps() {
		return `
			<details name="robtxt-manager" class="robtxt-sitemaps">
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
					` : `<p class="empty">${this.t('ui.noSitemaps')}</p>`}
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

customElements.define('robtxt-manager', RobtxtManager);
