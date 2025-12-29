# Content Card Component

## Overview

Content Card is a **comprehensive card component system** for rendering various content types with optional Schema.org structured data markup. It provides **25 specialized card types**, each as a custom element extending a shared `BaseCard` class.

## Architecture

### Files Structure

```
content-card/
├── readme.md                    # User documentation
├── build.js                     # Build script
├── build-layouts-map.js         # Layout mappings generator
├── config.json                  # Build configuration
├── package.json                 # NPM package configuration
├── src/
│   ├── js/
│   │   ├── base/
│   │   │   ├── BaseCard.js      # Abstract base class (~112 lines)
│   │   │   ├── utils.js         # Shared render utilities (~693 lines)
│   │   │   └── icons.js         # SVG icon definitions
│   │   ├── cards/
│   │   │   ├── index.js         # Central exports
│   │   │   └── [25 card types]  # Individual card implementations
│   │   └── runtime.js           # Runtime utilities
│   └── css/
│       ├── index.css            # Main CSS entry
│       ├── modifiers.md         # Layout modifier documentation
│       ├── base/                # Base styles
│       └── components/          # Card-specific CSS (25 files)
└── dist/                        # Built output
```

### Component Hierarchy

```
BaseCard (HTMLElement)
├── AchievementCard   → Schema: EducationalOccupationalCredential
├── AnnouncementCard  → Schema: SpecialAnnouncement
├── ArticleCard       → Schema: Article
├── BookingCard       → Schema: Reservation
├── BusinessCard      → Schema: LocalBusiness
├── ComparisonCard    → Schema: ItemList
├── ContactCard       → Schema: ContactPage
├── CourseCard        → Schema: Course
├── EventCard         → Schema: Event
├── FaqCard           → Schema: FAQPage
├── GalleryCard       → Schema: ImageGallery
├── JobCard           → Schema: JobPosting
├── LocationCard      → Schema: Place
├── MembershipCard    → Schema: Offer
├── NewsCard          → Schema: NewsArticle
├── PollCard          → Schema: Question
├── ProductCard       → Schema: Product
├── ProfileCard       → Schema: Person
├── QuoteCard         → Schema: Quotation
├── RecipeCard        → Schema: Recipe
├── ReviewCard        → Schema: Review
├── SocialCard        → Schema: SocialMediaPosting
├── SoftwareCard      → Schema: SoftwareApplication
├── StatisticCard     → Schema: StatisticalPopulation
└── TimelineCard      → Schema: EventSeries
```

### Custom Elements

Each card registers as a custom element:

| Component | Element Tag |
|-----------|-------------|
| AchievementCard | `<achievement-card>` |
| AnnouncementCard | `<announcement-card>` |
| ArticleCard | `<article-card>` |
| BookingCard | `<booking-card>` |
| BusinessCard | `<business-card>` |
| ComparisonCard | `<comparison-card>` |
| ContactCard | `<contact-card>` |
| CourseCard | `<course-card>` |
| EventCard | `<event-card>` |
| FaqCard | `<faq-card>` |
| GalleryCard | `<gallery-card>` |
| JobCard | `<job-card>` |
| LocationCard | `<location-card>` |
| MembershipCard | `<membership-card>` |
| NewsCard | `<news-card>` |
| PollCard | `<poll-card>` |
| ProductCard | `<product-card>` |
| ProfileCard | `<profile-card>` |
| QuoteCard | `<quote-card>` |
| RecipeCard | `<recipe-card>` |
| ReviewCard | `<review-card>` |
| SocialCard | `<social-card>` |
| SoftwareCard | `<software-card>` |
| StatisticCard | `<statistic-card>` |
| TimelineCard | `<timeline-card>` |

## BaseCard Class

### Properties

```javascript
class BaseCard extends HTMLElement {
  _data;      // Card data object
  _settings;  // Configuration settings
  _root;      // Shadow root (if used)
}
```

### Settings Object

