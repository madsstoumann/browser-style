# Content Card Component Library - Internal Architecture

## Overview

`content-card` is a comprehensive **custom element component library** with 25 specialized card types for rendering rich, semantic content with Schema.org structured data. Each card type extends a common `BaseCard` class and uses shared rendering utilities.

**Version:** 1.0.0

**Component Type:** Autonomous custom elements extending HTMLElement

**Total Source:** ~3,768 lines across 28 JavaScript files + 25 CSS component files

**Key architectural decisions:**
- **Inheritance pattern**: All cards extend `BaseCard` for shared lifecycle and settings
- **Render utilities**: Centralized `utils.js` provides 20+ render helper functions
- **Schema.org integration**: Conditional microdata markup via `useSchema` setting
- **Responsive images**: Integration with `@browser.style/layout` srcset system
- **No Shadow DOM**: Cards render to light DOM innerHTML for easier styling

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  Add 'cc' class to element
  ↓
connectedCallback()
  ↓
  _ensureSettingsInitialized()
  ↓
  Check if _data exists
  ↓
  _prepareAndRender()
      ↓
      Validate data presence
      ↓
      _setSchema(schemaType)  // if useSchema=true
      ↓
      render()  // Card-specific HTML generation
      ↓
      innerHTML = rendered HTML
  ↓
  initializePopoverToggleListeners()  // if has popovers
```

### Data Flow Pipeline

```
1. HTML: <article-card content="article-1"></article-card>

2. runtime.js loads JSON from dataSrc
       ↓
3. initializeCards() finds matching data by ID
       ↓
4. Sets element._data = { ...cardData }
       ↓
5. BaseCard._prepareAndRender() validates data
       ↓
6. Card.render() generates HTML string with:
   - Schema.org microdata (conditional)
   - Media rendering (images/videos/YouTube)
   - Content sections
   - Interactive elements
       ↓
7. innerHTML replaced with generated markup
       ↓
8. initializePopoverToggleListeners() attaches handlers
       ↓
