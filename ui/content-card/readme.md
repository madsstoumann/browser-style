# Content Card
Content Card is a generic card-component that can be extended into a variety of card types, such as articles, products, videos, and more. It can output structured markup for SEO and rich snippets. It consists of two areas: Media Area and Content Area.

### Media Area

This area contains visual elements like images or videos.

*   **Media Source(s)**: The primary visual content.
    *   **Image**: Can include `src`, `srcset` for different resolutions, `alt` text, `width`, `height`, `decode` and `loading` attributes.
    *   **Video**: Can include `src`, `poster` image, `tracks` for subtitles/captions, and player `options` (like autoplay, controls, loop, muted).
    *   **YouTube**: Can be embedded.
*   **Media Caption**: A `figcaption` to describe the media.
*   **Overlays**: Elements positioned over the media.
    *   **Ribbon**: A banner-like element, often used for "Featured" status. 
    *   **Sticker/Badge**: A smaller element, like a "New" sticker.

### Content Area

This area contains the main information of the card, including text, metadata, and actions.

*   **Core Content**:
    *   **Category/Tagline**: A short string to categorize the content (e.g., "Technology").
    *   **Headline**: The main title of the item. The heading level (e.g., `h2`, `h3`) can be specified with the `headlineTag` property in the `content` object. Defaults to `h2`.
    *   **Subheadline**: An optional secondary title.
    *   **Summary/Text**: A paragraph of descriptive text. The component can render both a `summary` and a more detailed `text` field, which can contain simple HTML.

*   **Metadata & Engagement**:
    *   **Publication Info**:
        *   `published` date/time (can be formatted as absolute, relative, or a full string).
        *   `modified` date/time.
        *   `readingTime`.
    *   **Engagement Counts**:
        *   `reactions` (e.g., Likes, Dislikes, with `icon`, `count`, and `active` state).
        *   `commentCount`.
        *   `shareCount`.
        *   `viewCount`.

*   **Attribution & Grouping**:
    *   **Authors**:
        *   A list of one or more authors.
        *   Each author can have a `name`, `role`, and a clickable `avatar` image.
        *   Each author can have a list of `contacts` (e.g., email, Twitter) which are rendered as links.
        *   The author's name can also be a `url` to their profile.
    *   **Tags**:
        *   A list of tags, where each tag is a link (`url`) with a `name`.

*   **Product Information** (for product-type cards):
    *   **Product Name**: The name of the product.
    *   **Price**:
        *   `current` price.
        *   `original` price (for showing discounts).
        *   `currency`.
        *   `discountText` (e.g., "Save 28%").
    *   **Availability**: Stock status (e.g., "InStock").
    *   **Rating**:
        *   Star rating (e.g., 4.7 out of 5).
        *   `count` of ratings.

*   **Actions**:
    *   A list of actions, split into `primary` and `secondary` groups.
    *   Each action can be a `link` or a `button`.
    *   Can have `text`, a `url` (for links), an `icon`, and an `ariaLabel`.
    *   A link can be a full-card wrapper by setting `isWrapper: true`.
    *   A button can trigger a popover by setting `popover: true`.

### Popover

A generic popover can be attached to any card type.

*   **Activation**: Add a `popover` object to the root of the card's data.
*   **Trigger**: An action button with `"popover": true` will open it.
*   **Content Types**: The `popover` object has a `type` which determines its content.
    *   `type: "video"`: Expects a `video` object with `src` and `options`.
    *   `type: "article"`: Expects a `content` string, which can be HTML.

---

### Card Types

Here are the card types supported by the component, with examples in `data.json`. Each card type can optionally include Schema.org structured data markup when `useSchema: true` (default setting).

#### 1. Article Card

A standard card for blog posts, news, or articles.

