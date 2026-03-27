/**
 * content-card — Unified content card web component
 *
 * Attributes:
 *   type      — Schema.org card type (article, recipe, event, etc.)
 *   content   — ID matching a card in the data source
 *   card      — Base layout tokens: "vertical ar(16/9) eyebrow(above)"
 *   card-md   — Layout tokens at container width >= 400px
 *   card-xl   — Layout tokens at container width >= 700px
 */

const SCHEMA_MAP = {
  article: 'Article',
  news: 'NewsArticle',
  product: 'Product',
  event: 'Event',
  recipe: 'Recipe',
  review: 'Review',
  job: 'JobPosting',
  course: 'Course',
  booking: 'Reservation',
  poll: 'Question',
  profile: 'Person',
  faq: 'FAQPage',
  quote: 'Quotation',
  timeline: 'EventSeries',
  gallery: 'ImageGallery',
  statistic: 'Observation',
  achievement: 'EducationalOccupationalCredential',
  announcement: 'SpecialAnnouncement',
  business: 'LocalBusiness',
  comparison: 'ItemList',
  contact: 'ContactPage',
  location: 'Place',
  membership: 'Offer',
  social: 'SocialMediaPosting',
  software: 'SoftwareApplication'
};

/* Token Parser */
function parseTokens(attrValue) {
  if (!attrValue) return null;

  const tokens = {
    layout: 'vertical',
    ar: null,
    split: null,
    eyebrow: null,
    hs: null,
    subgrid: false
  };

  const str = attrValue.trim();

  const layoutMatch = str.match(/^(vertical-r|vertical|horizontal-r|horizontal|overlay\([^)]+\)|media-only|content-only)/);
  if (layoutMatch) tokens.layout = layoutMatch[1];

  const arMatch = str.match(/ar\(([^)]+)\)/);
  if (arMatch) tokens.ar = arMatch[1];

  const splitMatch = str.match(/split\(([^)]+)\)/);
  if (splitMatch) tokens.split = splitMatch[1];

  const eyebrowMatch = str.match(/eyebrow\(([^)]+)\)/);
  if (eyebrowMatch) tokens.eyebrow = eyebrowMatch[1];

  const hsMatch = str.match(/hs\(([^)]+)\)/);
  if (hsMatch) tokens.hs = hsMatch[1];

  if (str.includes('subgrid')) tokens.subgrid = true;

  return tokens;
}

/* Headline size: resolve t-shirt keyword to custom property reference */
function resolveHs(keyword) {
  const sizes = ['sm', 'md', 'lg', 'xl'];
  return sizes.includes(keyword) ? `var(--card-hs-${keyword})` : null;
}

/* Split ratio to fr units */
function toFr(splitValue) {
  if (!splitValue) return null;
  const parts = splitValue.split('/').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return `${parts[0]}fr ${parts[1]}fr`;
}

/* Render Helpers */
function renderImage(source) {
  const alt = source.alt || '';
  const src = source.src || '';
  return `<img src="${src}" alt="${alt}" loading="lazy">`;
}

function renderMedia(data) {
  const media = data.media;
  if (!media?.sources?.length) return '';

  const cardData = data.data || {};
  const ribbon = cardData.ribbon;
  const sticker = cardData.sticker;
  const caption = media.caption;
  const isGallery = media.sources.length > 1;

  let inner;
  if (isGallery) {
    const slides = media.sources
      .map(s => `<div class="cc-gallery-slide">${renderImage(s)}</div>`)
      .join('');
    const dots = media.sources
      .map((_, i) => `<button class="cc-gallery-dot${i === 0 ? ' cc-gallery-dot--active' : ''}"></button>`)
      .join('');
    inner = `
      <div class="cc-gallery">${slides}</div>
      <button class="cc-gallery-arrow cc-gallery-arrow--prev">&#x2192;</button>
      <button class="cc-gallery-arrow cc-gallery-arrow--next">&#x2192;</button>
      <div class="cc-gallery-dots">${dots}</div>
    `;
  } else {
    inner = renderImage(media.sources[0]);
  }

  return `
    <figure class="cc-media${isGallery ? ' cc-media--gallery' : ''}">
      ${ribbon ? `<span class="cc-ribbon">${ribbon.text}</span>` : ''}
      ${sticker ? `<span class="cc-sticker">${sticker.text}</span>` : ''}
      ${inner}
      ${caption ? `<span class="cc-caption">${caption}</span>` : ''}
    </figure>
  `;
}

