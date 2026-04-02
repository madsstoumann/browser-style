# Content Card Types

This document provides an overview of all available card types, their supported features, and the Schema.org types they use for SEO.

## Common Features

All card types inherit from `BaseCard` and support these common features:

| Feature | Description |
|---------|-------------|
| `media` | Images, videos, or YouTube embeds with captions |
| `headline` | Main title of the card |
| `subheadline` | Secondary title |
| `summary` | Brief description text |
| `category` | Content categorization |
| `tags` | Array of tags (with optional URLs) |
| `actions` | Interactive buttons (with optional popovers) |
| `links` | Navigation links |
| `ribbon` | Promotional badge overlay |
| `sticker` | Small badge (e.g., "New", "LIVE") |

---

## Card Types

### AchievementCard
**Tag:** `<achievement-card>`
**Schema:** `EducationalOccupationalCredential`

Displays certifications, badges, and professional achievements.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Achievement Name | `achievement.achievementName` | Full credential name |
| Issuing Organization | `achievement.issuingOrganization` | Who issued the credential |
| Date Earned | `achievement.dateEarned` | When credential was obtained |
| Expiration Date | `achievement.expirationDate` | When credential expires |
| Verification URL | `achievement.verificationUrl` | Link to verify credential |
| Skill Level | `achievement.skillLevel` | Proficiency level (e.g., Professional) |
| Credential ID | `achievement.credentialId` | Unique credential identifier |

---

### AnnouncementCard
**Tag:** `<announcement-card>`
**Schema:** `SpecialAnnouncement`

Displays system announcements, maintenance notices, and alerts.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Priority | `announcement.priority` | low, medium, high, critical |
| Announcement Type | `announcement.announcementType` | Category (e.g., maintenance) |
| Effective Date | `announcement.effectiveDate` | { start, end } datetime range |
| Target Audience | `announcement.targetAudience` | Who should see this |
| Action Required | `announcement.actionRequired` | What users need to do |
| Is Dismissible | `announcement.isDismissible` | Can user close it |

---

### ArticleCard
**Tag:** `<article-card>`
**Schema:** `Article`

Displays blog posts, news articles, and editorial content with rich media support.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Publication Date | `content.published` | { datetime, formatted } |
| Modified Date | `content.modified` | { datetime, formatted } |
| Reading Time | `content.readingTime` | Estimated read time |
| Article Body | `content.text` | Full article content (HTML) |
| Authors | `authors[]` | Author info with avatar, role, contacts |
| Engagement | `engagement` | viewCount, likeCount, shareCount, commentCount |

---

### BookingCard
**Tag:** `<booking-card>`
**Schema:** `Reservation`

Displays bookable services with availability slots.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Service Name | `booking.serviceName` | Name of bookable service |
| Venue | `booking.venue` | Location name |
| Capacity | `booking.capacity` | Maximum attendees |
| Duration | `booking.duration` | Booking duration |
| Available Slots | `booking.availableSlots[]` | Array of { date, times[] } |
| Price | `booking.price` | { hourlyRate, currency } |
| Amenities | `booking.amenities[]` | List of included amenities |
| Cancellation Policy | `booking.cancellationPolicy` | Policy text |
| Special Requests | `booking.specialRequests` | Additional info |

**Events:** Emits `booking-slot-selected` when user selects a time slot.

---

### BusinessCard
**Tag:** `<business-card>`
**Schema:** `LocalBusiness`

Displays business information with location and contact details.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Address | `business.address` | { streetAddress, addressLocality, addressRegion, postalCode, addressCountry } |
| Geo Coordinates | `business.geo` | { latitude, longitude, mapProvider } |
| Telephone | `business.telephone` | Phone number |
| Email | `business.email` | Email address |
| Website | `business.website` | Website URL |
| Social Links | `business.sameAs[]` | Social media URLs |
| Founding Date | `business.foundingDate` | When business was founded |
| Opening Hours | `business.openingHours[]` | Array of { schema, display } |

