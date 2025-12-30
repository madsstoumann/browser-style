# Web Config Robots - Internal Architecture

## Overview

Web Config Robots is a **web component for editing robots.txt files** with a visual interface for managing crawler permissions, sitemaps, and advanced directives. It parses existing robots.txt files and generates RFC 9309 compliant output.

**Component Type:** Web Component (Custom Element)

**Tag Name:** `web-config-robots`

**Total LOC:** 1109 lines (single file component + i18n JSON)

**Key architectural decisions:**
- **RFC 9309 compliant**: Follows robots.txt specification for parsing and generation
- **Bot classification**: Simple allow/disallow lists plus per-bot custom rules
- **Non-destructive import**: Merges imported lists without overwriting user changes
- **Accordion sections**: Uses `<details>` elements with state persistence
- **Event-driven updates**: `robtxt-change` custom event for parent communication

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
Create shadow DOM + translator
  ↓
Initialize default state
  ↓
Create ready Promise
  ↓
connectedCallback()
  ↓
Resolve ready Promise
  ↓
Check src attribute → Load and parse robots.txt
  OR
Check value attribute → Parse inline robots.txt
  ↓
Check allow/disallow URLs → Load bot lists
  ↓
Check initial-config → Apply JSON config
  ↓
render() + attach event listeners
  ↓
User edits form
  ↓
_updateState() → render or partial update
  ↓
Dispatch robtxt-change event
```

### Data Flow

```
Input Sources:
  ├─ src attribute → _loadFromRobotsTxt() → fromString()
  ├─ value attribute → fromString()
  ├─ allow attribute → _loadBotsFromUrl('allow')
  ├─ disallow attribute → _loadBotsFromUrl('disallow')
  ├─ lists attribute → Import buttons in settings
  └─ initial-config attribute → config setter

           ↓

Internal State (this.state):
  ├─ allow: string[]           Bot names allowed to crawl
  ├─ disallow: string[]        Bot names blocked from crawling
  ├─ botRules: object          Per-bot path rules and crawl-delay
  ├─ sitemaps: string[]        Sitemap URLs
  ├─ crawlDelay: number|null   Global crawl delay
  ├─ host: string|null         Preferred host directive
  ├─ cleanParam: string[]      URL parameters to ignore
  ├─ requestRate: string|null  Request rate limit
  ├─ visitTime: string|null    Preferred visit time
  └─ availableBots: string[]   Known bot names for suggestions

           ↓

Output:
  └─ generateRobotsTxt() → robots.txt string
```

## File Structure

```
web-config-robots/
├── src/
│   ├── index.js        1109 lines   Main web component
│   └── i18n.json       ---          Translation strings
├── demo.html           ---          Demo page
└── claude.md           ---          This file
```

## Component API

### Class Definition

**File:** [src/index.js](src/index.js)

**Lines 15-1108:** `WebConfigRobots extends HTMLElement`

**Registration:** Line 1108: `customElements.define('web-config-robots', WebConfigRobots);`

### Static Properties (Lines 16-18)

```javascript
static get observedAttributes() {
  return ['allow', 'disallow', 'src', 'value', 'lists'];
}
```

### Constructor (Lines 20-41)

```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this._loadStyles();
  this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');
  this.listUrls = [];
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
```

### Observed Attributes

| Attribute | Lines | Description |
|-----------|-------|-------------|
| `allow` | 767-772, 806-810 | URL to load allowed bots list |
| `disallow` | 775-778, 806-810 | URL to load disallowed bots list |
| `src` | 756-761, 796-800 | URL to load existing robots.txt |
| `value` | 757, 762-763, 801-802 | Inline robots.txt content |
| `lists` | 753, 803-805 | Comma/semicolon-separated import URLs |
| `lang` | 751 | Language code for translations |
| `initial-config` | 780-788 | JSON configuration object |

### Properties

#### `config` (Lines 511-556)

```javascript
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
  // Validates and applies configuration
  // Triggers render and change event
}
```

#### `value` (Lines 558-564)

```javascript
get value() {
  return this.generateRobotsTxt();
}

