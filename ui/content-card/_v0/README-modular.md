# Modular Content Cards

This implements a new modular architecture for content cards, where each card type is a separate custom element.

## Architecture

```
ui/content-card/
├── base/
│   ├── BaseCard.js         // Shared functionality for all cards
│   └── utils.js            // Shared render methods (renderMedia, renderHeader, etc.)
├── cards/
│   ├── QuoteCard.js        // <quote-card> custom element
│   ├── RecipeCard.js       // <recipe-card> custom element
│   ├── ProductCard.js      // <product-card> custom element
│   ├── NewsCard.js         // <news-card> custom element
│   ├── ArticleCard.js      // <article-card> custom element
│   ├── EventCard.js        // <event-card> custom element
│   ├── FaqCard.js          // <faq-card> custom element
│   ├── TimelineCard.js     // <timeline-card> custom element
│   └── BusinessCard.js     // <business-card> custom element
├── test-quote-card.html    // Test page for QuoteCard
├── test-recipe-card.html   // Test page for RecipeCard
├── test-product-card.html  // Test page for ProductCard
├── test-news-card.html     // Test page for NewsCard
├── test-article-card.html  // Test page for ArticleCard
├── test-event-card.html    // Test page for EventCard
├── test-faq-card.html      // Test page for FaqCard
├── test-timeline-card.html // Test page for TimelineCard
├── test-business-card.html // Test page for BusinessCard
├── test.html               // Demo page using new custom elements
└── README-modular.md       // This file
```

## QuoteCard Usage

**Note:** All custom elements automatically receive a base `cc` class for styling.

### Method 1: Data Loader Utility
```html
<!-- Import the card and data loader -->
<script type="module" src="ui/content-card/cards/QuoteCard.js"></script>
<script type="module">
import { setContentForElement } from './ui/content-card/base/data-loader.js';

const quoteCard = document.querySelector('quote-card');
setContentForElement(quoteCard, 'quote-1');
</script>

<quote-card></quote-card>
```

### Method 2: JavaScript Object (Direct Data)
```javascript
import { QuoteCard } from './ui/content-card/cards/QuoteCard.js';

const quoteCard = document.createElement('quote-card');
quoteCard.dataset = {
    data: {
        type: "quote",
        content: { summary: "Stay hungry, stay foolish." },
        authors: [{ name: "Steve Jobs" }]
    },
    settings: { useSchema: true }
};

document.body.appendChild(quoteCard);
```

### Method 3: Custom Settings with Data Loader
```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

const quoteCard = document.querySelector('quote-card');
setContentForElement(quoteCard, 'quote-1', { 
    useSchema: false,
    styles: { "cc-quote": "my-custom-quote" }
});
```

## RecipeCard Usage

Similar to QuoteCard, but optimized for recipe content with ingredients and instructions:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load recipe by ID
const recipeCard = document.querySelector('recipe-card');
setContentForElement(recipeCard, 'recipe-1');
```

**Recipe Data Structure:**
- `content.text` - Array of ingredients
- `recipe.instructions` - Array of cooking steps  
- `recipe.prepTime/cookTime/servings` - Recipe metadata
- `engagement.reactions[0].value` - Rating value
- Schema.org Recipe markup with HowToStep instructions

## ProductCard Usage

Optimized for e-commerce products with pricing, ratings, and availability:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load product by ID
const productCard = document.querySelector('product-card');
setContentForElement(productCard, 'product-1');
```

**Product Data Structure:**
- `sku` - Product SKU for schema.org identification
- `product.price` - Current/original price, currency, discounts
- `product.availability` - Stock status and shipping info
- `product.rating` - Customer ratings with max/min scale
- `product.validUntil` - Offer expiration dates
- Schema.org Product markup with Offer and AggregateRating

## NewsCard Usage

Designed for news articles and editorial content with publishing metadata:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load news article by ID
const newsCard = document.querySelector('news-card');
setContentForElement(newsCard, 'news-1');
```

**News Data Structure:**
- `content.published/modified` - Publishing and update timestamps
- `content.category` - Article section (Technology, Politics, etc.)
- `content.readingTime` - Estimated reading duration (display only, no schema)
- `authors` - Article authors with names and roles
- Schema.org NewsArticle markup with articleSection and datePublished

## ArticleCard Usage

Designed for general articles, blog posts, and editorial content with full Schema.org Article markup:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load article by ID
const articleCard = document.querySelector('article-card');
setContentForElement(articleCard, 'article-1');
```