```javascript
{
  styles: {},                           // CSS class overrides
  useSchema: true,                      // Enable Schema.org markup
  srcsetBreakpoints: [280, 480, 900],   // Responsive image breakpoints
  imageTransformConfig: null            // Image transform provider config
}
```

### Methods

| Method | Description |
|--------|-------------|
| `_setupRender()` | Extracts common render variables |
| `_setSchema(type)` | Sets Schema.org itemscope/itemtype |
| `render()` | Abstract - must be implemented by subclass |
| `getStyle(name)` | Gets CSS class string for component |

## Shared Utilities (utils.js)

### Render Functions

| Function | Description |
|----------|-------------|
| `renderMedia(element, useSchema, settings)` | Renders media area (images, videos, YouTube) |
| `renderImage(image, useSchema, settings, element, context)` | Renders responsive image with srcset |
| `renderVideo(video, useSchema, settings)` | Renders native video element |
| `renderYouTube(video, useSchema, settings)` | Renders YouTube embed/thumbnail |
| `renderRibbon(ribbon, settings)` | Renders ribbon overlay |
| `renderSticker(sticker, settings)` | Renders sticker badge |
| `renderActions(actions, useSchema, settings)` | Renders action buttons with popover support |
| `renderTags(tags, settings)` | Renders tag chips |
| `renderAuthors(authors, includeSchema, settings)` | Renders author information |
| `renderEngagement(engagement, useSchema, settings)` | Renders likes/views/comments |
| `renderHeader(content, settings)` | Renders category/date/reading time |
| `renderLinks(links, settings, actions)` | Renders navigation links |
| `renderSVG(name)` | Renders SVG icon by name |
| `getStyle(componentName, settings)` | Gets CSS class string |
| `cleanHTML(html)` | Removes whitespace from HTML |

### YouTube Helpers

```javascript
isYouTubeUrl(url)      // Detect YouTube URLs
extractYouTubeId(url)  // Extract video ID from URL
```

### Popover Video Support

```javascript
initializePopoverToggleListeners(container)  // Sets up video popover behavior
```

## Data Structure

### Common Properties (all card types)

```javascript
{
  "id": "unique-id",
  "type": "article",                    // Card type identifier
  "media": {
    "sources": [
      { "type": "image", "src": "...", "alt": "..." },
      { "type": "video", "src": "...", "poster": "..." },
      { "type": "youtube", "src": "...", "playsinline": true }
    ],
    "caption": "Optional caption"
  },
  "ribbon": { "text": "FEATURED", "style": "featured", "icon": "star" },
  "sticker": { "text": "NEW", "position": "top-right" },
  "content": {
    "category": "Technology",
    "headline": "Main Title",
    "headlineTag": "h2",               // h2-h6
    "subheadline": "Secondary Title",
    "summary": "Brief description",
    "text": "Detailed content",
    "published": { "datetime": "2025-07-16T10:00:00Z", "formatted": "July 16, 2025" },
    "modified": { "datetime": "...", "formatted": "..." },
    "readingTime": "5 min read"
  },
  "authors": [
    { "name": "John Doe", "avatar": { "src": "..." }, "role": "Author" }
  ],
  "engagement": {
    "viewCount": 1500,
    "likeCount": 150,
    "shareCount": 25,
    "commentCount": 10
  },
  "tags": [
    { "name": "CSS", "url": "/tags/css" }
  ],
  "links": [
    { "text": "Read More", "url": "...", "icon": "arrow_forward" }
  ],
  "actions": [
    {
      "text": "Watch",
      "icon": "play_arrow",
      "attributes": { "type": "button" },
      "popover": { "type": "auto", "video": { "src": "..." } }
    }
  ]
}
```

### Type-Specific Data Properties

**Achievement (`achievement`):**
```javascript
{
  "achievementName": "...",
  "issuingOrganization": "...",
  "dateEarned": "2025-01-15",
  "expirationDate": "2026-01-15",
  "credentialId": "ABC-123",
  "skillLevel": "Advanced",
  "verificationUrl": "..."
}
```