set value(val) {
  this.fromString(val);
}
```

#### `robotsTxt` (Lines 566-568)

```javascript
get robotsTxt() {
  return this.generateRobotsTxt();
}
```

### Lifecycle Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `connectedCallback()` | 750-793 | Load data from attributes, initial render |
| `attributeChangedCallback()` | 795-812 | Handle attribute changes |

### Instance Methods

#### Parsing Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `_parseRobotsTxtToConfig(text)` | 93-243 | Parse robots.txt to config object |
| `_parseRobotsTxt(text)` | 411-423 | Extract bot names from text |
| `fromString(robotsTxtString)` | 570-593 | Apply parsed config to state |

#### State Management

| Method | Lines | Purpose |
|--------|-------|---------|
| `_updateState(partialState)` | 452-472 | Update state, trigger render |
| `_normalizeAllowDisallow(partialState)` | 425-450 | Dedupe and filter lists |

#### Bot Management

| Method | Lines | Purpose |
|--------|-------|---------|
| `_addBot(section, bot)` | 607-623 | Add bot to allow/disallow |
| `_removeBot(section, bot)` | 625-628 | Remove bot from section |
| `_moveBot(from, to, bot)` | 630-640 | Move bot between sections |
| `_getUnusedBots()` | 642-645 | Get bots not yet assigned |

#### Global Path Rules

| Method | Lines | Purpose |
|--------|-------|---------|
| `_getGlobalPathRules()` | 245-251 | Get User-agent: * rules |
| `_addGlobalPathRule(type, pattern)` | 253-278 | Add Allow/Disallow path |
| `_removeGlobalPathRule(type, pattern)` | 280-302 | Remove path rule |

#### Sitemap Management

| Method | Lines | Purpose |
|--------|-------|---------|
| `addSitemap(url)` | 648-651 | Add sitemap URL |
| `removeSitemap(url)` | 653-656 | Remove sitemap URL |
| `setCrawlDelay(seconds)` | 659-661 | Set global crawl delay |

#### Import/Merge

| Method | Lines | Purpose |
|--------|-------|---------|
| `importFromUrl(url)` | 354-365 | Fetch and merge robots.txt |
| `_mergeImportedConfig(parsed)` | 304-352 | Non-destructive merge |
| `_loadBotsFromUrl(url, section)` | 375-399 | Load bot list from URL |
| `_loadFromRobotsTxt(url)` | 401-409 | Load full robots.txt |

#### Rendering

| Method | Lines | Purpose |
|--------|-------|---------|
| `render()` | 951-969 | Full component render |
| `_renderSection(section, title, unusedBots)` | 906-949 | Render allow/disallow section |
| `_renderBotChip(bot, section)` | 890-904 | Render individual bot chip |
| `_renderSettings()` | 971-1077 | Render settings panel |
| `_renderSitemaps()` | 1079-1105 | Render sitemaps panel |

#### Output

| Method | Lines | Purpose |
|--------|-------|---------|
| `generateRobotsTxt()` | 663-748 | Generate robots.txt output |
| `dispatchChangeEvent()` | 595-605 | Fire robtxt-change event |

### Events

#### `robtxt-change` (Lines 595-605)

```javascript
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
```

## Regex Patterns (Lines 5-13)

### Parsing Constants

```javascript
const RE_USER_AGENT = /^User-agent:\s*(.+)$/i;
const RE_SITEMAP = /^Sitemap:\s*(.+)$/i;
const RE_CRAWL_DELAY = /^Crawl-delay:\s*(\d+)$/i;
const RE_HOST = /^Host:\s*(.+)$/i;
const RE_CLEAN_PARAM = /^Clean-param:\s*(.+)$/i;
const RE_REQUEST_RATE = /^Request-rate:\s*(.+)$/i;
const RE_VISIT_TIME = /^Visit-time:\s*(.+)$/i;
const RE_ALLOW = /^Allow:\s*(.*)$/i;
const RE_DISALLOW = /^Disallow:\s*(.*)$/i;
```

## robots.txt Parser (Lines 93-243)

### _parseRobotsTxtToConfig(robotsTxtString)

#### Group Tracking (Lines 104-109)

```javascript
const lines = String(robotsTxtString || '').split('\n');
let currentBot = null;
let currentRules = null;
let groupBots = [];
let groupHasDirectives = false;
```

#### Comment Handling (Lines 112-116)

```javascript
// RFC 9309: end-of-line may have optional trailing comment.
const commentIndex = line.indexOf('#');
const withoutComment = commentIndex === -1 ? line : line.slice(0, commentIndex);
const trimmed = withoutComment.trim();
```

#### User-Agent Group Logic (Lines 127-143)

```javascript
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
```

#### Allow/Disallow Path Handling (Lines 191-221)

```javascript
if (groupBots.length > 0 && (allowMatch || disallowMatch)) {
  const isAllow = !!allowMatch;
  const path = (allowMatch || disallowMatch)[1].trim();
  const listKey = isAllow ? 'allow' : 'disallow';

  for (const bot of groupBots) {
    const rules = botRules[bot] || (botRules[bot] = { allow: [], disallow: [], crawlDelay: null });

    // Special-case '*' (RFC fallback group)
    if (bot === '*') {
      if (!rules[listKey].includes(path)) rules[listKey].push(path);
      continue;
    }

    if (path === '/') {
      // Full site allow/disallow - move to simple lists
      const targetList = isAllow ? allow : disallow;
      if (!targetList.includes(bot)) targetList.push(bot);
    } else if (path === '') {
      // Disallow: (empty) means Allow everything.
      if (!isAllow && !allow.includes(bot)) allow.push(bot);
    } else if (!rules[listKey].includes(path)) {
      rules[listKey].push(path);
    }
  }
}
```

## URL Normalization (Lines 43-83)

### GitHub URL Conversion (Lines 53-73)

```javascript
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
```

### URL Label Extraction (Lines 75-83)

```javascript
_labelForImportUrl(url) {
  try {
    const u = new URL(url);
    const file = u.pathname.split('/').filter(Boolean).pop();
    return file || u.hostname;
  } catch {
    return url;
  }
}
```

## State Normalization (Lines 425-450)

### _normalizeAllowDisallow(partialState)

```javascript
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

  // Disallow wins - filter out bots in both lists
  const disallowSet = new Set(nextDisallow);
  const filteredAllow = nextAllow.filter(bot => !disallowSet.has(bot));

  return {
    ...partialState,
    allow: filteredAllow,
    disallow: nextDisallow
  };
}
```

## State Update Logic (Lines 452-472)

### _updateState(partialState)

```javascript
_updateState(partialState) {
  const nextPartialState = (partialState && (Object.hasOwn(partialState, 'allow') || Object.hasOwn(partialState, 'disallow')))
    ? this._normalizeAllowDisallow(partialState)
    : partialState;

  const changedKeys = setState(this, nextPartialState);
  if (changedKeys.length === 0) return;

  const needsFullRender = changedKeys.some(k =>
    k === 'allow' || k === 'disallow' || k === 'availableBots' || k === 'botRules');
  const updateSitemaps = changedKeys.includes('sitemaps');
  const updateSettings = changedKeys.some(k =>
    ['crawlDelay', 'host', 'cleanParam', 'requestRate', 'visitTime'].includes(k));

  if (needsFullRender) {
    this.render();
  } else {
    if (updateSitemaps) this._updateSitemapsSection();
    if (updateSettings) this._updateSettingsSection();
    this._updateOutput();
  }
  this.dispatchChangeEvent();
}
```

## Non-Destructive Merge (Lines 304-352)

### _mergeImportedConfig(parsed)

```javascript
_mergeImportedConfig(parsed) {
  // Non-destructive merge: if the user has already placed a bot in one
  // section, do not re-add it to the opposite section on subsequent imports.
  const currentAllowSet = new Set(this.state.allow || []);
  const currentDisallowSet = new Set(this.state.disallow || []);

  const importedAllow = (parsed.allow || []).filter(bot => !currentDisallowSet.has(bot));
  const importedDisallow = (parsed.disallow || []).filter(bot => !currentAllowSet.has(bot));

  const mergedAllow = [...new Set([...(this.state.allow || []), ...importedAllow])];
  const mergedDisallow = [...new Set([...(this.state.disallow || []), ...importedDisallow])];

  // Merge per-bot rules
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

  // Remove bot rules for bots that are in allow or disallow lists
  const disallowSet = new Set(mergedDisallow);
  const allowSet = new Set(mergedAllow);
  for (const bot of Object.keys(mergedBotRules)) {
    if (disallowSet.has(bot) || allowSet.has(bot)) delete mergedBotRules[bot];
  }

  // Collect all known bots
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
```

## robots.txt Generator (Lines 663-748)

### generateRobotsTxt()

#### Simple Allow Section (Lines 666-673)

```javascript
if (this.state.allow.length > 0) {
  output += `# ${this.t('output.allowedBots')}\n`;
  this.state.allow.forEach(bot => {
    output += `User-agent: ${bot}\n`;
  });
  output += `Allow: /\n\n`;
}
```

#### Simple Disallow Section (Lines 675-682)

```javascript
if (this.state.disallow.length > 0) {
  output += `# ${this.t('output.disallowedBots')}\n`;
  this.state.disallow.forEach(bot => {
    output += `User-agent: ${bot}\n`;
  });
  output += `Disallow: /\n\n`;
}
```

#### Per-Bot Custom Rules (Lines 686-719)

```javascript
for (const [bot, rules] of Object.entries(this.state.botRules)) {
  const allowPaths = Array.isArray(rules?.allow) ? rules.allow : [];
  const disallowPaths = Array.isArray(rules?.disallow) ? rules.disallow : [];
  const crawl = rules?.crawlDelay;

  // Skip empty groups
  const hasInlineCrawlDelay = Boolean(crawl);
  const shouldInlineGlobalCrawlDelay = bot === '*' && this.state.crawlDelay && !hasInlineCrawlDelay;
  const hasAnyRule = hasInlineCrawlDelay || shouldInlineGlobalCrawlDelay ||
    allowPaths.length > 0 || disallowPaths.length > 0;
  if (!hasAnyRule) continue;

  output += `# ${this.t('output.customRulesFor')} ${bot}\n`;
  output += `User-agent: ${bot}\n`;

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
```

#### Global Crawl Delay (Lines 721-726)

```javascript
if (this.state.crawlDelay && !hasGlobalPathRules) {
  output += `# ${this.t('output.globalCrawlDelay')}\n`;
  output += `User-agent: *\n`;
  output += `Crawl-delay: ${this.state.crawlDelay}\n\n`;
}
```

#### Other Global Settings (Lines 728-737)

```javascript
if (this.state.host) output += `Host: ${this.state.host}\n`;
if (this.state.requestRate) output += `Request-rate: ${this.state.requestRate}\n`;
if (this.state.visitTime) output += `Visit-time: ${this.state.visitTime}\n`;
if (this.state.cleanParam.length > 0) {
  this.state.cleanParam.forEach(param => {
    output += `Clean-param: ${param}\n`;
  });
}
```

#### Sitemaps (Lines 739-745)

```javascript
if (this.state.sitemaps.length > 0) {
  output += `# ${this.t('output.sitemaps')}\n`;
  this.state.sitemaps.forEach(sitemap => {
    output += `Sitemap: ${sitemap}\n`;
  });
}
```

## Event Handling (Lines 814-888)

### _attachEventListeners()

#### Click Handler (Lines 815-867)

```javascript
this.shadowRoot.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target) return;

  // Import from list URL
  if (target.dataset.importList !== undefined) {
    const url = target.dataset.url;
    this.importFromUrl(url);
    return;
  }

  // Add global path rule
  if (target.dataset.addGlobalRule !== undefined) {
    const type = this.shadowRoot.querySelector('#global-rule-type')?.value;
    const input = this.shadowRoot.querySelector('#global-rule-pattern');
    const pattern = input?.value;
    this._addGlobalPathRule(type, pattern);
    if (input) input.value = '';
    return;
  }

  // Remove global path rule
  if (target.dataset.removeGlobalRule !== undefined) {
    const type = target.dataset.type;
    const pattern = target.dataset.pattern;
    this._removeGlobalPathRule(type, pattern);
    return;
  }

  // Bot management actions
  const section = target.dataset.section;
  const bot = target.dataset.bot;

  if (target.dataset.add !== undefined) { ... }
  else if (target.dataset.remove !== undefined) { ... }
  else if (target.dataset.move !== undefined) { ... }
  else if (target.dataset.addFromList !== undefined) { ... }
  else if (target.dataset.addSitemap !== undefined) { ... }
  else if (target.dataset.removeSitemap !== undefined) { ... }
});
```

#### Input Handler (Lines 869-880)

```javascript
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
```

#### Change Handler (Lines 882-887)

```javascript
this.shadowRoot.addEventListener('change', (e) => {
  if (e.target.id === 'clean-param-input') {
    const params = e.target.value.split('\n').map(p => p.trim()).filter(p => p);
    this._updateState({ cleanParam: params });
  }
});
```

## Shadow DOM Structure

### Allow/Disallow Section (Lines 906-949)

```html
<details name="robtxt-manager" data-panel="allow" open data-status="ok">
  <summary>Allowed Bots (5)</summary>
  <div>
    <ul data-ul-for="allow">
      <li data-status="ok">
        Googlebot
        <button data-move="disallow" data-section="allow" data-bot="Googlebot">⇄</button>
        <button data-remove data-section="allow" data-bot="Googlebot">×</button>
      </li>
      <!-- ... more bots ... -->
    </ul>
    <fieldset>
      <input type="text" data-section="allow" placeholder="Add custom bot" list="allow-bots">
      <button data-add data-section="allow">Add</button>
    </fieldset>
    <datalist id="allow-bots">
      <option value="UnusedBot1"></option>
      <!-- ... unused bots ... -->
    </datalist>
    <small>Quick add bots:</small>
    <ul>
      <li><button data-add-from-list data-section="allow" data-bot="UnusedBot1">UnusedBot1</button></li>
      <!-- ... more quick add buttons ... -->
    </ul>
  </div>