**Article Data Structure:**
- `content.published/modified` - Publishing and update timestamps
- `content.category` - Article section or topic classification
- `content.headline/subheadline` - Primary and secondary titles
- `content.readingTime` - Estimated reading duration (display only, no schema)
- `content.text` - Full article body content
- `authors` - Article authors with avatar, email, and social links
- `engagement` - View count, likes, shares, comments
- `tags` - Topic tags for classification
- Schema.org Article markup with complete metadata

## EventCard Usage

Designed for events, conferences, workshops, and any scheduled activities with full Schema.org Event markup:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load event by ID
const eventCard = document.querySelector('event-card');
setContentForElement(eventCard, 'event-1');
```

**Event Data Structure:**
- `content.category` - Event type (e.g., "BusinessEvent", "SocialEvent")
- `content.headline/subheadline` - Event name and description
- `event.startDate/endDate` - Event timing in ISO 8601 format
- `event.status` - Event status ("Scheduled", "Cancelled", "Postponed")
- `event.attendanceMode` - Attendance type ("OnlineEventAttendanceMode", "OfflineEventAttendanceMode", "MixedEventAttendanceMode")
- `event.location` - Venue information with name and address
- `event.organizer` - Organizing entity with name
- `event.offers` - Ticket pricing and availability options
- `engagement` - View count, likes, shares, comments (displayed but no schema - Event types don't support interactionStatistic)
- Schema.org Event markup with complete metadata

## FaqCard Usage

Designed for FAQ sections, help content, and Q&A displays with full Schema.org FAQPage markup:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load FAQ by ID
const faqCard = document.querySelector('faq-card');
setContentForElement(faqCard, 'accordion-1');
```

**FAQ Data Structure:**
- `content.headline` - FAQ section title (e.g., "Frequently Asked Questions")
- `content.category` - Content classification (e.g., "FAQ", "Help", "Support")
- `content.text` - Array of Q&A objects with `headline` (question) and `text` (answer)
- Interactive FAQ behavior using HTML details/summary elements
- Grouped FAQ items (only one open at a time) with unique naming
- Schema.org FAQPage with Question/Answer markup for each item
- Perfect for help sections, support documentation, and knowledge bases

## TimelineCard Usage

Designed for chronological content, project milestones, and historical events with full Schema.org EventSeries markup:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load timeline by ID
const timelineCard = document.querySelector('timeline-card');
setContentForElement(timelineCard, 'timeline-1');
```

**Timeline Data Structure:**
- `content.headline` - Timeline title (e.g., "Project Milestones", "Company History")
- `content.category` - Content classification (e.g., "History", "Project", "Development")
- `content.text` - Array of timeline objects with `headline` (milestone name) and `text` (description)
- Optional `startDate`, `endDate`, and `location` for each timeline item
- Visual timeline with connecting line and milestone markers
- Schema.org EventSeries with Event markup for each timeline item
- Perfect for project roadmaps, company histories, and process flows

## BusinessCard Usage

Designed for local businesses, shops, restaurants, and service providers with full Schema.org LocalBusiness markup:

```javascript
import { setContentForElement } from './ui/content-card/base/data-loader.js';

// Load business by ID
const businessCard = document.querySelector('business-card');
setContentForElement(businessCard, 'business-1');
```

**Business Data Structure:**
- `content.headline` - Business name
- `content.summary` - Business description or tagline
- `business.address` - Complete postal address with schema markup
- `business.geo` - Geographic coordinates and optional map provider configuration
- `business.telephone` - Contact phone number (clickable)
- `business.email` - Contact email (clickable)
- `business.openingHours` - Array of hour objects with `schema` (for markup) and `display` (for presentation)
- `business.sameAs` - Social media and website links
- Optional OpenStreetMap embed controlled by `useMap` setting (defaults to true)
- Schema.org LocalBusiness with Place, PostalAddress, and GeoCoordinates markup
- Perfect for restaurants, retail stores, professional services, and local businesses

**Actions with Popovers:**
Actions can include embedded popover content that opens on click:
```json
"actions": [
  {
    "text": "Regular Action"
  },
  {
    "text": "Action with Popover",
    "popover": {
      "type": "article",
      "content": "<h3>Popover Title</h3><p>Any HTML content can go here.</p>"
    }
  }
]
```
- Popover content is embedded directly in the action
- `type` defaults to "auto" if not specified (can be "article", "dialog", etc.)
- `content` contains the HTML to display in the popover
- Popovers are rendered after the action buttons (hidden until triggered)
- Each popover gets a unique generated ID for proper targeting

**Tags Format:**
Tags support both simple strings and objects with links:
```json
// Simple string tags
"tags": ["Technology", "Web Development", "JavaScript"]