**Booking (`booking`):**
```javascript
{
  "serviceName": "...",
  "venue": "...",
  "capacity": 50,
  "price": { "hourlyRate": 100, "currency": "USD" },
  "duration": "2 hours",
  "availableSlots": [{ "date": "2025-07-20", "times": ["10:00", "14:00"] }],
  "amenities": ["WiFi", "Projector"],
  "cancellationPolicy": "...",
  "specialRequests": "..."
}
```

**Business (`business`):**
```javascript
{
  "address": { "streetAddress": "...", "addressLocality": "...", "postalCode": "..." },
  "geo": { "latitude": 40.7128, "longitude": -74.0060 },
  "telephone": "+1-234-567-8900",
  "openingHours": ["Mo-Fr 09:00-17:00"]
}
```

**Course (`course`):**
```javascript
{
  "provider": { "name": "...", "url": "..." },
  "duration": "8 weeks",
  "level": "Intermediate",
  "format": "Online",
  "price": { "current": 199, "currency": "USD" },
  "enrollment": { "startDate": "...", "spots": 20 },
  "syllabus": ["Module 1", "Module 2"],
  "instructor": { "name": "...", "avatar": {...} }
}
```

**Event (`event`):**
```javascript
{
  "startDate": "2025-08-15T19:00:00Z",
  "endDate": "2025-08-15T22:00:00Z",
  "location": { "name": "...", "address": {...} },
  "offers": [{ "price": 50, "currency": "USD", "availability": "InStock" }],
  "performer": [{ "name": "..." }]
}
```

**Job (`job`):**
```javascript
{
  "company": { "name": "...", "logo": "..." },
  "employmentType": "Full-time",
  "location": { "addressLocality": "...", "remote": true },
  "salary": { "minValue": 80000, "maxValue": 120000, "currency": "USD" },
  "datePosted": "2025-07-01",
  "validThrough": "2025-08-01",
  "qualifications": ["5+ years experience"],
  "responsibilities": ["Lead team"]
}
```

**Membership (`membership`):**
```javascript
{
  "tier": "Premium",
  "price": { "amount": 9.99, "currency": "USD", "period": "month" },
  "benefits": ["Unlimited access", "Priority support"],
  "limitations": ["Fair use policy"],
  "trialPeriod": "14 days"
}
```

**Poll (`poll`):**
```javascript
{
  "options": [
    { "id": "opt1", "text": "Option A", "votes": 150 },
    { "id": "opt2", "text": "Option B", "votes": 100 }
  ],
  "totalVotes": 250,
  "endDate": "2025-07-30T00:00:00Z",
  "allowMultiple": false
}
```

**Product (`product`):**
```javascript
{
  "price": { "current": 49.99, "original": 69.99, "currency": "USD" },
  "availability": "InStock",
  "sku": "PROD-123",
  "brand": "BrandName",
  "rating": { "value": 4.5, "count": 120 }
}
```

**Recipe (`recipe`):**
```javascript
{
  "prepTime": "PT15M",
  "cookTime": "PT30M",
  "totalTime": "PT45M",
  "servings": "4",
  "calories": 350,
  "ingredients": ["1 cup flour", "2 eggs"],
  "instructions": ["Step 1...", "Step 2..."],
  "nutrition": { "calories": 350, "protein": "12g" }
}
```

**Review (`review`):**
```javascript
{
  "itemReviewed": { "name": "...", "type": "Product" },
  "rating": { "value": 4, "best": 5 },
  "pros": ["Great quality"],
  "cons": ["Expensive"],
  "verified": true
}
```

**Social (`social`):**
```javascript
{
  "platform": "twitter",
  "originalUrl": "https://twitter.com/...",
  "replyTo": { "author": "...", "content": "..." },
  "thread": [{ "content": "..." }]
}
```