</details>
```

### Settings Section (Lines 971-1077)

```html
<details name="robtxt-settings" data-panel="settings">
  <summary>Global Settings</summary>
  <div>
    <!-- Import buttons -->
    <div>
      <small>Import bot lists:</small>
      <button data-import-list data-url="...">Import filename.txt</button>
    </div>

    <!-- Global path rules for User-agent: * -->
    <ul>
      <li data-status="ok">
        Allow: /public/
        <button data-remove-global-rule data-type="allow" data-pattern="/public/">×</button>
      </li>
    </ul>
    <label>
      <small>Path rules for all bots:</small>
      <select id="global-rule-type">
        <option value="disallow">Disallow</option>
        <option value="allow">Allow</option>
      </select>
    </label>
    <fieldset>
      <input type="text" id="global-rule-pattern" placeholder="/path/to/block">
      <button data-add-global-rule>Add</button>
    </fieldset>

    <!-- Other settings -->
    <label for="crawl-delay-input">
      <small>Crawl Delay (seconds)</small>
      <input type="number" id="crawl-delay-input" min="0" step="1">
    </label>
    <label for="host-input">
      <small>Host</small>
      <input type="text" id="host-input" placeholder="example.com">
    </label>
    <label for="clean-param-input">
      <small>Clean Parameters</small>
      <textarea id="clean-param-input" rows="3"></textarea>
    </label>
    <label for="request-rate-input">
      <small>Request Rate</small>
      <input type="text" id="request-rate-input" placeholder="1/10">
    </label>
    <label for="visit-time-input">
      <small>Visit Time</small>
      <input type="text" id="visit-time-input" placeholder="0600-0845">
    </label>
  </div>