**Map Support:** Supports configurable map providers (OpenStreetMap default).

---

### ComparisonCard
**Tag:** `<comparison-card>`
**Schema:** `Table`

Displays side-by-side product or feature comparisons.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Items | `comparison.items[]` | { name, price, image } for each item |
| Criteria | `comparison.criteria[]` | { feature, [item values], winner } |
| Recommendation | `comparison.recommendation` | Which item is recommended |
| Summary | `comparison.summary` | Recommendation explanation |

**Auto-generated:** Pros/cons lists based on winning criteria.

---

### ContactCard
**Tag:** `<contact-card>`
**Schema:** `ContactPoint`

Displays contact information for support or customer service.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Contact Type | `contact.contactType` | Type of contact (e.g., Technical Support) |
| Available Hours | `contact.availableHours` | When support is available |
| Response Time | `contact.responseTime` | Expected response time |
| Contact Methods | `contact.contactMethods[]` | Array of { type, value, label, available } |
| Languages | `contact.languagesSupported[]` | Supported languages |
| Department | `contact.department` | Department name |

---

### ContentCard
**Tag:** `<content-card>`
**Schema:** `CreativeWork`

Generic card for flexible content that doesn't fit a specific type.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Publication Date | `content.published` | { datetime, formatted } |
| Modified Date | `content.modified` | { datetime, formatted } |
| Reading Time | `content.readingTime` | Estimated read time |
| Body Text | `content.text` | Content body (HTML) |
| Authors | `authors[]` | Author information |
| Engagement | `engagement` | View/comment counts |

---

### CourseCard
**Tag:** `<course-card>`
**Schema:** `Course`

Displays educational courses and training programs.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Duration | `course.duration` | Course length (e.g., "6 weeks") |
| Workload | `course.courseWorkload` | ISO 8601 duration (e.g., PT40H) |
| Difficulty Level | `course.difficultyLevel` | Beginner, Intermediate, Advanced |
| Prerequisites | `course.prerequisites[]` | Required knowledge |
| Learning Outcomes | `course.learningOutcomes[]` | What you'll learn |
| Instructor | `course.instructor` | { name, title, experience } |
| Provider | `course.provider` | Course provider name |
| Price | `course.price` | { current, original, currency } |
| Rating | `engagement.reactions[0]` | Course rating |

---

### EventCard
**Tag:** `<event-card>`
**Schema:** `Event` (or specific event type from category)

Displays events, conferences, and gatherings.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Start Date | `event.startDate` | Event start datetime |
| End Date | `event.endDate` | Event end datetime |
| Location | `event.location` | { name, address } |
| Organizer | `event.organizer` | { name } |
| Offers | `event.offers[]` | Ticket options with { name, price, currency } |
| Status | `event.status` | Event status (Scheduled, Cancelled, etc.) |
| Attendance Mode | `event.attendanceMode` | Online/Offline/Mixed |

---

### FaqCard
**Tag:** `<faq-card>`
**Schema:** `FAQPage`

Displays frequently asked questions in an accordion format.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Questions | `content.text[]` | Array of { headline, text } |

**Behavior:** Uses native `<details>` elements with exclusive accordion (`name` attribute).

---

### GalleryCard
**Tag:** `<gallery-card>`
**Schema:** `MediaGallery`

Displays image galleries and portfolios.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Total Count | `gallery.totalCount` | Number of items in gallery |
| Album Name | `gallery.albumName` | Name of the album |
| Featured Media | `gallery.featuredMedia` | Main preview image URL |
| Download Options | `gallery.downloadOptions[]` | Available download formats |
| Slideshow Enabled | `gallery.slideshowEnabled` | Show slideshow button |
| Categories | `gallery.categories[]` | Gallery categories |

---

### JobCard
**Tag:** `<job-card>`
**Schema:** `JobPosting`