*   **Schema.org Type**: [`Article`](https://schema.org/Article) (optional)
*   **Media Area**:
    *   **Media Source(s)**: An `Image` is typical.
    *   **Media Caption**: Optional.
*   **Content Area**:
    *   **Core Content**: `Category/Tagline`, `Headline`, optional `Subheadline`, and `Summary/Text`.
    *   **Metadata & Engagement**: `Publication Info` (especially `published` date and `readingTime`), and `Engagement Counts`.
    *   **Attribution & Grouping**: `Authors` and `Tags`.
    *   **Actions**: A primary "Read more" link and secondary "Save" or "Share" buttons.

#### 2. Product Card

Designed to showcase a product for e-commerce.

*   **Schema.org Type**: [`Product`](https://schema.org/Product) (optional)
*   **Media Area**:
    *   **Media Source(s)**: `Image` or a short `Video`.
    *   **Overlays**: `Ribbon` or `Sticker` to highlight sales or new items (e.g., "20% OFF").
*   **Content Area**:
    *   **Core Content**: `Category/Tagline` for the product category, `Headline` for the product name.
    *   **Product Information**: `Price`, `Availability`, and `Rating` are key components.
    *   **Actions**: A primary "Add to Cart" or "View Details" button, and a secondary "Add to Wishlist" action.

#### 3. Video Card

A card focused on presenting a video.

*   **Schema.org Type**: [`VideoObject`](https://schema.org/VideoObject) (optional)
*   **Media Area**:
    *   **Media Source(s)**: A `Video` or `YouTube` embed, usually with a `poster` image to attract clicks.
*   **Content Area**:
    *   **Core Content**: `Headline` for the video title, and `Summary/Text` for a brief description.
    *   **Metadata & Engagement**: `Publication Info` (upload date) and `Engagement Counts` (especially `viewCount`).
    *   **Actions**: The primary action would be to play the video, which could happen in a popover or by navigating to a new page.

#### 4. Author/Profile Card

A simple card to feature a person.

*   **Schema.org Type**: [`Person`](https://schema.org/Person) (optional)
*   **Media Area**:
    *   **Media Source(s)**: An `Image` for the author's avatar/profile picture.
*   **Content Area**:
    *   **Attribution**: `Authors` section would be the main content, showing `name`, `role`, and `contacts`.
    *   **Actions**: A primary action to "View Profile" or follow links to social media.

#### 5. Event Card

Used to announce and provide details about an event.

*   **Schema.org Type**: [`Event`](https://schema.org/Event) or specific event types like [`BusinessEvent`](https://schema.org/BusinessEvent) (optional)
*   **Media Area**: A promotional `Image`.
*   **Content Area**: `Headline` for the event title, `summary` for the description, and `published` for the date.
*   **Actions**: "Get Tickets" or a "View Agenda" button that can open a `popover` with more details.

#### 6. Poll Card

An interactive card to engage users with a question.

*   **Schema.org Type**: [`Question`](https://schema.org/Question) (optional)
*   **Content Area**: `Headline` for the poll question.
*   **Actions**: A series of buttons representing the poll options.
*   **Engagement**: `viewCount` can show how many people have participated.

#### 7. Quote Card

A simple, visual card for displaying quotes.

*   **Schema.org Type**: [`Quotation`](https://schema.org/Quotation) (optional)
*   **Media Area**: An optional background `Image`.
*   **Content Area**: `summary` for the quote itself.
*   **Attribution**: `Authors` section to attribute the quote.
*   **Actions**: A "Share" button.

#### 8. News Card

Similar to Article Card but specifically for news content with NewsArticle schema.

*   **Schema.org Type**: [`NewsArticle`](https://schema.org/NewsArticle) (optional)
*   **Media Area**:
    *   **Media Source(s)**: An `Image` is typical, often with news-specific overlays like "LIVE" ribbons.
    *   **Overlays**: `Ribbon` for breaking news or live events, `Sticker` for "New" or "Updated" status.
*   **Content Area**:
    *   **Core Content**: `Category` (e.g., "World News", "Technology"), `Headline`, optional `Subheadline`, and `Summary`.
    *   **Metadata & Engagement**: `Publication Info` with both `published` and `modified` dates, `readingTime`, and engagement metrics.
    *   **Attribution & Grouping**: `Authors` (journalists/reporters) and news-specific `Tags`.
    *   **Actions**: "Read More", "Watch Highlights" (for sports), or sharing options.

#### 9. Recipe Card

A specialized card for food recipes with Recipe schema.

*   **Schema.org Type**: [`Recipe`](https://schema.org/Recipe) (optional)
*   **Media Area**:
    *   **Media Source(s)**: High-quality food `Image`.
    *   **Overlays**: `Ribbon` for "Popular", "Featured", or dietary badges like "Vegetarian".
*   **Content Area**:
    *   **Core Content**: `Category` (cuisine type), `Headline` (recipe name), and `Summary` (brief description).
    *   **Recipe Information**:
        *   `prepTime`: Preparation time.
        *   `cookTime`: Cooking time.
        *   `servings`: Number of servings.
        *   `instructions`: Step-by-step cooking instructions.
        *   Ingredients list in the `text` field as an array.
    *   **Metadata & Engagement**: `readingTime` (total time), star ratings, and engagement counts.
    *   **Attribution**: `Authors` (chefs/recipe creators).
    *   **Actions**: "Save Recipe", "Share", or "View Full Recipe".

#### 10. Event Card

Designed for events, conferences, and gatherings with Event schema.

*   **Schema.org Type**: [`Event`](https://schema.org/Event) or specific subtypes like [`BusinessEvent`](https://schema.org/BusinessEvent) (optional)
*   **Media Area**:
    *   **Media Source(s)**: Event promotional `Image`.
*   **Content Area**:
    *   **Core Content**: `Category` (e.g., "BusinessEvent", "Conference"), `Headline` (event name), and `Summary`.
    *   **Event Information**:
        *   `startDate` and `endDate`: Event timing.
        *   `location`: Venue name and address.
        *   `organizer`: Event organizer information.
        *   `offers`: Ticket pricing information.
        *   `status`: Event status (Scheduled, Cancelled, etc.).
        *   `attendanceMode`: Online, offline, or mixed.
    *   **Actions**: "View Agenda", "Get Tickets", or "Register" buttons that can open popovers with more details.

#### 11. Business Card

A professional card for local businesses with LocalBusiness schema.

*   **Schema.org Type**: [`LocalBusiness`](https://schema.org/LocalBusiness) (optional)
*   **Media Area**:
    *   **Media Source(s)**: Business logo or storefront `Image`.
*   **Content Area**:
    *   **Core Content**: `Headline` (business name) and `Summary` (business description).
    *   **Business Information**:
        *   `address`: Complete business address with street, city, region, postal code.
        *   `geo`: Latitude and longitude coordinates.
        *   `mapProvider`: Configuration for embedded maps (OpenStreetMap, Google Maps, etc.).
        *   `telephone` and `email`: Contact information.
        *   `website`: Business website URL.
        *   `sameAs`: Social media profiles array.
        *   `foundingDate`: When the business was established.
        *   `openingHours`: Business hours with both schema and display formats.
    *   **Interactive Elements**: Embedded map showing business location.
    *   **Actions**: "Visit Website", "Call Now", "Get Directions".

#### 12. Poll Card

An interactive card for user polls and surveys.

*   **Schema.org Type**: [`Question`](https://schema.org/Question) (optional)
*   **Content Area**:
    *   **Core Content**: `Category` ("Community Poll"), `Headline` (poll question), and `Summary`.
    *   **Poll Options**: Array of choices in the `text` field with `id`, `headline`, and description.
    *   **Poll Configuration**:
        *   `endpoint`: API endpoint for vote submission.
        *   `allowMultiple`: Whether multiple selections are allowed.
        *   `showResults`: When to show results ("afterVote", "always", etc.).
        *   `totalVotes`: Current vote count.
        *   `labels`: Customizable text labels for the interface.
    *   **Interactive Form**: Radio buttons or checkboxes for voting.
    *   **Actions**: "Vote" button with form submission functionality.
    *   **Engagement**: `viewCount` showing poll participation.

#### 13. FAQ Card

A card for frequently asked questions with FAQPage schema.

*   **Schema.org Type**: [`FAQPage`](https://schema.org/FAQPage) (optional)
*   **Content Area**:
    *   **Core Content**: `Headline` ("Frequently Asked Questions") and optional category.
    *   **FAQ Items**: Array of questions and answers in the `text` field.
        *   Each item has `headline` (question) and `text` (answer).
    *   **Interactive Elements**: Collapsible details/summary elements for each Q&A pair.
    *   **Accordion Behavior**: Grouped details elements with shared names for exclusive expansion.

#### 14. Timeline Card

A card for displaying chronological events with EventSeries schema.

*   **Schema.org Type**: [`EventSeries`](https://schema.org/EventSeries) (optional)
*   **Content Area**:
    *   **Core Content**: `Category` (e.g., "History"), `Headline` (timeline title).
    *   **Timeline Items**: Ordered list of events in the `text` field.
        *   Each item has `headline` (time period/date) and `text` (event description).
        *   Optional `startDate`, `endDate`, and `location` for enhanced schema markup.
    *   **Visual Structure**: Ordered list presentation with timeline styling.

---

## Schema.org Integration

### Overview

All card types support optional Schema.org structured data markup, which enhances SEO and enables rich snippets in search results. Schema markup is enabled by default (`useSchema: true`) but can be disabled per card or globally.

### Disabling Schema Markup

```javascript
// Disable for a specific card
const cardSettings = { useSchema: false };
card.dataset = { data: cardData, settings: cardSettings };

// Disable via HTML attribute
<article-card settings='{"useSchema": false}'></article-card>
```

### Schema Benefits

*   **SEO Enhancement**: Improved search engine understanding of content
*   **Rich Snippets**: Enhanced search result displays with ratings, prices, dates
*   **Accessibility**: Better screen reader interpretation
*   **Social Sharing**: Enhanced link previews on social platforms
*   **Voice Search**: Better compatibility with voice assistants

### Schema Properties by Card Type

#### Article/News Cards
- `headline`: Main title
- `articleSection`: Category
- `datePublished`: Publication date
- `dateModified`: Last update date
- `description`: Summary text
- `articleBody`: Full content
- `author`: Author information

#### Recipe Cards
- `name`: Recipe title
- `description`: Recipe summary
- `recipeCategory`: Cuisine type
- `prepTime`: Preparation time
- `cookTime`: Cooking time
- `recipeYield`: Number of servings
- `recipeIngredient`: List of ingredients
- `recipeInstructions`: Cooking steps

#### Event Cards
- `name`: Event name
- `description`: Event description
- `startDate`: Event start time
- `endDate`: Event end time
- `location`: Venue information
- `organizer`: Event organizer
- `eventStatus`: Event status
- `eventAttendanceMode`: Attendance type

#### Business Cards
- `name`: Business name
- `description`: Business description
- `address`: Full address details
- `geo`: Geographic coordinates
- `telephone`: Phone number
- `email`: Email address
- `openingHours`: Business hours
- `sameAs`: Social media profiles

#### Product Cards
- `name`: Product name
- `description`: Product description
- `sku`: Product identifier
- `category`: Product category
- `offers`: Pricing information
- `aggregateRating`: Customer ratings

---

## Component Architecture

### BaseCard Class

The `BaseCard` class serves as the foundation for all card types, providing:

*   **Schema.org Support**: Automatic structured data markup when `useSchema: true` (default).
*   **Settings Management**: Configurable styling and behavior through the `settings` attribute.
*   **Responsive Images**: Integration with layout-aware srcset generation.
*   **Lifecycle Management**: Proper initialization and attribute change handling.
*   **Extensibility**: Abstract `render()` method for subclass implementation.

### Key Features

*   **Custom Elements**: Each card type is registered as a custom element (e.g., `<article-card>`, `<recipe-card>`).
*   **Data Binding**: Cards accept data through the `dataset` property or by setting `data` directly.
*   **Progressive Enhancement**: Works without JavaScript for basic content display.
*   **Accessibility**: Built-in ARIA attributes, semantic HTML, and keyboard navigation support.
*   **Performance**: Lazy loading for media, efficient rendering, and minimal DOM manipulation.

### Usage Examples

```javascript
// Setting data programmatically
const articleCard = document.createElement('article-card');
articleCard.dataset = {
  data: articleData,
  settings: { 
    useSchema: true,
    styles: { 'cc-headline': 'class="custom-headline"' }
  }
};

// Using settings attribute
<recipe-card settings='{"useSchema": false}'></recipe-card>

// Accessing card properties
const settings = articleCard.settings;
const data = articleCard.data;
```

---

---

## Data Structure

### Common Data Properties

All card types share a common data structure with the following top-level properties:

```javascript
{
  "id": "unique-identifier",           // Unique card identifier
  "type": "article|news|recipe|...",   // Card type for component selection
  "media": { ... },                    // Media configuration (optional)
  "ribbon": { ... },                   // Ribbon overlay (optional)
  "sticker": { ... },                  // Sticker/badge overlay (optional)
  "content": { ... },                  // Core content data
  "authors": [...],                    // Author information (optional)
  "engagement": { ... },               // Engagement metrics (optional)
  "tags": [...],                       // Tag/category links (optional)
  "links": [...],                      // Navigation links (optional)
  "actions": [...],                    // Action buttons (optional)
  // Type-specific properties (recipe, event, business, poll, etc.)
}
```

### Media Configuration

```javascript
"media": {
  "sources": [
    {
      "type": "image|video",
      "src": "path/to/media",
      "alt": "Description",
      "srcset": "responsive-sizes", // Optional
      "width": 800,                 // Optional
      "height": 600,                // Optional
      "loading": "lazy|eager",      // Optional
      "poster": "path/to/poster"    // For videos
    }
  ],
  "caption": "Media description"      // Optional figcaption
}
```

### Overlay Elements

```javascript
// Ribbon - larger banner overlay
"ribbon": {
  "text": "FEATURED",
  "style": "featured|live|popular",
  "color": "#ff0000"                  // Optional custom color
}

// Sticker - smaller badge overlay  
"sticker": {
  "text": "NEW",
  "style": "badge|pill",
  "position": "top-left|top-right|bottom-left|bottom-right"
}
```

### Content Structure

```javascript
"content": {
  "category": "Category Name",         // Content categorization
  "headline": "Main Title",           // Primary heading
  "headlineTag": "h2",                // HTML heading level (default: h2)
  "subheadline": "Secondary Title",   // Optional subtitle
  "summary": "Brief description",     // Short description text
  "text": "Detailed content",          // Full content (can be HTML or array)
  "published": {
    "datetime": "2025-07-16T10:00:00Z",
    "formatted": "July 16, 2025"
  },
  "modified": {                       // Optional update information
    "datetime": "2025-07-16T12:00:00Z", 
    "formatted": "(Updated July 16, 2025)"
  },
  "readingTime": "5 min read"         // Time estimate
}
```

### Author Information

```javascript
"authors": [
  {
    "name": "John Doe",
    "role": "Senior Developer",        // Optional job title/role
    "avatar": "path/to/avatar.jpg",    // Optional profile image
    "url": "https://johndoe.com",      // Optional profile link
    "contacts": [                      // Optional contact methods
      {
        "type": "email|twitter|linkedin",
        "url": "mailto:john@example.com",
        "label": "Email John"
      }
    ]
  }
]
```

### Engagement Metrics

```javascript
"engagement": {
  "reactions": [
    {
      "type": "like|dislike|love",
      "icon": "thumbs_up",
      "count": 150,
      "value": 4.5,                   // For ratings (optional)
      "max": 5,                       // Maximum rating value (optional)
      "min": 0,                       // Minimum rating value (optional)
      "active": false,                // User's current state (optional)
      "ariaLabel": "Like this post"
    }
  ],
  "commentCount": 25,
  "shareCount": 80,
  "viewCount": 1500
}
```

### Actions and Links

```javascript
"links": [
  {
    "url": "https://example.com",
    "text": "Read More",
    "icon": "external-link",          // Optional icon
    "hideText": false,                // Show/hide text (default: false)
    "isWrapper": false                // Make entire card clickable (default: false)
  }
]

"actions": [
  {
    "text": "Save Article",
    "icon": "bookmark",               // Optional icon
    "url": "https://save.com",        // For link actions
    "ariaLabel": "Save this article", // Accessibility label
    "popover": {                      // For popover actions
      "content": "<h3>Saved!</h3><p>Article saved to your reading list.</p>"
    },
    "attributes": {                   // Additional HTML attributes
      "type": "submit",
      "data-action": "save"
    }
  }
]
```

### Type-Specific Properties

#### Recipe Data
```javascript
"recipe": {
  "prepTime": "PT15M",               // ISO 8601 duration or readable format
  "cookTime": "PT30M", 
  "servings": "4",
  "instructions": [                  // Step-by-step instructions
    "Preheat oven to 350°F",
    "Mix ingredients in a bowl",
    "Bake for 30 minutes"
  ]
}
```

#### Event Data
```javascript
"event": {
  "startDate": "2025-10-25T09:00:00",
  "endDate": "2025-10-26T17:00:00",
  "location": {
    "name": "Convention Center",
    "address": "123 Main St, City, State 12345"
  },
  "organizer": {
    "name": "Event Organization"
  },
  "offers": [
    {
      "name": "Early Bird",
      "price": "299",
      "currency": "USD"
    }
  ],
  "status": "Scheduled",             // EventStatus
  "attendanceMode": "OfflineEventAttendanceMode"
}
```

#### Business Data
```javascript
"business": {
  "address": {
    "streetAddress": "123 Main Street",
    "addressLocality": "San Francisco", 
    "addressRegion": "CA",
    "postalCode": "94105",
    "addressCountry": "US"
  },
  "geo": {
    "latitude": "37.7749",
    "longitude": "-122.4194",
    "mapProvider": {
      "type": "openstreetmap",
      "name": "OpenStreetMap",
      "url": "https://www.openstreetmap.org/export/embed.html?bbox={lng1},{lat1},{lng2},{lat2}",
      "latOffset": 0.003,
      "lngOffset": 0.005,
      "zoom": 15
    }
  },
  "telephone": "+1-415-555-0123",
  "email": "hello@business.com",
  "website": "https://business.com",
  "sameAs": [                        // Social media profiles
    "https://facebook.com/business",
    "https://twitter.com/business"
  ],
  "foundingDate": "2018-03-15",
  "openingHours": [
    {
      "schema": "Mo-Fr 06:00-20:00",  // Schema.org format
      "display": "Monday - Friday: 6:00 AM - 8:00 PM"
    }
  ]
}
```

#### Poll Data
```javascript
"poll": {
  "endpoint": "./api/polls/poll-1.json",
  "allowMultiple": false,            // Allow multiple selections
  "showResults": "afterVote",        // When to show results
  "totalVotes": 5420,
  "labels": {                        // Customizable UI labels
    "vote": "Vote",
    "submitVote": "Submit Vote", 
    "results": "Results",
    "totalVotes": "Total votes:",
    "votes": "votes"
  }
}
```

---

Below is the proposed semantic HTML markup for each component part.

#### Media Area

```html
<figure class="ic-media">
    <!-- Image -->
    <img 
        class="ic-media-image" 
        src="..." 
        srcset="..." 
        alt="..." 
        width="..." 
        height="..." 
        loading="lazy"
    >

    <!-- Video -->
    <video 
        class="ic-media-video" 
        src="..." 
        poster="..."
        controls 
        autoplay 
        muted 
        loop
    >
        <track kind="captions" src="..." srclang="en" label="English">
    </video>

    <!-- 
      Overlays 
      Using role="status" helps assistive technologies identify these as status indicators.
    -->
    <div class="ic-ribbon" role="status">FEATURED</div>
    <span class="ic-sticker" role="status">NEW</span>

    <!-- Caption -->
    <figcaption class="ic-media-caption">This is a caption.</figcaption>
</figure>
```

**Note on Gallery Usage:** The `<figure>` element is flexible and can contain multiple images or videos to create a small gallery. The `figcaption` would then describe the entire gallery.

```html
<figure class="ic-media">
    <img class="ic-media-image" src="gallery-1.jpg" alt="...">
    <img class="ic-media-image" src="gallery-2.jpg" alt="...">
    <figcaption class="ic-media-caption">A gallery of items.</figcaption>
</figure>
```

#### Content Area

```html
<article class="ic-content">
    <!-- Core Content -->
    <strong class="ic-category">Technology</strong>
    <!-- The heading tag below is dynamic (h2, h3, etc.) based on content.headlineTag -->
    <h2 class="ic-headline">Card Headline</h2>
    <h3 class="ic-subheadline">Card Subheadline</h3>
    <p class="ic-summary">A brief summary of the content.</p>
    <div class="ic-text">
        <p>More detailed text can go here, including <strong>HTML</strong> elements.</p>
    </div>

    <!-- Metadata & Engagement -->
    <div class="ic-meta">
        <time class="ic-published" datetime="2023-10-01T12:00:00Z">October 1, 2023</time>
        <span class="ic-reading-time">5 min read</span>
    </div>
    <div class="ic-engagement">
        <button class="ic-reaction" aria-pressed="false">
            <span class="ic-reaction-icon">👍</span> 100
        </button>
        <span class="ic-comments">25 comments</span>
        <span class="ic-views">1.5k views</span>
    </div>

    <!-- 
      Attribution & Grouping 
      The <address> tag is used here because it semantically represents the contact information 
      for the author(s) of the parent <article> element.
    -->
    <address class="ic-authors">
        <div class="ic-author">
            <a href="/authors/john-doe" class="ic-author-link">
                <img class="ic-avatar" src="..." alt="John Doe" width="40" height="40">
                <span class="ic-author-name">John Doe</span>
            </a>
            <span class="ic-author-role">Author</span>
        </div>
        <!-- Repeat .ic-author div for multiple authors -->
    </address>
    <ul class="ic-tags">
        <li><a href="/tags/tech" class="ic-tag">Technology</a></li>
    </ul>

    <!-- Product Information -->
    <section class="ic-product">
        <h4 class="ic-product-name">Premium Course</h4>
        <div class="ic-product-price">
            <span>USD 49.99</span>
            <del class="ic-product-price-original">USD 69.99</del>
            <span class="ic-product-discount">Save 28%</span>
        </div>
        <div class="ic-product-rating" role="img" aria-label="Rating: 4.7 out of 5 stars">
            <span aria-hidden="true">★★★★☆</span>
            <span>(4.7/5 from 356 ratings)</span>
        </div>
        <span class="ic-product-availability">In Stock</span>
    </section>

    <!-- Actions -->
    <div class="ic-actions">
        <a href="..." class="ic-action-primary">
            <span class="ic-action-icon">▶</span> Read more
        </a>
        <button type="button" class="ic-action-secondary">
            <span class="ic-action-icon">...</span> Save
        </button>
    </div>
</article>

<!-- Popover Structure -->
<div id="popover-id" popover class="ic-popover">
    <button type="button" popovertarget="popover-id" popovertargetaction="hide" class="ic-popover-close">✕</button>
    <!-- Popover content is rendered here based on type (video, article, etc.) -->
    <div class="ic-popover-article">...</div>
</div>
```

---

## Customization and Styling

### Settings Configuration

Each card can be customized through the `settings` object:

```javascript
const settings = {
  // Schema.org structured data
  useSchema: true,                    // Enable/disable schema markup (default: true)
  
  // Custom styling
  styles: {
    'cc-headline': 'class="custom-headline text-lg font-bold"',
    'cc-summary': 'class="text-gray-600"',
    'cc-content': 'class="p-4"'
  },
  
  // Responsive image configuration
  srcsetBreakpoints: [280, 500, 720, 1080, 1440], // Custom breakpoints
  layoutIndex: 0,                     // Layout position for responsive sizing
  layoutSrcsets: [...],               // Pre-calculated srcset configurations
  layoutSrcset: "...",                // Computed srcset for current layout
  
  // Component-specific settings
  componentSettings: {
    // Card-type specific configurations
  }
};
```

### CSS Class Structure

The component uses a consistent CSS class naming convention:

```css
/* Base component classes */
.cc                     /* Base card container */
.cc-content             /* Content area wrapper */
.cc-media               /* Media area wrapper */

/* Content elements */
.cc-category            /* Content category/tagline */
.cc-headline            /* Primary heading */
.cc-subheadline         /* Secondary heading */
.cc-summary             /* Brief description */
.cc-text                /* Detailed content */

/* Metadata and engagement */
.cc-meta                /* Publication metadata wrapper */
.cc-published           /* Publication date */
.cc-reading-time        /* Reading/prep time */
.cc-engagement          /* Engagement metrics wrapper */
.cc-reaction            /* Reaction buttons */
.cc-comments            /* Comment count */
.cc-views               /* View count */

/* Attribution */
.cc-authors             /* Authors wrapper */
.cc-author              /* Individual author */
.cc-avatar              /* Author avatar image */
.cc-author-name         /* Author name */
.cc-author-role         /* Author role/title */
.cc-tags                /* Tags wrapper */
.cc-tag                 /* Individual tag */

/* Actions and links */
.cc-actions             /* Actions wrapper */
.cc-action-primary      /* Primary action button */
.cc-action-secondary    /* Secondary action button */
.cc-links               /* Links wrapper */

/* Media elements */
.cc-media-image         /* Media images */
.cc-media-video         /* Media videos */
.cc-media-caption       /* Media captions */
.cc-ribbon              /* Ribbon overlays */
.cc-sticker             /* Sticker/badge overlays */

/* Type-specific classes */
.cc-recipe-meta         /* Recipe metadata */
.cc-recipe-ingredients  /* Recipe ingredients */
.cc-recipe-instructions /* Recipe instructions */
.cc-event-location      /* Event location */
.cc-event-organizer     /* Event organizer */
.cc-business-map        /* Business map embed */
.cc-faq                 /* FAQ wrapper */
.cc-faq-item            /* FAQ item */
.cc-faq-title           /* FAQ question */
.cc-faq-panel           /* FAQ answer */
.cc-timeline            /* Timeline wrapper */
.cc-timeline-item       /* Timeline item */
.cc-timeline-headline   /* Timeline event title */
.cc-timeline-text       /* Timeline event description */
.cc-poll-form           /* Poll form */
.cc-poll-option         /* Poll option */
.cc-poll-results        /* Poll results */
```

### Style Injection

The `getStyle()` utility function allows dynamic style injection:

```javascript
// In card render methods
${getStyle('cc-headline', settings)}
// Outputs: class="cc-headline" or custom styles from settings.styles['cc-headline']

// Custom styles example
settings.styles['cc-headline'] = 'class="text-2xl font-bold text-blue-600"';
```

### Responsive Behavior

Cards are designed to be responsive by default:

*   **Flexible Layout**: Content adapts to container width
*   **Responsive Images**: Automatic srcset generation based on layout context
*   **Mobile-First**: Optimized for touch interactions and small screens
*   **Progressive Enhancement**: Works without JavaScript

### Theme Integration

Cards can integrate with various CSS frameworks and design systems:

#### Tailwind CSS Example
```javascript
const tailwindSettings = {
  styles: {
    'cc-content': 'class="p-6 bg-white rounded-lg shadow-md"',
    'cc-headline': 'class="text-xl font-bold text-gray-900 mb-2"',
    'cc-summary': 'class="text-gray-600 leading-relaxed"',
    'cc-actions': 'class="flex gap-2 mt-4"',
    'cc-action-primary': 'class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"'
  }
};
```

#### CSS Custom Properties
```css
.cc {
  --cc-border-radius: 8px;
  --cc-padding: 1rem;
  --cc-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --cc-primary-color: #3b82f6;
  --cc-text-color: #374151;
}

.cc-content {
  padding: var(--cc-padding);
  border-radius: var(--cc-border-radius);
  box-shadow: var(--cc-shadow);
  color: var(--cc-text-color);
}
```

---

## Implementation Examples

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./index.css">
</head>
<body>
  <!-- Article Card -->
  <article-card id="article-1"></article-card>
  
  <!-- Recipe Card with custom settings -->
  <recipe-card 
    id="recipe-1" 
    settings='{"useSchema": true, "styles": {"cc-headline": "class=\"large-title\""}}'>
  </recipe-card>
  
  <script type="module">
    import './cards/ArticleCard.js';
    import './cards/RecipeCard.js';
    
    // Load and set data
    fetch('./data.json')
      .then(response => response.json())
      .then(data => {
        const articleCard = document.getElementById('article-1');
        const articleData = data.find(item => item.id === 'article-1');
        articleCard.dataset = { data: articleData };
        
        const recipeCard = document.getElementById('recipe-1');
        const recipeData = data.find(item => item.id === 'recipe-1');
        recipeCard.dataset = { data: recipeData };
      });
  </script>
</body>
</html>
```

### Dynamic Card Creation

```javascript
import { ArticleCard } from './cards/ArticleCard.js';
import { RecipeCard } from './cards/RecipeCard.js';
import { BusinessCard } from './cards/BusinessCard.js';

class CardRenderer {
  static cardTypes = {
    'article': ArticleCard,
    'recipe': RecipeCard,
    'business': BusinessCard,
    // ... other card types
  };

  static createCard(data, settings = {}) {
    const CardClass = this.cardTypes[data.type];
    if (!CardClass) {
      console.warn(`Unknown card type: ${data.type}`);
      return null;
    }

    const card = new CardClass();
    card.dataset = { data, settings };
    return card;
  }

  static renderCards(container, cardsData, globalSettings = {}) {
    const fragment = document.createDocumentFragment();
    
    cardsData.forEach(cardData => {
      const card = this.createCard(cardData, globalSettings);
      if (card) {
        fragment.appendChild(card);
      }
    });
    
    container.appendChild(fragment);
  }
}

// Usage
const container = document.getElementById('cards-container');
const cardsData = await fetch('./data.json').then(r => r.json());
const settings = { 
  useSchema: true,
  styles: {
    'cc-content': 'class="card-content"'
  }
};

CardRenderer.renderCards(container, cardsData, settings);
```

### Custom Card Type

```javascript
import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderHeader, renderMedia } from '../base/utils.js';

export class CustomCard extends BaseCard {
  constructor() {
    super();
  }

  render() {
    const renderContext = this._setSchema('Thing'); // Set appropriate schema
    if (!renderContext) return '';
    
    const { settings, useSchema, content, headlineTag } = renderContext;
    const { customData = {} } = this.data;

    return `
      ${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
      <div ${getStyle('cc-content', settings)}>
        ${renderHeader(content, settings)}
        ${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
        
        <!-- Custom content rendering -->
        ${customData.specialField ? `<div ${getStyle('cc-custom-field', settings)}>${customData.specialField}</div>` : ''}
        
        ${renderActions(this.data.actions, useSchema, settings)}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('custom-card', CustomCard);
```

---

## API Reference

### BaseCard Methods

#### `dataset` (getter/setter)
Sets or gets the complete card data and settings.

```javascript
card.dataset = { data: cardData, settings: cardSettings };
const { data, settings } = card.dataset;
```

#### `data` (getter)
Returns the card's data object.

```javascript
const cardData = card.data;
```

#### `settings` (getter)
Returns the resolved settings object with defaults applied.

```javascript
const cardSettings = card.settings;
```

#### `getStyle(componentName)` 
Returns the style string for a given component class name.

```javascript
const headlineStyle = card.getStyle('cc-headline');
// Returns: 'class="cc-headline"' or custom styles
```

### Utility Functions

The `utils.js` module provides common rendering functions:

#### `renderMedia(media, ribbon, sticker, useSchema, settings)`
Renders the media area with images, videos, and overlays.

#### `renderHeader(content, settings)`
Renders the category/tagline header section.

#### `renderAuthors(authors, useSchema, settings)`
Renders author information with avatars and contact links.

#### `renderEngagement(engagement, useSchema, settings)`
Renders engagement metrics (likes, comments, shares, views).

#### `renderTags(tags, settings)`
Renders tag links.

#### `renderLinks(links, settings, actions)`
Renders navigation links.

#### `renderActions(actions, useSchema, settings)`
Renders action buttons with popover support.

#### `getStyle(className, settings)`
Returns appropriate style attributes for a given class name.

---

## Browser Support

- **Modern Browsers**: Full support for Chrome 79+, Firefox 72+, Safari 13.1+, Edge 79+
- **Custom Elements**: Requires native support or polyfill
- **ES Modules**: Native module support required
- **CSS Grid/Flexbox**: Used for layout
- **Progressive Enhancement**: Graceful degradation for older browsers

---

## Performance Considerations

- **Lazy Loading**: Images use `loading="lazy"` by default
- **Efficient Rendering**: Minimal DOM manipulation after initial render  
- **Bundle Size**: Import only needed card types
- **Memory**: Automatic cleanup on element disconnection
- **Responsive Images**: Automatic srcset generation reduces bandwidth

---

## Accessibility Features

- **Semantic HTML**: Proper use of `article`, `figure`, `address`, etc.
- **ARIA Attributes**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Schema.org**: Rich structured data for assistive technologies
- **Color Contrast**: Follows WCAG guidelines
- **Focus Management**: Proper focus indicators and order

---

## Umbraco Backend Implementation

### Architecture Approach

For the Umbraco backend implementation, we recommend a **unified composition-based approach** that mirrors the frontend architecture. This provides flexibility while maintaining consistency and ease of management.

### Document Type Structure

#### Base ContentCard Document Type

```csharp
[PublishedModel("contentCard")]
public partial class ContentCard : PublishedContentModel
{
    public ContentCard(IPublishedContent content, IPublishedValueFallback publishedValueFallback) 
        : base(content, publishedValueFallback) { }

    // Core Properties (inherited by all card types)
    public string CardType => GetValue<string>("cardType");
    public string CardId => GetValue<string>("cardId");
    public bool UseSchema => GetValue<bool>("useSchema");
    
    // Media Area
    public IPublishedContent Media => GetValue<IPublishedContent>("media");
    public string MediaCaption => GetValue<string>("mediaCaption");
    public RibbonModel Ribbon => GetValue<RibbonModel>("ribbon");
    public StickerModel Sticker => GetValue<StickerModel>("sticker");
    
    // Content Area
    public string Category => GetValue<string>("category");
    public string Headline => GetValue<string>("headline");
    public string HeadlineTag => GetValue<string>("headlineTag");
    public string Subheadline => GetValue<string>("subheadline");
    public string Summary => GetValue<string>("summary");
    public IHtmlString Text => GetValue<IHtmlString>("text");
    
    // Metadata
    public DateTime? Published => GetValue<DateTime?>("published");
    public DateTime? Modified => GetValue<DateTime?>("modified");
    public string ReadingTime => GetValue<string>("readingTime");
    
    // Collections
    public IEnumerable<AuthorModel> Authors => GetValue<IEnumerable<AuthorModel>>("authors");
    public IEnumerable<TagModel> Tags => GetValue<IEnumerable<TagModel>>("tags");
    public IEnumerable<LinkModel> Links => GetValue<IEnumerable<LinkModel>>("links");
    public IEnumerable<ActionModel> Actions => GetValue<IEnumerable<ActionModel>>("actions");
    
    // Engagement
    public EngagementModel Engagement => GetValue<EngagementModel>("engagement");
    
    // Type-specific data (JSON or nested content)
    public string TypeSpecificData => GetValue<string>("typeSpecificData");
}
```

#### Composition-Based Extensions

Instead of separate document types for each card type, use **compositions** to extend the base model:

```csharp
// Recipe-specific composition
[PublishedModel("recipeComposition")]
public partial class RecipeComposition : PublishedElementModel
{
    public string PrepTime => GetValue<string>("prepTime");
    public string CookTime => GetValue<string>("cookTime");
    public string Servings => GetValue<string>("servings");
    public IEnumerable<string> Ingredients => GetValue<IEnumerable<string>>("ingredients");
    public IEnumerable<string> Instructions => GetValue<IEnumerable<string>>("instructions");
}

// Product-specific composition
[PublishedModel("productComposition")]
public partial class ProductComposition : PublishedElementModel
{
    public string Sku => GetValue<string>("sku");
    public PriceModel Price => GetValue<PriceModel>("price");
    public string Availability => GetValue<string>("availability");
    public RatingModel Rating => GetValue<RatingModel>("rating");
}

// Event-specific composition
[PublishedModel("eventComposition")]
public partial class EventComposition : PublishedElementModel
{
    public DateTime StartDate => GetValue<DateTime>("startDate");
    public DateTime EndDate => GetValue<DateTime>("endDate");
    public LocationModel Location => GetValue<LocationModel>("location");
    public OrganizerModel Organizer => GetValue<OrganizerModel>("organizer");
    public IEnumerable<OfferModel> Offers => GetValue<IEnumerable<OfferModel>>("offers");
    public string Status => GetValue<string>("status");
    public string AttendanceMode => GetValue<string>("attendanceMode");
}
```

### Value Converters and Models

#### Supporting Models

```csharp
public class RibbonModel
{
    public string Text { get; set; }
    public string Style { get; set; }
    public string Color { get; set; }
}

public class AuthorModel
{
    public string Name { get; set; }
    public string Role { get; set; }
    public IPublishedContent Avatar { get; set; }
    public string Url { get; set; }
    public IEnumerable<ContactModel> Contacts { get; set; }
}

public class PriceModel
{
    public decimal Current { get; set; }
    public decimal? Original { get; set; }
    public string Currency { get; set; }
    public string DiscountText { get; set; }
}

public class EngagementModel
{
    public IEnumerable<ReactionModel> Reactions { get; set; }
    public int CommentCount { get; set; }
    public int ShareCount { get; set; }
    public int ViewCount { get; set; }
}
```

### Property Editors

#### Card Type Selector

```javascript
// Custom property editor for selecting card type
angular.module("umbraco").controller("cardTypeSelectorController", function($scope) {
    $scope.cardTypes = [
        { alias: "article", name: "Article Card", icon: "icon-article" },
        { alias: "news", name: "News Card", icon: "icon-newspaper" },
        { alias: "recipe", name: "Recipe Card", icon: "icon-recipe" },
        { alias: "product", name: "Product Card", icon: "icon-shopping-basket" },
        { alias: "event", name: "Event Card", icon: "icon-calendar" },
        { alias: "business", name: "Business Card", icon: "icon-office" },
        { alias: "poll", name: "Poll Card", icon: "icon-poll" },
        { alias: "quote", name: "Quote Card", icon: "icon-quote" },
        { alias: "faq", name: "FAQ Card", icon: "icon-help" },
        { alias: "timeline", name: "Timeline Card", icon: "icon-time" }
    ];
});
```

#### Dynamic Type-Specific Fields

```csharp
public class ContentCardController : UmbracoApiController
{
    [HttpGet]
    public object GetCardTypeFields(string cardType)
    {
        return cardType switch
        {
            "recipe" => new { compositions = new[] { "recipeComposition" } },
            "product" => new { compositions = new[] { "productComposition" } },
            "event" => new { compositions = new[] { "eventComposition" } },
            "business" => new { compositions = new[] { "businessComposition" } },
            _ => new { compositions = Array.Empty<string>() }
        };
    }
}
```

### Data Transformation

#### Service for Frontend JSON Generation

```csharp
public class ContentCardService
{
    public object GenerateCardData(ContentCard card)
    {
        var baseData = new
        {
            id = card.CardId ?? card.Key.ToString(),
            type = card.CardType,
            media = GenerateMediaData(card.Media, card.MediaCaption),
            ribbon = card.Ribbon,
            sticker = card.Sticker,
            content = new
            {
                category = card.Category,
                headline = card.Headline,
                headlineTag = card.HeadlineTag ?? "h2",
                subheadline = card.Subheadline,
                summary = card.Summary,
                text = card.Text?.ToString(),
                published = GeneratePublishedData(card.Published),
                modified = GeneratePublishedData(card.Modified),
                readingTime = card.ReadingTime
            },
            authors = card.Authors?.Select(MapAuthor),
            engagement = card.Engagement,
            tags = card.Tags?.Select(MapTag),
            links = card.Links?.Select(MapLink),
            actions = card.Actions?.Select(MapAction)
        };

        // Add type-specific data based on card type
        var typeSpecificData = GenerateTypeSpecificData(card);
        
        return MergeObjects(baseData, typeSpecificData);
    }

    private object GenerateTypeSpecificData(ContentCard card)
    {
        return card.CardType switch
        {
            "recipe" => GenerateRecipeData(card),
            "product" => GenerateProductData(card),
            "event" => GenerateEventData(card),
            "business" => GenerateBusinessData(card),
            "poll" => GeneratePollData(card),
            _ => new { }
        };
    }

    private object GenerateRecipeData(ContentCard card)
    {
        var recipe = card as RecipeComposition;
        if (recipe == null) return new { };

        return new
        {
            recipe = new
            {
                prepTime = recipe.PrepTime,
                cookTime = recipe.CookTime,
                servings = recipe.Servings,
                instructions = recipe.Instructions
            }
        };
    }
}
```

### Block List/Grid Integration

#### Card Collection Property

```json
{
    "alias": "cardCollection",
    "label": "Card Collection",
    "propertyEditorAlias": "Umbraco.BlockList",
    "config": {
        "blocks": [
            {
                "contentElementTypeKey": "content-card-guid",
                "label": "{{headline}} ({{cardType}})"
            }
        ],
        "validationLimit": { "max": 50 }
    }
}
```

### API Endpoints

#### REST API for Frontend Integration

```csharp
[Route("api/cards")]
public class CardsApiController : UmbracoApiController
{
    private readonly ContentCardService _cardService;

    [HttpGet]
    public IActionResult GetCards(int page = 1, int pageSize = 12, string cardType = null)
    {
        var cards = _umbracoHelper.Content(1234) // Cards container node
            .Children<ContentCard>()
            .Where(c => cardType == null || c.CardType == cardType)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(_cardService.GenerateCardData);

        return Ok(cards);
    }

    [HttpGet("{id}")]
    public IActionResult GetCard(string id)
    {
        var card = _umbracoHelper.Content(id) as ContentCard;
        if (card == null) return NotFound();

        var cardData = _cardService.GenerateCardData(card);
        return Ok(cardData);
    }
}
```

### Benefits of This Approach

1. **Consistency**: Matches frontend architecture
2. **Flexibility**: Easy to add new card types without structural changes
3. **Maintainability**: Single point of truth for common properties
4. **Editor Experience**: Unified interface with type-specific customization
5. **Performance**: Efficient queries and caching strategies
6. **Schema Integration**: Automatic Schema.org markup generation
7. **API Ready**: Clean JSON output for headless scenarios

### Migration Strategy

1. **Phase 1**: Create base ContentCard document type with core properties
2. **Phase 2**: Implement compositions for existing card types
3. **Phase 3**: Build custom property editors and validation
4. **Phase 4**: Create API endpoints and frontend integration
5. **Phase 5**: Add advanced features (search, filtering, personalization)

This unified approach provides the flexibility of the frontend component system while leveraging Umbraco's composition and inheritance features for optimal content management.
````