// Object tags with optional links
"tags": [
  { "name": "Europe", "url": "/tags/europe" },
  { "name": "Politics", "url": "/tags/politics" },
  { "name": "Breaking News" }
]
```
- String format: Simple text tags without links
- Object format: Tags with `name` (required) and optional `url` for links
- Mixed formats: You can combine both string and object tags in the same array
- Link styling: Object tags with URLs become clickable with hover effects

**Opening Hours Format:**
```json
"openingHours": [
  {
    "schema": "Mo-Fr 09:00-18:00",
    "display": "Monday - Friday: 9:00 AM - 6:00 PM"
  },
  {
    "schema": "Sa 10:00-16:00", 
    "display": "Saturday: 10:00 AM - 4:00 PM"
  }
]
```
- `schema` field maintains Schema.org compliance for structured data
- `display` field provides localized, human-readable text
- Supports any language or custom formatting without hardcoded parsing
- Backward compatible with legacy string format

**Map Provider Configuration:**
```json
"geo": {
  "latitude": "37.7749",
  "longitude": "-122.4194",
  "mapProvider": {
    "type": "openstreetmap",
    "name": "OpenStreetMap",
    "url": "https://www.openstreetmap.org/export/embed.html?bbox={lng1},{lat1},{lng2},{lat2}&layer=mapnik&marker={lat},{lng}",
    "latOffset": 0.003,
    "lngOffset": 0.005
  }
}
```

**Supported Map Providers:**
- **OpenStreetMap** (default) - Privacy-friendly, no API key required, completely free
- **Mapbox** - Requires access token, generous free tier (50k+ requests/month), excellent styling
- **Google Maps** - Requires API key, limited free tier, widely recognized
- **Custom** - Any provider with URL template

**URL Template Placeholders:**
- `{lat}` - Latitude coordinate
- `{lng}` - Longitude coordinate  
- `{lat1}`, `{lat2}` - Bounding box latitude range (calculated using `latOffset`) - *OpenStreetMap only*
- `{lng1}`, `{lng2}` - Bounding box longitude range (calculated using `lngOffset`) - *OpenStreetMap only*
- `{zoom}` - Zoom level (uses `zoom` property or defaults to 15) - *Google Maps, Mapbox*
- `{apiKey}` - API key/access token for provider

**Map Provider Properties:**
- `type` - Provider identifier (for reference)
- `name` - Display name for iframe title
- `url` - URL template with placeholders
- `latOffset` - Latitude offset for bounding box (optional, defaults to 0.003 ≈ 300m) - *OpenStreetMap only*
- `lngOffset` - Longitude offset for bounding box (optional, defaults to 0.005 ≈ 400m) - *OpenStreetMap only*
- `zoom` - Zoom level for center-point providers (optional, defaults to 15) - *Google Maps, Mapbox*

**Easy Provider Switching:**
```json
// OpenStreetMap (uses bounding box with offsets)
"mapProvider": { 
  "type": "openstreetmap",
  "name": "OpenStreetMap",
  "url": "https://www.openstreetmap.org/export/embed.html?bbox={lng1},{lat1},{lng2},{lat2}&layer=mapnik&marker={lat},{lng}",
  "latOffset": 0.005,
  "lngOffset": 0.008
}

// Google Maps (uses center point with zoom - requires API key)
"mapProvider": { 
  "type": "google",
  "name": "Google Maps",
  "url": "https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q={lat},{lng}&zoom={zoom}",
  "zoom": 16
}

// Mapbox (uses center point with zoom - requires access token)
"mapProvider": {
  "type": "mapbox",
  "name": "Mapbox",
  "url": "https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+3174f0({lng},{lat})/{lng},{lat},{zoom}/300x200?access_token=YOUR_ACCESS_TOKEN",
  "zoom": 15
}