Displays job listings and career opportunities.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Company | `job.company` | Hiring company name |
| Location | `job.location` | Job location |
| Employment Type | `job.employmentType` | Full-time, Part-time, Contract |
| Salary Range | `job.salaryRange` | { min, max, currency, period } |
| Qualifications | `job.qualifications[]` | Required qualifications |
| Benefits | `job.benefits[]` | Job benefits |
| Application Deadline | `job.applicationDeadline` | Last date to apply |

---

### LocationCard
**Tag:** `<location-card>`
**Schema:** `Place` or `TouristDestination`

Displays locations, landmarks, and points of interest.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Address | `location.address` | { streetAddress, addressLocality, addressRegion, addressCountry } |
| Geo | `location.geo` | { latitude, longitude } |
| Hours | `location.hours` | Operating hours |
| Contact | `location.contact` | Phone number |
| Amenities | `location.amenities[]` | Available facilities |
| Rating | `location.rating` | { value, count, max } |

---

### MembershipCard
**Tag:** `<membership-card>`
**Schema:** `Offer`

Displays subscription plans and membership tiers.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Plan Name | `membership.planName` | Name of the plan |
| Price | `membership.price` | { monthly, yearly, currency, savings } |
| Features | `membership.features[]` | What's included |
| Limitations | `membership.limitations[]` | Plan restrictions |
| Trial Period | `membership.trialPeriod` | Free trial duration |
| Is Popular | `membership.isPopular` | Show "Most Popular" badge |

---

### NewsCard
**Tag:** `<news-card>`
**Schema:** `NewsArticle`

Displays news articles with publication metadata.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Publication Date | `content.published` | { datetime, formatted } |
| Modified Date | `content.modified` | { datetime, formatted } |
| Reading Time | `content.readingTime` | Estimated read time |
| Article Body | `content.text` | Article content (HTML) |
| Authors | `authors[]` | Journalist info with contacts |
| Engagement | `engagement` | View/share/comment counts |

---

### PollCard
**Tag:** `<poll-card>`
**Schema:** `Question`

Displays interactive polls with voting functionality.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Options | `content.text[]` | Array of { id, headline, text } choices |
| Endpoint | `poll.endpoint` | API endpoint for results |
| Allow Multiple | `poll.allowMultiple` | Checkbox vs radio selection |
| Show Results | `poll.showResults` | "afterVote" or "always" |
| Total Votes | `poll.totalVotes` | Current vote count |
| Labels | `poll.labels` | Custom UI text labels |

**Events:** Form submission triggers vote and results display.

---

### ProductCard
**Tag:** `<product-card>`
**Schema:** `Product`

Displays e-commerce products with pricing and ratings.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| SKU | `product.sku` | Product SKU |
| Price | `product.price` | { current, original, currency, discountText } |
| Availability | `product.availability` | Stock status |
| Valid Until | `product.validUntil` | Offer expiration date |
| Rating | `product.rating` | { value, count, max, min } |
| Engagement | `engagement` | View/share counts |

---

### ProfileCard
**Tag:** `<profile-card>`
**Schema:** `Person`

Displays personal or team member profiles.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Job Title | `profile.jobTitle` | Professional title |
| Organization | `profile.organization` | Company name |
| Bio | `profile.bio` | Extended biography |
| Location | `profile.location` | Geographic location |
| Skills | `profile.skills[]` | List of skills |
| Contacts | `profile.contacts[]` | Array of { type, value, label } |

---

### QuoteCard
**Tag:** `<quote-card>`
**Schema:** `Quotation`

Displays quotes with attribution.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Quote Text | `summary` | The quote content |
| Authors | `authors[]` | Quote attribution { name, role } |

---

### RecipeCard
**Tag:** `<recipe-card>`
**Schema:** `Recipe`

Displays cooking recipes with ingredients and instructions.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Prep Time | `recipe.prepTime` | Preparation time |
| Cook Time | `recipe.cookTime` | Cooking time |
| Total Time | `content.readingTime` | Total time |
| Servings | `recipe.servings` | Number of servings |
| Ingredients | `content.text[]` | Array of ingredients |
| Instructions | `recipe.instructions[]` | Step-by-step instructions |
| Authors | `authors[]` | Chef/cook attribution |
| Rating | `engagement.reactions[0]` | Recipe rating |