function renderContent(data, headlineTag = 'h2', skipEyebrow = false) {
  const { headline, subheadline, summary, category, tags, actions, links } = data;

  const parts = [];

  if (category && !skipEyebrow) {
    parts.push(`<span class="cc-eyebrow">${category}</span>`);
  }

  if (headline) {
    parts.push(`<${headlineTag} class="cc-headline">${headline}</${headlineTag}>`);
  }

  if (subheadline) {
    parts.push(`<p class="cc-subheadline">${subheadline}</p>`);
  }

  if (summary) {
    parts.push(`<p class="cc-summary">${summary}</p>`);
  }

  if (tags?.length) {
    const tagHtml = tags.map(t => {
      const name = typeof t === 'string' ? t : t.name;
      return `<span class="cc-tag">${name}</span>`;
    }).join('');
    parts.push(`<div class="cc-tags">${tagHtml}</div>`);
  }

  if (actions?.length) {
    const btns = actions.map(a => {
      const cls = a.style === 'secondary' ? 'cc-btn cc-btn--secondary' : 'cc-btn cc-btn--primary';
      return `<a href="${a.url || '#'}" class="${cls}">${a.text}</a>`;
    }).join('');
    parts.push(`<div class="cc-actions">${btns}</div>`);
  }

  if (links?.length) {
    const items = links.map(l => `<li><a href="${l.url || '#'}">${l.text}</a></li>`).join('');
    parts.push(`<ul class="cc-links">${items}</ul>`);
  }

  if (parts.length === 0) return '';
  return `<div class="cc-content">${parts.join('')}</div>`;
}

/* Web Component */
export default class ContentCard extends HTMLElement {
  static observedAttributes = ['card', 'card-md', 'card-xl', 'type'];

  _data = null;

  constructor() {
    super();
    this.classList.add('cc');
  }

  connectedCallback() {
    this._applyTokens();
    if (this._data) this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._applyTokens();
      if (this._data) this._render();
    }
  }

  _applyTokens() {
    const breakpoints = [
      { attr: 'card', suffix: '' },
      { attr: 'card-md', suffix: '-md' },
      { attr: 'card-xl', suffix: '-xl' }
    ];

    for (const { attr, suffix } of breakpoints) {
      const tokens = parseTokens(this.getAttribute(attr));
      if (!tokens) continue;

      if (tokens.ar) {
        this.style.setProperty(`--card-ar${suffix}`, tokens.ar);
      } else {
        this.style.removeProperty(`--card-ar${suffix}`);
      }

      if (tokens.split) {
        const fr = toFr(tokens.split);
        if (fr) this.style.setProperty(`--card-split${suffix}`, fr);
      } else {
        this.style.removeProperty(`--card-split${suffix}`);
      }

      const hsProp = suffix ? `--card-hs${suffix}` : '--card-hs';
      if (tokens.hs) {
        const resolved = resolveHs(tokens.hs);
        if (resolved) this.style.setProperty(hsProp, resolved);
      } else {
        this.style.removeProperty(hsProp);
      }
    }
  }

  _applySchema() {
    const type = this.getAttribute('type');
    const schemaType = SCHEMA_MAP[type] || 'CreativeWork';
    this.setAttribute('itemscope', '');
    this.setAttribute('itemtype', `https://schema.org/${schemaType}`);
  }

  _render() {
    if (!this._data) return;

    this._applySchema();

    const baseTokens = parseTokens(this.getAttribute('card') || 'vertical');
    const headlineTag = this._data.data?.content?.headlineTag || 'h2';
    const hasEyebrowPlacement = baseTokens.eyebrow && this._data.category;

    const mediaHtml = renderMedia(this._data);
    const contentHtml = renderContent(this._data, headlineTag, hasEyebrowPlacement);

    let eyebrowAboveHtml = '';
    let eyebrowOutsideHtml = '';

    if (hasEyebrowPlacement) {
      const eyebrowText = this._data.category;
      if (baseTokens.eyebrow === 'above') {
        eyebrowAboveHtml = `<span class="cc-eyebrow--above">${eyebrowText}</span>`;
      } else if (baseTokens.eyebrow === 'outside') {
        eyebrowOutsideHtml = `<span class="cc-eyebrow--outside">${eyebrowText}</span>`;
      }
    }

    const innerHtml = `${eyebrowAboveHtml}${mediaHtml}${contentHtml}`;
    this.textContent = '';

    if (eyebrowOutsideHtml) {
      const outsideEl = document.createElement('span');
      outsideEl.className = 'cc-eyebrow--outside';
      outsideEl.textContent = this._data.category;
      this.appendChild(outsideEl);
    }

    const inner = document.createElement('div');
    inner.className = 'cc-inner';
    inner.innerHTML = innerHtml;
    this.appendChild(inner);
  }

  set data(value) {
    this._data = value;
    if (this.isConnected) {
      this._applyTokens();
      this._render();
    }
  }

  get data() {
    return this._data;
  }
}

customElements.define('content-card', ContentCard);