9. Card ready for user interaction
```

## Unified Data Model

All card data is stored in a single JSON file: `public/static/data/all-cards.json`. This unified format is compatible with the `web-config-card` component for visual editing.

### Card Data Structure

Each card follows this common structure:

```javascript
{
  "id": "unique-id",           // Required: Unique identifier for the card
  "type": "product",           // Required: Card type (25 types available)
  "media": {                   // Optional: Common media structure
    "sources": [
      { "type": "image", "src": "...", "alt": "..." }
    ],
    "caption": "...",
    "ribbon": { "text": "...", "style": "..." },
    "sticker": { "text": "...", "style": "...", "position": "..." }
  },
  "content": {                 // Common content fields
    "category": "...",
    "headline": "...",
    "subheadline": "...",
    "summary": "...",
    "published": { "datetime": "...", "formatted": "..." },
    "readingTime": "..."
  },
  "authors": [...],            // Optional: Author information
  "tags": [...],               // Optional: Tags (string[] or {name, url}[])
  "actions": [...],            // Optional: Action buttons
  "links": [...],              // Optional: Related links
  "engagement": {...},         // Optional: Engagement metrics

  // Type-specific data in named property:
  "product": {...},            // For type="product"
  "recipe": {...},             // For type="recipe"
  "profile": {...},            // etc.
}
```

### Type-Specific Properties

The differences between card types are contained in a property matching the type name:

| Card Type | Type Property | Key Fields |
|-----------|---------------|------------|
| product | `product` | price, availability, rating |
| recipe | `recipe` | prepTime, cookTime, servings, instructions |
| event | `event` | startDate, endDate, location, organizer |
| job | `job` | company, salaryRange, qualifications, benefits |
| course | `course` | duration, difficultyLevel, instructor, price |
| profile | `profile` | jobTitle, organization, skills, contacts |
| booking | `booking` | serviceName, venue, capacity, availableSlots |
| review | `review` | rating, reviewer, productReviewed |
| business | `business` | address, telephone, openingHours |
| location | `location` | address, geo, hours, amenities |
| membership | `membership` | planName, price, features, limitations |
| announcement | `announcement` | priority, effectiveDate, targetAudience |
| achievement | `achievement` | achievementName, issuingOrganization, dateEarned |
| software | `software` | version, operatingSystem, developer, price |
| statistic | `statistic` | metricName, currentValue, trend |
| social | `social` | platform, author, postContent, hashtags |
| comparison | `comparison` | items, criteria, recommendation |
| gallery | `gallery` | totalCount, albumName, categories |
| contact | `contact` | contactType, contactMethods, availableHours |
| poll | `poll` | endpoint, allowMultiple, showResults |

Cards without type-specific data (article, news, quote, faq, timeline) use only the common `content` structure.

## File Structure

```
content-card/
├── src/
│   ├── js/
│   │   ├── base/
│   │   │   ├── BaseCard.js         # Abstract base class (111 lines)
│   │   │   ├── utils.js            # Shared render utilities (692 lines)
│   │   │   └── icons.js            # SVG icon paths (14 lines)
│   │   ├── cards/
│   │   │   ├── index.js            # Central export hub (27 lines)
│   │   │   ├── ArticleCard.js      # Article schema (39 lines)
│   │   │   ├── NewsCard.js         # NewsArticle schema (39 lines)
│   │   │   ├── ProductCard.js      # Product + Offer (63 lines)
│   │   │   ├── EventCard.js        # Event schema (71 lines)
│   │   │   ├── RecipeCard.js       # Recipe + HowToStep (81 lines)
│   │   │   ├── ReviewCard.js       # Review + Rating (135 lines)
│   │   │   ├── JobCard.js          # JobPosting (140 lines)
│   │   │   ├── CourseCard.js       # Course + Offer (137 lines)
│   │   │   ├── BookingCard.js      # Reservation (205 lines)
│   │   │   ├── PollCard.js         # Question + Answer (159 lines)
│   │   │   ├── ProfileCard.js      # Person (111 lines)
│   │   │   ├── StatisticCard.js    # Observation (144 lines)
│   │   │   ├── GalleryCard.js      # ImageGallery (131 lines)
│   │   │   ├── FaqCard.js          # FAQPage (38 lines)
│   │   │   ├── QuoteCard.js        # Quotation (35 lines)
│   │   │   ├── TimelineCard.js     # EventSeries (38 lines)
│   │   │   ├── AchievementCard.js  # EducationalOccupationalCredential (134 lines)
│   │   │   ├── AnnouncementCard.js # SpecialAnnouncement (157 lines)
│   │   │   ├── BusinessCard.js     # LocalBusiness (127 lines)
│   │   │   ├── ComparisonCard.js   # ItemList (188 lines)
│   │   │   ├── ContactCard.js      # ContactPage (141 lines)
│   │   │   ├── LocationCard.js     # Place (127 lines)
│   │   │   ├── MembershipCard.js   # Offer (136 lines)
│   │   │   ├── SocialCard.js       # SocialMediaPosting (179 lines)
│   │   │   └── SoftwareCard.js     # SoftwareApplication (169 lines)
│   │   └── runtime.js              # Dynamic initialization (254 lines)
│   └── css/
│       ├── base/
│       │   └── base.css            # Base card styles
│       └── components/
│           └── [25 CSS files]      # Per-card styles
├── public/
│   ├── static/
│   │   └── data/
│   │       └── all-cards.json      # Unified card data (all 25 card types)
│   └── *.html                      # Demo pages
├── build.js                        # Puppeteer-based static build
├── build-layouts-map.js            # Layout system integration
├── server.js                       # Development server
├── package.json
└── claude.md
```

## BaseCard Class Deep Dive

### Class Definition (base/BaseCard.js:1-111)

```javascript
export class BaseCard extends HTMLElement {
  static get observedAttributes() { return ['settings']; }

