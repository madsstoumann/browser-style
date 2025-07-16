# Item Card

### Media Area

This area typically contains visual elements like images or videos.

*   **Media Source(s)**: The primary visual content.
    *   **Image**: Can include `src`, `srcset` for different resolutions, `alt` text, `width`, `height`, and `loading` attributes.
    *   **Video**: Can include `src`, `poster` image, `tracks` for subtitles/captions, and player `options` (like autoplay, controls, loop, muted).
    *   **YouTube**: Can be embedded.
*   **Media Caption**: A `figcaption` to describe the media.
*   **Overlays**: Elements positioned over the media.
    *   **Ribbon**: A banner-like element, often used for "Featured" status. Can have custom `text`, `color`, and an `icon`.
    *   **Sticker/Badge**: A smaller element, like a "New" sticker, with configurable `text`, `position`, and `style`.

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

Here are some of the card types supported by the component, with examples in `news.json`.

#### 1. Article Card

A standard card for blog posts, news, or articles.

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

*   **Media Area**:
    *   **Media Source(s)**: `Image` or a short `Video`.
    *   **Overlays**: `Ribbon` or `Sticker` to highlight sales or new items (e.g., "20% OFF").
*   **Content Area**:
    *   **Core Content**: `Category/Tagline` for the product category, `Headline` for the product name.
    *   **Product Information**: `Price`, `Availability`, and `Rating` are key components.
    *   **Actions**: A primary "Add to Cart" or "View Details" button, and a secondary "Add to Wishlist" action.

#### 3. Video Card

A card focused on presenting a video.

*   **Media Area**:
    *   **Media Source(s)**: A `Video` or `YouTube` embed, usually with a `poster` image to attract clicks.
*   **Content Area**:
    *   **Core Content**: `Headline` for the video title, and `Summary/Text` for a brief description.
    *   **Metadata & Engagement**: `Publication Info` (upload date) and `Engagement Counts` (especially `viewCount`).
    *   **Actions**: The primary action would be to play the video, which could happen in a popover or by navigating to a new page.

#### 4. Author/Profile Card

A simple card to feature a person.

*   **Media Area**:
    *   **Media Source(s)**: An `Image` for the author's avatar/profile picture.
*   **Content Area**:
    *   **Attribution**: `Authors` section would be the main content, showing `name`, `role`, and `contacts`.
    *   **Actions**: A primary action to "View Profile" or follow links to social media.

#### 5. Event Card

Used to announce and provide details about an event.

*   **Media Area**: A promotional `Image`.
*   **Content Area**: `Headline` for the event title, `summary` for the description, and `published` for the date.
*   **Actions**: "Get Tickets" or a "View Agenda" button that can open a `popover` with more details.

#### 6. Poll Card

An interactive card to engage users with a question.

*   **Content Area**: `Headline` for the poll question.
*   **Actions**: A series of buttons representing the poll options.
*   **Engagement**: `viewCount` can show how many people have participated.

#### 7. Quote Card

A simple, visual card for displaying quotes.

*   **Media Area**: An optional background `Image`.
*   **Content Area**: `summary` for the quote itself.
*   **Attribution**: `Authors` section to attribute the quote.
*   **Actions**: A "Share" button.

---

### HTML Markup Structure

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