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
  const str = attrValue.trim();
  const tokens = {
    layout: 'vertical',
    eyebrow: null,
    subgrid: false
  };

  const layoutMatch = str.match(/^(vertical-r|vertical|horizontal-r|horizontal|overlay\([^)]+\)|media-only|content-only)/);
  if (layoutMatch) tokens.layout = layoutMatch[1];

  const eyebrowMatch = str.match(/eyebrow\(([^)]+)\)/);
  if (eyebrowMatch) tokens.eyebrow = eyebrowMatch[1];

  if (str.includes('subgrid')) tokens.subgrid = true;

  return tokens;
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

function renderContent(data, headlineTag = 'h2', skipEyebrow = false, clickable = null) {
  const { headline, subheadline, summary, category, tags, actions, links } = data;

  /* Determine if stretched-link applies:
     clickable attribute present + exactly 1 link with a url */
  const isStretched = clickable !== null && links?.length === 1 && links[0].url;
  const hideLink = clickable === 'hide';

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

  if (isStretched) {
    const link = links[0];
    const hideCls = hideLink ? ' cc-stretched-link--hidden' : '';
    parts.push(`<a href="${link.url}" class="cc-stretched-link${hideCls}">${link.text}</a>`);
  } else if (links?.length) {
    const items = links.map(l => `<li><a href="${l.url || '#'}">${l.text}</a></li>`).join('');
    parts.push(`<ul class="cc-links">${items}</ul>`);
  }

  if (parts.length === 0) return '';
  return `<div class="cc-content">${parts.join('')}</div>`;
}

/* Web Component */
export default class ContentCard extends HTMLElement {
  static observedAttributes = ['card', 'card-md', 'card-xl', 'type', 'clickable'];

  _data = null;

  constructor() {
    super();
    this.classList.add('cc');
  }

  connectedCallback() {
    if (this._data) this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (this._data) this._render();
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

    /* clickable: attribute present = '' (empty string), clickable="hide" = 'hide', absent = null */
    const clickableAttr = this.getAttribute('clickable');
    const clickable = clickableAttr !== null ? (clickableAttr || true) : null;

    const mediaHtml = renderMedia(this._data);
    const contentHtml = renderContent(this._data, headlineTag, hasEyebrowPlacement, clickable);

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
      this._render();
    }
  }

  get data() {
    return this._data;
  }
}

customElements.define('content-card', ContentCard);