  _data = null;           // Card data object
  _settings = undefined;  // Configuration (lazy initialized)
  _root = null;           // Reserved for future Shadow DOM
}
```

### Constructor (lines 8-10)

```javascript
constructor() {
  super();
  this.classList.add('cc');  // All cards get 'cc' class
}
```

**Why 'cc' class?** Provides common CSS hook without requiring specific card type.

### Settings Initialization (lines 12-32)

```javascript
_ensureSettingsInitialized() {
  if (this._settings !== undefined) return;

  // Try attribute first
  const settingsAttr = this.getAttribute('settings');
  if (settingsAttr) {
    try {
      this._settings = JSON.parse(settingsAttr);
    } catch (e) {
      console.error('Invalid settings JSON:', e);
      this._settings = {};
    }
  }
  // Then try dataset
  else if (this.dataset.settings) {
    this._settings = this.dataset.settings;
  }
  // Default
  else {
    this._settings = {};
  }

  // Merge with defaults
  this._settings = {
    srcsetBreakpoints: [280, 480, 900],
    imageTransformConfig: null,
    ...this._settings
  };
}
```

**Gotcha:** Settings attribute must be valid JSON or it falls back to empty object silently.

### Render Setup (lines 34-48)

```javascript
_setupRender() {
  this._ensureSettingsInitialized();

  const settings = this._settings;
  const useSchema = settings.useSchema !== false;  // Default true
  const content = this._data?.content || {};
  const headlineTag = content.headlineTag || 'h2';

  return { settings, useSchema, content, headlineTag };
}
```

**Critical:** `useSchema` defaults to `true` if not explicitly `false`.

### Schema Setup (lines 50-56)

```javascript
_setSchema(schemaType) {
  this.setAttribute('itemscope', '');
  this.setAttribute('itemtype', `https://schema.org/${schemaType}`);
}
```

### Abstract Render Method (lines 58-60)

```javascript
render() {
  throw new Error('render() must be implemented by subclass');
}
```

**Subclasses must override** - no default implementation provided.

### Lifecycle Hooks (lines 62-86)

```javascript
connectedCallback() {
  if (this._data) {
    this._prepareAndRender();
  }
}

attributeChangedCallback(name, oldValue, newValue) {
  if (name === 'settings') {
    this._settings = undefined;  // Force re-initialization
    if (this._data) {
      this._prepareAndRender();
    }
  }
}