---

### ReviewCard
**Tag:** `<review-card>`
**Schema:** `Review`

Displays product or service reviews.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Rating | `review.rating` | { value, max } |
| Reviewer | `review.reviewer` | { name, verified, purchaseDate } |
| Review Date | `review.reviewDate` | When review was written |
| Helpful Votes | `review.helpfulVotes` | Helpfulness count |
| Product Reviewed | `review.productReviewed` | What's being reviewed |
| Item Type | `review.itemType` | Schema type for reviewed item |
| Product Image | `review.productImage` | Image of reviewed item |
| Aggregate Rating | `review.aggregateRating` | Overall product rating stats |
| Product Price | `review.productPrice` | { amount, currency } |

---

### SocialCard
**Tag:** `<social-card>`
**Schema:** `SocialMediaPosting`

Displays social media posts and updates.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Platform | `social.platform` | Twitter, LinkedIn, etc. |
| Post Content | `social.postContent` | Full post text |
| Author | `social.author` | @username |
| Engagement | `social.engagement` | { likes, shares, comments } |
| Hashtags | `social.hashtags[]` | Associated hashtags |
| Media Attachments | `social.mediaAttachments[]` | Attached images |
| Published | `content.published` | { datetime, formatted } |

---

### SoftwareCard
**Tag:** `<software-card>`
**Schema:** `SoftwareApplication`

Displays software products and applications.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Application Category | `software.applicationCategory` | Software type |
| Operating Systems | `software.operatingSystem[]` | Supported platforms |
| Version | `software.version` | Software version |
| File Size | `software.fileSize` | Download size |
| Developer | `software.developer` | { name, website } |
| Screenshots | `software.screenshots[]` | Preview images |
| System Requirements | `software.systemRequirements` | { ram, storage, processor } |
| Price | `software.price` | { current, currency, type } |

---

### StatisticCard
**Tag:** `<statistic-card>`
**Schema:** `Observation`

Displays metrics, KPIs, and statistics with trends.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Metric Name | `statistic.metricName` | What's being measured |
| Current Value | `statistic.currentValue` | The main number |
| Unit | `statistic.unit` | Measurement unit |
| Trend | `statistic.trend` | up, down, stable |
| Trend Percentage | `statistic.trendPercentage` | Change percentage |
| Comparison Period | `statistic.comparisonPeriod` | What it's compared to |
| Target Value | `statistic.targetValue` | Goal value (shows progress bar) |
| Chart Data | `statistic.chartData[]` | Array of values for sparkline |
| Period | `statistic.period` | Time range for chart |

---

### TimelineCard
**Tag:** `<timeline-card>`
**Schema:** `EventSeries`

Displays chronological timelines and milestones.

| Feature | Data Path | Description |
|---------|-----------|-------------|
| Events | `content.text[]` | Array of { headline, text, startDate, endDate, location } |

---

## Data Structure

### CMS-Compatible Format
```json
{
  "id": "unique-id",
  "headline": "Main Title",
  "subheadline": "Subtitle",
  "summary": "Brief description",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "media": {
    "sources": [{ "type": "image", "src": "url", "alt": "description" }],
    "caption": "Optional caption"
  },
  "data": {
    "type": "article",
    "content": { /* type-specific content */ },
    /* type-specific data properties */
  },
  "actions": [{ "text": "Button", "icon": "icon_name" }],
  "links": [{ "url": "#", "text": "Link Text" }]
}
```

### Normalized Runtime Format
The `runtime.js` normalizes CMS data to a flat structure for rendering:
```json
{
  "id": "unique-id",
  "type": "article",
  "content": { "headline": "...", "summary": "..." },
  "media": { /* ... */ },
  "actions": [ /* ... */ ],
  "links": [ /* ... */ ],
  "tags": [ /* ... */ ]
}
```