**Software (`software`):**
```javascript
{
  "applicationCategory": "Productivity",
  "version": "2.5.0",
  "fileSize": "45 MB",
  "operatingSystem": ["Windows", "macOS", "Linux"],
  "developer": { "name": "...", "website": "..." },
  "price": { "current": 29.99, "currency": "USD", "type": "one-time" },
  "systemRequirements": { "ram": "4GB", "storage": "500MB", "processor": "..." },
  "screenshots": ["url1.jpg", "url2.jpg"]
}
```

**Statistic (`statistic`):**
```javascript
{
  "value": 1234567,
  "unit": "users",
  "trend": { "direction": "up", "percentage": 15, "period": "month" },
  "comparison": { "previous": 1073972, "baseline": "last month" },
  "breakdown": [{ "label": "Mobile", "value": 60 }]
}
```

## Layout Modifiers

Apply via `layout` attribute:

```html
<article-card layout="stack(po-bc ta-c pa1 ar16x9 ov1)"></article-card>
```

### Layout Types

| Modifier | Description |
|----------|-------------|
| `stack` | Stack content over media |
| `columns(` | Side-by-side layout |
| `rows(` | Vertical layout |
| `flip` | Reverse element order |

### Position Alignment

| Modifier | Position |
|----------|----------|
| `po-tl` | Top left |
| `po-tc` | Top center |
| `po-tr` | Top right |
| `po-cl` | Center left |
| `po-cc` | Center center |
| `po-cr` | Center right |
| `po-bl` | Bottom left |
| `po-bc` | Bottom center |
| `po-br` | Bottom right |

### Text Alignment

| Modifier | Alignment |
|----------|-----------|
| `ta-l` | Left |
| `ta-c` | Center |
| `ta-r` | Right |

### Aspect Ratios

| Modifier | Ratio |
|----------|-------|
| `ar1x1` | Square (1:1) |
| `ar4x3` | Standard (4:3) |
| `ar3x4` | Portrait (3:4) |
| `ar16x9` | Widescreen (16:9) |
| `ar9x16` | Vertical video (9:16) |
| `ar3x2` | Classic photo (3:2) |
| `ar2x3` | Portrait photo (2:3) |
| `ar5x4` | Large format (5:4) |
| `ar4x5` | Portrait large (4:5) |
| `ar21x9` | Ultrawide (21:9) |

### Padding

| Modifier | Value |
|----------|-------|
| `pa0` - `pa3` | All sides (0 to 3 units) |
| `pi0` - `pi3` | Inline/horizontal |
| `pb0` - `pb3` | Block/vertical |

### Row Gap

| Modifier | Value |
|----------|-------|
| `rg0` - `rg3` | Gap between rows |

### Width

| Modifier | Value |
|----------|-------|
| `w25`, `w33`, `w50`, `w66`, `w75`, `w100` | Percentage width |
| `wfc` | Fit content |
| `wmc` | Min content |

### Theme & Effects

| Modifier | Effect |
|----------|--------|
| `thd` | Dark theme |
| `thl` | Light theme |
| `ov1` | Enable media overlay |

## CSS Class Convention

All CSS classes use `cc-` prefix:

```css
.cc                     /* Base card container */
.cc-content             /* Content area wrapper */
.cc-media               /* Media area wrapper */
.cc-media-image         /* Image element */
.cc-media-video         /* Video element */
.cc-media-caption       /* Figure caption */
.cc-headline            /* Primary heading */
.cc-subheadline         /* Secondary heading */
.cc-summary             /* Brief description */
.cc-header              /* Category/date header */
.cc-category            /* Category label */
.cc-published           /* Publication date */
.cc-reading-time        /* Reading time */
.cc-authors             /* Authors container */
.cc-author              /* Individual author */
.cc-avatar              /* Author avatar */
.cc-engagement          /* Engagement metrics */
.cc-metric              /* Individual metric */
.cc-tags                /* Tags container */
.cc-tag                 /* Individual tag */
.cc-actions             /* Actions container */
.cc-action              /* Action button */
.cc-links               /* Links container */
.cc-link                /* Individual link */
.cc-ribbon              /* Ribbon overlay */
.cc-sticker             /* Sticker badge */
.cc-popover             /* Popover container */

/* Card-specific prefixes */
.cc-achievement-*       /* Achievement card */
.cc-announcement-*      /* Announcement card */
.cc-booking-*           /* Booking card */
.cc-business-*          /* Business card */
.cc-comparison-*        /* Comparison card */
.cc-contact-*           /* Contact card */
.cc-course-*            /* Course card */
.cc-event-*             /* Event card */
.cc-faq-*               /* FAQ card */
.cc-gallery-*           /* Gallery card */
.cc-job-*               /* Job card */
.cc-location-*          /* Location card */
.cc-membership-*        /* Membership card */
.cc-poll-*              /* Poll card */
.cc-product-*           /* Product card */
.cc-profile-*           /* Profile card */
.cc-quote-*             /* Quote card */
.cc-recipe-*            /* Recipe card */
.cc-review-*            /* Review card */
.cc-social-*            /* Social card */
.cc-software-*          /* Software card */
.cc-statistic-*         /* Statistic card */
.cc-timeline-*          /* Timeline card */
```

## Usage

### Basic

```html
<article-card id="my-article"></article-card>

<script type="module">
  import { ArticleCard } from '@browser.style/content-card';

  const card = document.getElementById('my-article');
  card.dataset = {
    data: {
      type: 'article',
      content: { headline: 'My Article', summary: '...' },
      media: { sources: [{ type: 'image', src: '...', alt: '...' }] }
    },
    settings: { useSchema: true }
  };
</script>
```

### Dynamic Creation

```javascript
import { ProductCard } from '@browser.style/content-card';

const card = document.createElement('product-card');
card.dataset = { data: productData, settings: { useSchema: true } };
document.body.appendChild(card);
```

### Style Customization

```javascript
const settings = {
  styles: {
    'cc-headline': 'text-xl font-bold',
    'cc-summary': ['text-gray-600', 'leading-relaxed'],
    'cc-action': { class: 'btn btn-primary', style: 'margin-top: 1rem' }
  }
};
```

### Disable Schema.org

```javascript
card.dataset = {
  data: {...},
  settings: { useSchema: false }
};
```

## Responsive Images

Cards integrate with layout-aware srcset generation:

```javascript
const settings = {
  srcsetBreakpoints: [280, 500, 720, 1080, 1440],
  layoutIndex: 0,
  imageTransformConfig: {
    defaultProvider: 'cloudinary',
    providers: {
      cloudinary: {
        urlPattern: { type: 'path', pathConfig: { prefix: '/c_', separator: ',', assignment: '_' } },
        paramMap: { width: 'w', height: 'h', fit: 'c' }
      }
    },
    defaultTransforms: { fit: 'fill', quality: 80 }
  }
};
```

## Events

### BookingCard

```javascript
card.addEventListener('booking-slot-selected', (e) => {
  console.log('Selected:', e.detail.date, e.detail.time);
});
```

### PollCard

```javascript
card.addEventListener('poll-vote', (e) => {
  console.log('Voted:', e.detail.optionId);
});
```

## Schema.org Benefits

- **Rich Snippets**: Enhanced search result displays
- **SEO**: Better content understanding by search engines
- **Voice Search**: Compatibility with voice assistants
- **Social Sharing**: Better preview cards

## Debugging Tips

1. **Card not rendering?** Check `type` matches registered custom element
2. **Schema not appearing?** Verify `useSchema: true` in settings
3. **Styles not applying?** Check `getStyle()` and settings.styles
4. **Images broken?** Verify media.sources structure
5. **Layout not working?** Check `layout` attribute syntax
6. **Custom element not defined?** Ensure card JS is imported

## Browser Support

- Modern browsers with Custom Elements v1
- ES Modules support
- CSS Grid and Custom Properties