</details>
```

### Sitemaps Section (Lines 1079-1105)

```html
<details name="robtxt-sitemaps" data-panel="sitemaps" data-status="info">
  <summary>Sitemaps (2)</summary>
  <div>
    <ul>
      <li>
        https://example.com/sitemap.xml
        <button data-remove-sitemap data-sitemap="https://example.com/sitemap.xml">×</button>
      </li>
    </ul>
    <fieldset>
      <input type="url" id="sitemap-input" placeholder="https://example.com/sitemap.xml">
      <button data-add-sitemap>Add Sitemap</button>
    </fieldset>
  </div>
</details>
```

## Dependencies

### Imports (Lines 1-3)

| Import | Source | Purpose |
|--------|--------|---------|
| `i18nData` | `./i18n.json` | Translation strings |
| `adoptSharedStyles` | `@browser.style/web-config-shared` | Shared CSS |
| `captureOpenDetailsState` | `@browser.style/web-config-shared` | Accordion persistence |
| `createTranslator` | `@browser.style/web-config-shared` | i18n function |
| `restoreOpenDetailsState` | `@browser.style/web-config-shared` | Accordion persistence |
| `setState` | `@browser.style/web-config-shared` | State management |

## State Structure

```javascript
{
  allow: string[],           // Bot names allowed to crawl (full site)
  disallow: string[],        // Bot names blocked (full site)
  botRules: {                // Per-bot custom rules
    '*': {                   // Global rules for all bots
      allow: string[],       // Allowed paths
      disallow: string[],    // Disallowed paths
      crawlDelay: number|null
    },
    'Googlebot': {
      allow: ['/api/'],
      disallow: ['/admin/'],
      crawlDelay: 5
    }
  },
  sitemaps: string[],        // Sitemap URLs
  crawlDelay: number|null,   // Global crawl delay
  host: string|null,         // Preferred host directive
  cleanParam: string[],      // URL parameters to ignore
  requestRate: string|null,  // Request rate limit
  visitTime: string|null,    // Preferred visit time
  availableBots: string[]    // Known bot names for suggestions
}
```

## Gotchas & Edge Cases

### 1. Ready Promise for Async Operations (Line 39)

```javascript
this.ready = new Promise(resolve => this._resolveReady = resolve);
```

**Purpose:** `fromString()` waits for `ready` before applying config (Line 572).

### 2. Disallow Wins Over Allow (Lines 442-443)

```javascript
const disallowSet = new Set(nextDisallow);
const filteredAllow = nextAllow.filter(bot => !disallowSet.has(bot));
```

**Behavior:** If a bot is in both lists, it stays in disallow only.

### 3. Non-Destructive Import (Lines 307-311)

```javascript
const importedAllow = (parsed.allow || []).filter(bot => !currentDisallowSet.has(bot));
const importedDisallow = (parsed.disallow || []).filter(bot => !currentAllowSet.has(bot));
```

**Behavior:** Importing won't move bots that user has already categorized.

### 4. Empty Disallow Means Allow (Lines 212-214)

```javascript
} else if (path === '') {
  // Disallow: (empty) means Allow everything.
  if (!isAllow && !allow.includes(bot)) allow.push(bot);
}
```

**RFC 9309:** `Disallow:` with empty path is equivalent to allowing.

### 5. GitHub URL Conversion (Lines 56-67)

```javascript
if (u.hostname === 'github.com') {
  // Convert /owner/repo/blob/branch/path to raw.githubusercontent.com URL
}
```

**UX:** Users can paste GitHub blob URLs for bot lists.

### 6. Global Crawl Delay Inlining (Lines 694-704)

```javascript
const shouldInlineGlobalCrawlDelay = bot === '*' && this.state.crawlDelay && !hasInlineCrawlDelay;
```

**Optimization:** If User-agent: * has path rules, inline the crawl-delay there instead of separate block.

### 7. Clean-Param Uses Change Event (Lines 882-886)

```javascript
this.shadowRoot.addEventListener('change', (e) => {
  if (e.target.id === 'clean-param-input') { ... }
});
```

**UX:** Textarea updates on blur, not on every keystroke.

### 8. Bot Rules Removed for Simple Lists (Lines 334-338)

```javascript
for (const bot of Object.keys(mergedBotRules)) {
  if (disallowSet.has(bot) || allowSet.has(bot)) delete mergedBotRules[bot];
}
```

**Logic:** Bots in allow/disallow simple lists don't need separate botRules entries.

### 9. Comment Stripping (Lines 114-116)

```javascript
const commentIndex = line.indexOf('#');
const withoutComment = commentIndex === -1 ? line : line.slice(0, commentIndex);
```

**RFC 9309:** Comments can appear inline after directives.

### 10. Attribute Change Deduplication (Lines 797-798)

```javascript
if (newValue && this._loadedUrls.src !== newValue) {
  this._loadedUrls.src = newValue;
```

**Optimization:** Track loaded URLs to prevent duplicate fetches.

## Usage Examples

### Basic Usage

```html
<web-config-robots lang="en"></web-config-robots>

<script type="module">
  import '@browser.style/web-config-robots';

  const editor = document.querySelector('web-config-robots');
  editor.addEventListener('robtxt-change', (e) => {
    console.log('Config:', e.detail.config);
    console.log('Output:', e.detail.robotsTxt);
  });
</script>
```

### Load Existing robots.txt

```html
<web-config-robots src="/robots.txt"></web-config-robots>
```

### Load Bot Lists

```html
<web-config-robots
  allow="https://example.com/good-bots.txt"
  disallow="https://example.com/bad-bots.txt"
></web-config-robots>
```

### Import Lists via Settings Panel

```html
<web-config-robots
  lists="https://github.com/user/repo/blob/main/bots.txt;https://example.com/crawlers.txt"
></web-config-robots>
```

### Programmatic Configuration

```javascript
const editor = document.querySelector('web-config-robots');

// Set configuration
editor.config = {
  allow: ['Googlebot', 'Bingbot'],
  disallow: ['BadBot', 'EvilCrawler'],
  sitemaps: ['https://example.com/sitemap.xml'],
  crawlDelay: 10
};

// Get current output
console.log(editor.robotsTxt);
```

## Translation Keys

```json
{
  "ui": {
    "allow": "Allow",
    "disallow": "Disallow",
    "add": "Add",
    "noBotsInSection": "No bots in this section",
    "addCustomBot": "Add custom bot...",
    "quickAddBots": "Quick add bots:",
    "moveToAllow": "Move to Allow",
    "moveToDisallow": "Move to Disallow",
    "globalSettings": "Global Settings",
    "pathRulesStar": "Path rules for all bots (*)",
    "pathRulePlaceholder": "/path/to/block",
    "crawlDelay": "Crawl Delay (seconds)",
    "noCrawlDelay": "No delay",
    "host": "Host",
    "hostHint": "example.com",
    "cleanParam": "Clean Parameters",
    "cleanParamHint": "One per line",
    "requestRate": "Request Rate",
    "requestRateHint": "1/10",
    "visitTime": "Visit Time",
    "visitTimeHint": "0600-0845",
    "sitemaps": "Sitemaps",
    "noSitemaps": "No sitemaps configured",
    "sitemapPlaceholder": "https://example.com/sitemap.xml",
    "addSitemap": "Add Sitemap",
    "import": "Import",
    "importBotLists": "Import bot lists:",
    "noRules": "No rules configured"
  },
  "output": {
    "allowedBots": "Allowed Bots",
    "disallowedBots": "Disallowed Bots",
    "customRulesFor": "Custom rules for",
    "globalCrawlDelay": "Global Crawl Delay",
    "sitemaps": "Sitemaps"
  }
}
```

## Generated Output Example

```txt
# Allowed Bots
User-agent: Googlebot
User-agent: Bingbot
Allow: /

# Disallowed Bots
User-agent: BadBot
User-agent: EvilCrawler
Disallow: /

# Custom rules for *
User-agent: *
Crawl-delay: 10
Allow: /public/
Disallow: /admin/
Disallow: /private/

Host: example.com
Request-rate: 1/10

# Sitemaps
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-images.xml
```

## Related Components

- [web-config-shared](../web-config-shared/) - Shared utilities and styles

## Debugging Tips

1. **Bots not loading?** Check URL in `allow`/`disallow` attribute is accessible
2. **Import not working?** Verify GitHub URLs are converted to raw URLs
3. **Bots disappearing?** Check disallow-wins logic in `_normalizeAllowDisallow`
4. **Config not applying?** Wait for `ready` promise before calling `fromString`
5. **Output missing crawl-delay?** Check if it's inlined in User-agent: * block
6. **Accordion state lost?** Verify `data-panel` attributes match
7. **Translation missing?** Check language code matches i18n.json keys