_prepareAndRender() {
  if (!this._data) return;

  // Subclass sets schema type
  // this._setSchema('Article');

  const html = this.render();
  if (html) {
    this.innerHTML = html;
  }
}
```

**Gotcha:** Settings change resets `_settings` to `undefined`, not `null`. This triggers lazy re-initialization on next access.

## Render Utilities Deep Dive (base/utils.js - 692 lines)

### renderMedia() (lines 15-89)

Main dispatcher for media content.

```javascript
export function renderMedia(element, useSchema, settings) {
  const media = element.media;
  if (!media?.sources?.length) return '';

  const { ribbon, sticker, caption } = media;

  // Render each source (image, video, youtube)
  const mediaContent = media.sources.map(source => {
    switch (source.type) {
      case 'image':
        return renderImage(source, useSchema, settings, element);
      case 'video':
        return renderVideo(source, useSchema, settings);
      case 'youtube':
        return renderYouTube(source, useSchema, settings);
      default:
        return '';
    }
  }).join('');

  return `
    <figure class="${getStyle('cc-media', settings)}">
      ${ribbon ? renderRibbon(ribbon, settings) : ''}
      ${sticker ? renderSticker(sticker, settings) : ''}
      ${mediaContent}
      ${caption ? `<figcaption>${caption}</figcaption>` : ''}
    </figure>
  `;
}
```

### renderImage() (lines 91-180)

Responsive image with srcset generation.

```javascript
export function renderImage(image, useSchema, settings, element, context = {}) {
  const { srcsetBreakpoints, imageTransformConfig } = settings;
  const { src, alt = '', loading = 'lazy', fetchpriority } = image;

  // Generate responsive srcset
  const { srcset, sizes } = _generateResponsiveSrcset(src, element, settings);

  // Build image attributes
  const attrs = [
    `src="${src}"`,
    `alt="${alt}"`,
    `loading="${loading}"`,
    srcset ? `srcset="${srcset}"` : '',
    sizes ? `sizes="${sizes}"` : '',
    fetchpriority ? `fetchpriority="${fetchpriority}"` : ''
  ].filter(Boolean).join(' ');

  // Schema.org ImageObject markup
  const schemaAttrs = useSchema
    ? 'itemprop="image" itemscope itemtype="https://schema.org/ImageObject"'
    : '';

  return `
    <div class="${getStyle('cc-media-image', settings)}" ${schemaAttrs}>
      <img ${attrs}>
      ${useSchema ? `<meta itemprop="url" content="${src}">` : ''}
    </div>
  `;
}
```

**Srcset Generation Integration:**

```javascript
function _generateResponsiveSrcset(imageSrc, element, settings) {
  const { srcsetBreakpoints = [280, 480, 900], imageTransformConfig } = settings;

  // If no transform config, return null
  if (!imageTransformConfig) {
    return { srcset: null, sizes: null };
  }

  // Generate srcset for each breakpoint
  const srcsetParts = srcsetBreakpoints.map(width => {
    const transformedUrl = buildTransformUrl(imageSrc, { width }, imageTransformConfig);
    return `${transformedUrl} ${width}w`;
  });

  return {
    srcset: srcsetParts.join(', '),
    sizes: calculateSizes(/* from layout system */)
  };
}
```

### renderYouTube() (lines 220-285)

Two rendering modes for YouTube content.

```javascript
export function renderYouTube(video, useSchema, settings) {
  const videoId = extractYouTubeId(video.src);
  if (!videoId) return '';

  const { playsinline } = video;

  // Mode 1: Thumbnail (default)
  if (!playsinline) {
    return `
      <div class="${getStyle('cc-media-youtube', settings)}" data-video-id="${videoId}">
        <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg"
             alt="${video.alt || ''}"
             loading="lazy">
        ${useSchema ? `
          <meta itemprop="embedUrl" content="https://www.youtube.com/embed/${videoId}">
          <meta itemprop="thumbnailUrl" content="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg">
        ` : ''}
      </div>
    `;
  }

  // Mode 2: Embedded iframe
  return `
    <div class="${getStyle('cc-media-youtube', settings)}"
         ${useSchema ? 'itemprop="video" itemscope itemtype="https://schema.org/VideoObject"' : ''}>
      <iframe src="https://www.youtube.com/embed/${videoId}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
      ${useSchema ? `
        <meta itemprop="embedUrl" content="https://www.youtube.com/embed/${videoId}">
        <meta itemprop="name" content="${video.alt || ''}">
      ` : ''}
    </div>
  `;
}
```

### YouTube URL Extraction (lines 580-610)

Triple fallback mechanism:

```javascript
export function extractYouTubeId(url) {
  if (!url) return null;

  // Try 1: Standard URL parsing
  try {
    const urlObj = new URL(url);

    // youtube.com/watch?v=ID
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }

    // youtu.be/ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
  } catch (e) {
    // Invalid URL, try string parsing
  }

  // Try 2: String splitting for embed URLs
  const embedMatch = url.match(/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  // Try 3: Query param parsing
  const vMatch = url.match(/[?&]v=([^&]+)/);
  if (vMatch) return vMatch[1];

  return null;
}
```

**Gotcha:** Will fail silently on malformed URLs, returning null.

### renderActions() with Popover Support (lines 400-480)

```javascript
export function renderActions(actions, useSchema, settings) {
  if (!actions?.length) return '';

  return `
    <div class="${getStyle('cc-actions', settings)}">
      ${actions.map((action, index) => {
        const { text, icon, attributes = {}, popover } = action;
        const buttonId = `action-${Date.now()}-${index}`;

        // Build button
        let buttonHtml = `
          <button class="${getStyle('cc-action', settings)}"
                  ${popover ? `popovertarget="${buttonId}-popover"` : ''}
                  ${Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ')}>
            ${icon ? renderSVG(icon) : ''}
            ${text}
          </button>
        `;

        // Add popover if specified
        if (popover) {
          buttonHtml += `
            <div id="${buttonId}-popover" popover="${popover.type || 'auto'}"
                 class="${getStyle('cc-popover', settings)}">
              ${popover.video ? renderPopoverVideo(popover.video, useSchema, settings) : ''}
              ${popover.content || ''}
            </div>
          `;
        }

        return buttonHtml;
      }).join('')}
    </div>
  `;
}
```

### Popover Toggle Listeners (lines 640-692)

```javascript
export function initializePopoverToggleListeners(container) {
  container.querySelectorAll('[popover]').forEach(popover => {
    popover.addEventListener('toggle', (event) => {
      const isOpen = event.newState === 'open';

      if (isOpen) {
        // YouTube: set src from data-src (lazy load)
        const youtube = popover.querySelector('iframe[data-src*="youtube.com"]');
        if (youtube) {
          youtube.src = youtube.dataset.src;
        }

        // Video: autoplay if flagged
        const video = popover.querySelector('video[data-autoplay]');
        if (video) {
          video.play();
        }
      } else {
        // YouTube: reset to about:blank
        const youtube = popover.querySelector('iframe[src*="youtube.com"]');
        if (youtube) {
          youtube.src = 'about:blank';
        }

        // Video: pause
        const video = popover.querySelector('video');
        if (video) {
          video.pause();
          if (video.dataset.reset) {
            video.currentTime = 0;
          }
        }
      }
    });
  });
}
```

## Interactive Card Implementations

### BookingCard (205 lines) - Time Slot Selection

**Custom Event:**
```javascript
connectedCallback() {
  super.connectedCallback();

  // Add click listener for time slots
  this.addEventListener('click', (event) => {
    const slot = event.target.closest('.cc-booking-time-slot');
    if (!slot) return;

    // Remove active from all slots
    this.querySelectorAll('.cc-booking-time-slot').forEach(s =>
      s.classList.remove('cc-booking-time-slot-active')
    );

    // Add active to clicked slot
    slot.classList.add('cc-booking-time-slot-active');

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('booking-slot-selected', {
      detail: {
        date: slot.dataset.date,
        time: slot.dataset.time
      },
      bubbles: true
    }));
  });
}
```

**Data Structure:**
```javascript
{
  booking: {
    serviceName: string,
    venue: string,
    capacity: number,
    price: { hourlyRate: number, currency: string },
    duration: string,
    availableSlots: [
      { date: 'YYYY-MM-DD', times: ['HH:MM', ...] }
    ],
    amenities: [string],
    cancellationPolicy: string,
    specialRequests: string
  }
}
```

### PollCard (159 lines) - Voting System

**State Management:**
```javascript
constructor() {
  super();
  this.pollResults = null;   // Results from API
  this.userVote = null;      // User's selected option(s)
  this.hasVoted = false;     // Prevents re-voting
}
```

**Form Submission:**
```javascript
handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const selectedOptions = formData.getAll(`poll-${this._data.id}`);

  if (selectedOptions.length === 0) return;

  this.userVote = selectedOptions;
  this.submitVote();
}