// Custom provider
"mapProvider": {
  "type": "custom",
  "name": "My Custom Maps",
  "url": "https://your-map-service.com/embed?lat={lat}&lng={lng}&zoom={zoom}",
  "zoom": 14
}
```

## Video Support

Any card type can display videos via enhanced media rendering and video popovers:

**YouTube Inline Play:**
```json
"media": {
  "sources": [
    {
      "type": "youtube",
      "src": "https://youtu.be/VTCIStB6y8s",
      "alt": "Video title",
      "playsinline": true
    }
  ]
}
```
- `playsinline: true` → Renders iframe with autoplay + muted
- `playsinline: false` (or omitted) → Shows thumbnail image

**Video Popovers:**
```json
"actions": [
  {
    "text": "Watch Video",
    "popover": {
      "type": "video",
      "video": {
        "src": "https://example.com/video.mp4",
        "options": { "controls": true, "muted": true, "autoplay": true }
      }
    }
  }
]
```
- Any card can have video popovers via actions
- Supports both video objects and HTML content
- Video elements are already fully supported in media sources

## Features

### ✅ Explicit Data Loading
- **Data Loader Utility**: Load content by ID from data.json
- **Direct Data**: Provide data objects directly via JavaScript

### ✅ Schema.org Support
- Default `useSchema: true` for quote cards
- Generates proper Quotation schema markup
- Can be disabled via settings

### ✅ Shared Utilities
- `renderAuthors()` - Author information with schema support
- `renderActions()` - Action buttons
- `getStyle()` - CSS class system
- `cleanHTML()` - Template cleanup

### ✅ Extensible Base
- `BaseCard` provides common functionality
- Settings management with CSS class system
- Lifecycle hooks and attribute observation

## Testing

### Local Server Required
Due to CORS restrictions, you need to serve the files via a local server:

```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server

# Option 3: Using PHP
php -S localhost:8000
```

Then open: 
- `http://localhost:8000/ui/content-card/test-quote-card.html`
- `http://localhost:8000/ui/content-card/test-recipe-card.html`
- `http://localhost:8000/ui/content-card/test-product-card.html`
- `http://localhost:8000/ui/content-card/test-news-card.html`
- `http://localhost:8000/ui/content-card/test-article-card.html`
- `http://localhost:8000/ui/content-card/test-event-card.html`
- `http://localhost:8000/ui/content-card/test-faq-card.html`
- `http://localhost:8000/ui/content-card/test-timeline-card.html`
- `http://localhost:8000/ui/content-card/test-business-card.html`

### Complete Demo Page

- `http://localhost:8000/ui/content-card/test.html` - **Full demo using new custom elements**

This demo page shows the migration from the old system to the new custom elements:

**Old System (tests.html):**
```html
<content-card content="news-11" type="news"></content-card>
<content-card content="product-1" type="product"></content-card>
```

**New System (test.html):**
```html
<news-card content="news-11"></news-card>
<product-card content="product-1"></product-card>
```

The new system automatically:
- Imports individual card modules
- Registers all custom elements
- Maps data types to appropriate custom elements
- Supports the same layout and styling options

### Debugging
The test page includes console logging to help debug data loading:
- ✅ Shows successful data.json loading 
- 📄 Shows number of items loaded
- ⚠️ Shows any loading issues

Check browser console for detailed information.

## Next Steps

1. ✅ QuoteCard - Complete with media and schema support
2. ✅ RecipeCard - Complete with ingredients, instructions, and Recipe schema
3. ✅ ProductCard - Complete with pricing, ratings, availability, and Product schema
4. ✅ NewsCard - Complete with publishing metadata, authors, and NewsArticle schema
5. ✅ ArticleCard - Complete with full article content, authors, engagement, and Article schema
6. ✅ EventCard - Complete with event details, location, organizer, offers, and Event schema
7. ✅ FaqCard - Complete with interactive accordions, Q&A content, and FAQPage schema
8. ✅ TimelineCard - Complete with visual timeline, milestone tracking, and EventSeries schema
9. ✅ BusinessCard - Complete with local business info, maps, contacts, and LocalBusiness schema
10. ✅ Video Support - Enhanced media rendering with YouTube inline play and video popovers
11. Create additional card components (ProfileCard, GalleryCard, etc.)
12. Add more shared utility functions as needed
13. Implement advanced features (theming, animations, etc.)
14. Consider bundling for production use