async submitVote() {
  const { poll } = this._data;

  if (poll.endpoint) {
    try {
      const response = await fetch(poll.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: this.userVote })
      });
      this.pollResults = await response.json();
    } catch (e) {
      console.error('Vote submission failed:', e);
    }
  }

  this.hasVoted = true;
  this._prepareAndRender();  // Re-render with results
}
```

**Results Display:**
```javascript
renderPollResults() {
  const { poll } = this._data;
  const { options } = poll;
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return options.map(option => {
    const percentage = totalVotes > 0
      ? Math.round((option.votes / totalVotes) * 100)
      : 0;
    const isUserChoice = this.userVote?.includes(option.id);

    return `
      <div class="${getStyle('cc-poll-result', this._settings)}"
           data-user-choice="${isUserChoice}">
        <div>${option.headline} ${isUserChoice ? '✓' : ''}</div>
        <div>${percentage}% (${option.votes} votes)</div>
        <progress max="100" value="${percentage}"></progress>
      </div>
    `;
  }).join('');
}
```

## Runtime System (runtime.js - 254 lines)

### Main Initialization

```javascript
export async function initContentCards(dataSrc = 'static/data/all-cards.json') {
  // 1. Import all card components
  const allCards = await importAllCards();

  // 2. Setup global layout updater
  window.updateLayoutSrcsets = () => initializeLayoutSrcsets();

  // 3. Initialize layout srcsets
  await initializeLayoutSrcsets();

  // 4. Create layout position map
  createLayoutPositionMap();

  // 5. Load and bind card data
  await initializeCards(dataSrc, allCards);
}
```

### Card Registration

```javascript
async function initializeCards(dataSrc, allCards) {
  // Fetch data
  const response = await fetch(dataSrc);
  const data = await response.json();
  window._cardData = data;

  // Register all card custom elements
  for (const [name, CardClass] of Object.entries(allCards)) {
    const tagName = name.replace(/Card$/, '-card').toLowerCase();
    if (!customElements.get(tagName)) {
      customElements.define(tagName, CardClass);
    }
  }

  // Wait for all definitions
  await Promise.all(
    Object.keys(allCards).map(name => {
      const tagName = name.replace(/Card$/, '-card').toLowerCase();
      return customElements.whenDefined(tagName);
    })
  );

  // Bind data to cards with [content] attribute
  document.querySelectorAll('[content]').forEach(element => {
    const contentId = element.getAttribute('content');
    const cardData = data.find(item => item.id === contentId);

    if (cardData) {
      element._data = cardData;
      element._settings = element._settings || {};
    }
  });

  // Initialize popover listeners
  initializePopoverToggleListeners(document);
}
```

### Global State

```javascript
window._cardData           // Loaded JSON array
window._layoutPositions    // Map<Element, { x, y, index }>
window._layoutSrcsetData   // { srcsetBreakpoints, imageTransformConfig }
window.updateLayoutSrcsets // Function to refresh layouts
```

## Schema.org Types Reference

| Card Type | Schema.org Type | Nested Schemas |
|-----------|-----------------|----------------|
| ArticleCard | Article | Person, InteractionCounter |
| NewsCard | NewsArticle | Person, InteractionCounter |
| ProductCard | Product | Offer, AggregateRating |
| EventCard | Event | Place, Organization, Offer |
| RecipeCard | Recipe | HowToStep, ItemList |
| ReviewCard | Review | Rating, Person, Product/Thing |
| JobCard | JobPosting | MonetaryAmount, Organization, Place |
| CourseCard | Course | CourseInstance, Offer, Person |
| BookingCard | Reservation | Service, Organization |
| PollCard | Question | Answer |
| ProfileCard | Person | ContactPoint |
| FaqCard | FAQPage | Question, Answer |
| QuoteCard | Quotation | Person |
| TimelineCard | EventSeries | — |
| GalleryCard | ImageGallery | ImageObject |
| StatisticCard | Observation | QuantitativeValue |
| AchievementCard | EducationalOccupationalCredential | — |
| AnnouncementCard | SpecialAnnouncement | — |
| BusinessCard | LocalBusiness | PostalAddress, OpeningHoursSpecification |
| ComparisonCard | ItemList | ListItem |
| ContactCard | ContactPage | ContactPoint |
| LocationCard | Place | GeoCoordinates, OpeningHoursSpecification |
| MembershipCard | Offer | PriceSpecification |
| SocialCard | SocialMediaPosting | InteractionCounter |
| SoftwareCard | SoftwareApplication | Offer |

## Gotchas & Edge Cases

### 1. YouTube URL Extraction (utils.js:580-610)

Triple fallback can still fail on malformed URLs:
```javascript
extractYouTubeId("not-a-url")  // Returns null
```

### 2. HTML Cleaning (utils.js:550)

Removes ALL whitespace between tags - can break inline content:
```javascript
cleanHTML("<span>Hello</span> <span>World</span>")
// Returns: "<span>Hello</span><span>World</span>" (space lost)
```

### 3. Search Term Highlighting (utils.js - in renderTBody)

RegEx special chars in search term will crash:
```javascript
searchterm = "user@example.com";
cellValue.replace(new RegExp(`(${searchterm})`, 'gi'), '<mark>$1</mark>');
// RegExp error: @ is special char
```

### 4. Formatter Security (utils.js:520)

Formatters receive entire row, not just cell:
```javascript
const formatter = (value, row) => {
  // Full row data exposed - security consideration
};
```

### 5. Rating Precision (ProductCard.js, ReviewCard.js)

Uses Math.round() which loses fractional precision:
```javascript
const filledStars = Math.round(4.7);  // Returns 5, not 4.7
```

### 6. Currency Symbol Hardcoding (multiple cards)

Only USD is handled specially:
```javascript
currency === 'USD' ? '$' : currency  // EUR shows as "EUR", not "€"
```

### 7. Availability Detection (ProductCard.js)

Fragile string matching:
```javascript
price.availability.toLowerCase().includes('out of stock')
// Fails for "Sold Out", "Unavailable", etc.
```

### 8. Details State (RecipeCard.js)

Ingredients details state not preserved across re-renders.

### 9. Date Parsing (JobCard.js, EventCard.js)

Uses `new Date(string)` without timezone handling:
```javascript
new Date("2025-07-15")  // May shift by timezone
```

### 10. Poll Duplicate Submission (PollCard.js)

No debouncing on form submit - rapid clicks can submit multiple times.

## CSS Class Naming Convention

```css
.cc                     /* Base card container (added by BaseCard) */
.cc-{card-type}         /* Type-specific container */
.cc-content             /* Content wrapper */
.cc-media               /* Media container */
.cc-media-image         /* Image wrapper */
.cc-media-video         /* Video wrapper */
.cc-media-youtube       /* YouTube wrapper */
.cc-headline            /* Main heading */
.cc-subheadline         /* Secondary heading */
.cc-summary             /* Description paragraph */
.cc-header              /* Category/date header */
.cc-authors             /* Authors container */
.cc-engagement          /* Metrics container */
.cc-tags                /* Tags container */
.cc-actions             /* Actions container */
.cc-links               /* Links container */
.cc-ribbon              /* Ribbon overlay */
.cc-sticker             /* Sticker badge */
.cc-popover             /* Popover container */
.cc-{type}-{element}    /* Type-specific elements */
```

## Integration Points

### Layout System Integration

```javascript
import { calculateSizes } from '@browser.style/layout/src/srcsets.js';
```

Uses `window._layoutSrcsetData` for responsive image optimization.

### External Dependencies

- `@browser.style/layout` for srcset generation
- No other external runtime dependencies
- All card logic is self-contained

## Performance Considerations

- **Zero JavaScript for display**: Cards are static HTML after render
- **Lazy image loading**: Default `loading="lazy"` attribute
- **No re-renders**: Static HTML after initial render (except interactive cards)
- **Event delegation**: Single listener for popovers
- **Dynamic imports**: Cards loaded on-demand via runtime.js
- **Srcset generation**: Happens once at render, not on resize

## Debugging Tips

1. **Card not rendering?** Check `_data` is set before `connectedCallback`
2. **Schema not appearing?** Verify `useSchema !== false` in settings
3. **Styles not applying?** Check `getStyle()` output and CSS specificity
4. **Images broken?** Verify `media.sources` structure has `src` and `type`
5. **YouTube not loading?** Check `extractYouTubeId()` returns valid ID
6. **Popover not working?** Verify `initializePopoverToggleListeners()` was called
7. **Custom element not defined?** Ensure card module is imported before use
