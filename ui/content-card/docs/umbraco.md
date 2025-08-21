# Umbraco Implementation Guide

## Overview

This document outlines the complete implementation strategy for all Content Card types in Umbraco CMS using the classic MVC approach (not headless). The implementation uses a unified composition-based architecture that mirrors the frontend component structure while leveraging Umbraco's content management capabilities.

## Architecture Approach

### Unified Base Structure

All card types extend from a single `ContentCard` document type, using Umbraco's composition feature to add type-specific properties. This approach provides:

- **Consistency**: Single point of truth for common properties
- **Maintainability**: Easy to add new card types or modify existing ones
- **Editor Experience**: Unified interface with contextual field visibility
- **Performance**: Efficient queries and caching strategies
- **Flexibility**: Easy migration between card types

### Document Type Hierarchy

```
ContentCard (Base Document Type)
├── Content Area Properties
├── Media Area Properties
├── Metadata Properties
├── Engagement Properties
└── Type-specific Compositions:
    ├── AchievementComposition
    ├── AnnouncementComposition
    ├── ArticleComposition
    ├── BookingComposition
    ├── BusinessComposition
    ├── ComparisonComposition
    ├── ContactComposition
    ├── CourseComposition
    ├── EventComposition
    ├── FaqComposition
    ├── GalleryComposition
    ├── JobComposition
    ├── LocationComposition
    ├── MembershipComposition
    ├── NewsComposition
    ├── PollComposition
    ├── ProductComposition
    ├── ProfileComposition
    ├── QuoteComposition
    ├── RecipeComposition
    ├── ReviewComposition
    ├── SocialComposition
    ├── SoftwareComposition
    ├── StatisticComposition
    └── TimelineComposition
```

## Base ContentCard Document Type

### Core Properties Tab

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Card Type | `cardType` | Dropdown | Selects card type and shows/hides relevant composition tabs |
| Card ID | `cardId` | Textstring | Optional custom ID (falls back to node key) |
| Use Schema | `useSchema` | True/False | Enable Schema.org markup (default: true) |

### Media Area Tab

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Media | `media` | Media Picker | Primary image/video content |
| Media Caption | `mediaCaption` | Textstring | Optional figcaption for media |
| Ribbon | `ribbon` | Nested Content | Banner overlay (text, style, color) |
| Sticker | `sticker` | Nested Content | Badge overlay (text, style, position) |

### Content Area Tab

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Category | `category` | Textstring | Content categorization |
| Headline | `headline` | Textstring | Main title |
| Headline Tag | `headlineTag` | Dropdown | HTML heading level (h1-h6, default: h2) |
| Subheadline | `subheadline` | Textstring | Optional secondary title |
| Summary | `summary` | Textarea | Brief description text |
| Text | `text` | RTE/Textarea | Detailed content (can contain HTML) |

### Metadata Tab

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Published Date | `published` | Date Picker | Publication date |
| Modified Date | `modified` | Date Picker | Last update date |
| Reading Time | `readingTime` | Textstring | Time estimate (e.g., "5 min read") |

### Collections Tab

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Authors | `authors` | Block List | Author information collection |
| Tags | `tags` | Block List | Tag collection with name and URL |
| Links | `links` | Block List | Navigation links collection |
| Actions | `actions` | Block List | Action buttons collection |

### Engagement Tab

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Reactions | `reactions` | Block List | Like/dislike reactions with counts |
| Comment Count | `commentCount` | Numeric | Number of comments |
| Share Count | `shareCount` | Numeric | Number of shares |
| View Count | `viewCount` | Numeric | Number of views |

## Type-Specific Compositions

### 1. ArticleComposition

**Tab: Article Details**
- No additional properties (uses base ContentCard properties)
- Schema.org type: `Article`

### 2. NewsComposition

**Tab: News Details**
- No additional properties (uses base ContentCard properties)
- Schema.org type: `NewsArticle`

### 3. ProductComposition

**Tab: Product Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| SKU | `sku` | Textstring | Product identifier |
| Current Price | `currentPrice` | Decimal | Current selling price |
| Original Price | `originalPrice` | Decimal | Original price (for discounts) |
| Currency | `currency` | Textstring | Price currency (default: USD) |
| Discount Text | `discountText` | Textstring | Discount description |
| Availability | `availability` | Dropdown | Stock status |
| Valid Until | `validUntil` | Date Picker | Offer expiration |
| Rating Value | `ratingValue` | Decimal | Average rating |
| Rating Count | `ratingCount` | Numeric | Number of ratings |
| Rating Max | `ratingMax` | Numeric | Maximum rating value (default: 5) |

### 4. RecipeComposition

**Tab: Recipe Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Prep Time | `prepTime` | Textstring | Preparation time |
| Cook Time | `cookTime` | Textstring | Cooking time |
| Servings | `servings` | Textstring | Number of servings |
| Ingredients | `ingredients` | Multiple Textstring | List of ingredients |
| Instructions | `instructions` | Multiple Textstring | Step-by-step instructions |

### 5. EventComposition

**Tab: Event Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Start Date | `startDate` | Date Picker with Time | Event start |
| End Date | `endDate` | Date Picker with Time | Event end |
| Location Name | `locationName` | Textstring | Venue name |
| Location Address | `locationAddress` | Textarea | Full address |
| Organizer Name | `organizerName` | Textstring | Event organizer |
| Offers | `offers` | Block List | Ticket/pricing information |
| Event Status | `eventStatus` | Dropdown | Scheduled/Cancelled/etc. |
| Attendance Mode | `attendanceMode` | Dropdown | Online/Offline/Mixed |

### 6. BusinessComposition

**Tab: Business Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Street Address | `streetAddress` | Textstring | Business address |
| City | `addressLocality` | Textstring | City name |
| Region | `addressRegion` | Textstring | State/region |
| Postal Code | `postalCode` | Textstring | ZIP/postal code |
| Country | `addressCountry` | Textstring | Country code |
| Latitude | `latitude` | Textstring | Geographic coordinate |
| Longitude | `longitude` | Textstring | Geographic coordinate |
| Telephone | `telephone` | Textstring | Business phone |
| Email | `email` | Email Address | Business email |
| Website | `website` | Url | Business website |
| Social Media | `sameAs` | Multiple Textstring | Social media URLs |
| Founding Date | `foundingDate` | Date Picker | Business establishment date |
| Opening Hours | `openingHours` | Block List | Business hours (schema + display format) |

### 7. PollComposition

**Tab: Poll Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Poll Options | `pollOptions` | Block List | Question options with ID and text |
| API Endpoint | `endpoint` | Textstring | Vote submission endpoint |
| Allow Multiple | `allowMultiple` | True/False | Multiple selection allowed |
| Show Results | `showResults` | Dropdown | When to show results |
| Total Votes | `totalVotes` | Numeric | Current vote count |
| UI Labels | `labels` | Block List | Customizable interface text |

### 8. QuoteComposition

**Tab: Quote Details**
- Uses base ContentCard `summary` for quote text
- Uses base ContentCard `authors` for attribution
- Schema.org type: `Quotation`

### 9. FaqComposition

**Tab: FAQ Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| FAQ Items | `faqItems` | Block List | Questions and answers |
| FAQ Group Name | `faqGroupName` | Textstring | Accordion group identifier |

### 10. TimelineComposition

**Tab: Timeline Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Timeline Items | `timelineItems` | Block List | Timeline events with dates and descriptions |

### 11. ProfileComposition

**Tab: Profile Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Job Title | `jobTitle` | Textstring | Professional title |
| Organization | `organization` | Textstring | Company/employer |
| Bio | `bio` | Textarea | Detailed biography |
| Location | `location` | Textstring | Geographic location |
| Skills | `skills` | Tags | Skill keywords |
| Contact Methods | `contacts` | Block List | Contact information |

### 12. CourseComposition

**Tab: Course Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Duration | `duration` | Textstring | Course length |
| Difficulty Level | `difficultyLevel` | Dropdown | Beginner/Intermediate/Advanced |
| Prerequisites | `prerequisites` | Multiple Textstring | Required knowledge |
| Learning Outcomes | `learningOutcomes` | Multiple Textstring | What students will learn |
| Instructor Name | `instructorName` | Textstring | Teacher name |
| Instructor Title | `instructorTitle` | Textstring | Teacher credentials |
| Instructor Experience | `instructorExperience` | Textstring | Years of experience |
| Course Provider | `provider` | Textstring | Educational institution |
| Price | `coursePrice` | Decimal | Course cost |
| Currency | `courseCurrency` | Textstring | Price currency |

### 13. JobComposition

**Tab: Job Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Company | `company` | Textstring | Hiring organization |
| Job Location | `jobLocation` | Textstring | Work location |
| Employment Type | `employmentType` | Dropdown | Full-time/Part-time/Contract |
| Salary Min | `salaryMin` | Decimal | Minimum salary |
| Salary Max | `salaryMax` | Decimal | Maximum salary |
| Salary Currency | `salaryCurrency` | Textstring | Currency code |
| Salary Period | `salaryPeriod` | Dropdown | Annual/Monthly/Hourly |
| Qualifications | `qualifications` | Multiple Textstring | Required skills |
| Benefits | `benefits` | Multiple Textstring | Job benefits |
| Application Deadline | `applicationDeadline` | Date Picker | Apply by date |

### 14. ReviewComposition

**Tab: Review Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Rating Value | `reviewRating` | Decimal | Star rating |
| Rating Max | `reviewRatingMax` | Numeric | Maximum rating (default: 5) |
| Reviewer Name | `reviewerName` | Textstring | Customer name |
| Verified Purchase | `verified` | True/False | Purchase verification |
| Purchase Date | `purchaseDate` | Date Picker | When item was bought |
| Review Date | `reviewDate` | Date Picker | When review was written |
| Product Reviewed | `productReviewed` | Textstring | Item being reviewed |
| Helpful Votes | `helpfulVotes` | Numeric | Helpful vote count |

### 15. LocationComposition

**Tab: Location Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Street Address | `locationStreetAddress` | Textstring | Location address |
| City | `locationCity` | Textstring | City name |
| Region | `locationRegion` | Textstring | State/region |
| Country | `locationCountry` | Textstring | Country |
| Latitude | `locationLatitude` | Textstring | GPS coordinate |
| Longitude | `locationLongitude` | Textstring | GPS coordinate |
| Hours | `locationHours` | Textstring | Operating hours |
| Contact Phone | `locationPhone` | Textstring | Location phone |
| Amenities | `amenities` | Tags | Available features |
| Location Rating | `locationRating` | Decimal | Average rating |
| Rating Count | `locationRatingCount` | Numeric | Number of reviews |

### 16. SoftwareComposition

**Tab: Software Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Application Category | `applicationCategory` | Textstring | Software type |
| Operating Systems | `operatingSystem` | Checkboxlist | Supported OS |
| Version | `version` | Textstring | Current version |
| File Size | `fileSize` | Textstring | Download size |
| Developer Name | `developerName` | Textstring | Software company |
| Developer Website | `developerWebsite` | Url | Company website |
| Screenshots | `screenshots` | Multiple Media Picker | App screenshots |
| System Requirements | `systemRequirements` | Block List | Hardware requirements |
| Software Price | `softwarePrice` | Decimal | Cost |
| Price Currency | `softwareCurrency` | Textstring | Currency |
| Price Type | `priceType` | Dropdown | One-time/Subscription |

### 17. AnnouncementComposition

**Tab: Announcement Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Priority | `priority` | Dropdown | Low/Medium/High/Critical |
| Announcement Type | `announcementType` | Dropdown | Maintenance/Feature/Security |
| Effective Start | `effectiveStart` | Date Picker with Time | When announcement starts |
| Effective End | `effectiveEnd` | Date Picker with Time | When announcement ends |
| Target Audience | `targetAudience` | Textstring | Who should see this |
| Action Required | `actionRequired` | Textarea | What users need to do |
| Is Dismissible | `isDismissible` | True/False | Can users close this |

### 18. MembershipComposition

**Tab: Membership Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Plan Name | `planName` | Textstring | Subscription name |
| Monthly Price | `monthlyPrice` | Decimal | Monthly cost |
| Yearly Price | `yearlyPrice` | Decimal | Annual cost |
| Currency | `membershipCurrency` | Textstring | Price currency |
| Savings Text | `savings` | Textstring | Discount description |
| Features | `features` | Multiple Textstring | What's included |
| Limitations | `limitations` | Multiple Textstring | Plan restrictions |
| Trial Period | `trialPeriod` | Textstring | Free trial length |
| Is Popular | `isPopular` | True/False | Highlight as popular |

### 19. AchievementComposition

**Tab: Achievement Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Achievement Name | `achievementName` | Textstring | Full credential name |
| Issuing Organization | `issuingOrganization` | Textstring | Certifying body |
| Date Earned | `dateEarned` | Date Picker | When achieved |
| Expiration Date | `expirationDate` | Date Picker | When expires |
| Credential ID | `credentialId` | Textstring | Verification ID |
| Verification URL | `verificationUrl` | Url | Link to verify |
| Skill Level | `skillLevel` | Dropdown | Beginner/Professional/Expert |

### 20. GalleryComposition

**Tab: Gallery Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Total Count | `totalCount` | Numeric | Number of items |
| Album Name | `albumName` | Textstring | Collection name |
| Featured Media | `featuredMedia` | Media Picker | Hero image |
| Download Options | `downloadOptions` | Multiple Textstring | Available formats |
| Slideshow Enabled | `slideshowEnabled` | True/False | Allow slideshow |
| Gallery Categories | `galleryCategories` | Tags | Content categories |

### 21. ContactComposition

**Tab: Contact Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Contact Type | `contactType` | Textstring | Support type |
| Available Hours | `availableHours` | Textstring | Service hours |
| Response Time | `responseTime` | Textstring | Expected response |
| Contact Methods | `contactMethods` | Block List | Ways to get in touch |
| Languages Supported | `languagesSupported` | Multiple Textstring | Available languages |
| Department | `department` | Textstring | Team/division |

### 22. StatisticComposition

**Tab: Statistic Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Metric Name | `metricName` | Textstring | KPI name |
| Current Value | `currentValue` | Decimal | Current metric |
| Unit | `unit` | Textstring | Measurement unit |
| Trend | `trend` | Dropdown | Up/Down/Stable |
| Trend Percentage | `trendPercentage` | Decimal | Change percentage |
| Comparison Period | `comparisonPeriod` | Textstring | Time comparison |
| Target Value | `targetValue` | Decimal | Goal metric |
| Chart Data | `chartData` | Multiple Textstring | Historical values |
| Data Period | `dataPeriod` | Textstring | Time frame |

### 23. SocialComposition

**Tab: Social Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Platform | `platform` | Dropdown | Social network |
| Post Content | `postContent` | Textarea | Full post text |
| Author Handle | `authorHandle` | Textstring | Username |
| Likes Count | `likesCount` | Numeric | Number of likes |
| Shares Count | `sharesCount` | Numeric | Number of shares |
| Comments Count | `commentsCount` | Numeric | Number of comments |
| Hashtags | `hashtags` | Tags | Post hashtags |
| Media Attachments | `mediaAttachments` | Multiple Media Picker | Post images |

### 24. ComparisonComposition

**Tab: Comparison Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Comparison Items | `comparisonItems` | Block List | Products/services being compared |
| Comparison Criteria | `comparisonCriteria` | Block List | Features being compared |
| Recommended Item | `recommendedItem` | Textstring | Suggested choice |
| Comparison Summary | `comparisonSummary` | Textarea | Why recommended |

### 25. BookingComposition

**Tab: Booking Details**

| Property | Alias | Editor | Description |
|----------|-------|---------|-------------|
| Service Name | `serviceName` | Textstring | Bookable service |
| Venue | `venue` | Textstring | Location name |
| Capacity | `capacity` | Numeric | Maximum people |
| Duration | `duration` | Textstring | Booking length |
| Hourly Rate | `hourlyRate` | Decimal | Price per hour |
| Rate Currency | `rateCurrency` | Textstring | Currency |
| Available Slots | `availableSlots` | Block List | Date/time availability |
| Amenities | `bookingAmenities` | Multiple Textstring | Included features |
| Cancellation Policy | `cancellationPolicy` | Textarea | Cancellation terms |
| Special Requests | `specialRequests` | Textarea | Custom requests info |

## Block List Configurations

### Author Block

| Property | Alias | Type | Description |
|----------|-------|------|-------------|
| Name | `name` | Textstring | Author name |
| Role | `role` | Textstring | Job title |
| Avatar | `avatar` | Media Picker | Profile image |
| Profile URL | `url` | Url | Author page link |
| Contacts | `contacts` | Nested Content | Contact methods |

### Tag Block

| Property | Alias | Type | Description |
|----------|-------|------|-------------|
| Name | `name` | Textstring | Tag name |
| URL | `url` | Url | Tag page link |

### Link Block

| Property | Alias | Type | Description |
|----------|-------|------|-------------|
| Text | `text` | Textstring | Link text |
| URL | `url` | Url | Link destination |
| Icon | `icon` | Textstring | Material icon name |
| Hide Text | `hideText` | True/False | Show only icon |
| Is Wrapper | `isWrapper` | True/False | Make whole card clickable |

### Action Block

| Property | Alias | Type | Description |
|----------|-------|------|-------------|
| Text | `text` | Textstring | Button text |
| URL | `url` | Url | Action destination |
| Icon | `icon` | Textstring | Material icon name |
| ARIA Label | `ariaLabel` | Textstring | Accessibility label |
| Type | `type` | Dropdown | Button/Link |
| Has Popover | `popover` | True/False | Opens popover |
| Popover Content | `popoverContent` | RTE | Popover HTML |

### Reaction Block

| Property | Alias | Type | Description |
|----------|-------|------|-------------|
| Type | `type` | Textstring | Like/dislike/love |
| Icon | `icon` | Textstring | Material icon name |
| Count | `count` | Numeric | Number of reactions |
| Value | `value` | Decimal | Rating value (optional) |
| Max | `max` | Numeric | Maximum rating |
| Active | `active` | True/False | User's current state |
| ARIA Label | `ariaLabel` | Textstring | Accessibility label |

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
1. Create base ContentCard document type with core properties
2. Set up Block List configurations for common elements
3. Create card type selector property editor
4. Implement basic rendering infrastructure

### Phase 2: Core Card Types (Weeks 3-4)
1. Implement compositions for Article, News, Product, Recipe
2. Create corresponding Razor partial views
3. Set up JSON API endpoints
4. Test basic functionality

### Phase 3: Extended Card Types (Weeks 5-6)
1. Implement remaining original compositions (Event, Business, Poll, etc.)
2. Add advanced features (Schema.org, responsive images)
3. Implement popover functionality
4. Performance optimization

### Phase 4: New Card Types (Weeks 7-8)
1. Implement new compositions (Profile, Course, Job, etc.)
2. Create specialized property editors where needed
3. Advanced interactive features (booking, polls)
4. Testing and validation

### Phase 5: Integration & Polish (Weeks 9-10)
1. Block List/Grid integration
2. Search and filtering
3. Caching strategies
4. Documentation and training
5. Performance testing and optimization

## Property Editors

### Card Type Selector
- Custom AngularJS property editor
- Shows/hides composition tabs based on selection
- Provides card type icons and descriptions
- Validates required compositions

### Dynamic Composition Manager
- Shows relevant composition tabs based on card type
- Handles property visibility and validation
- Provides contextual help text
- Manages property dependencies

### Rich Popover Editor
- WYSIWYG editor for popover content
- Supports both article and video popovers
- Preview functionality
- Media picker integration

## API Endpoints

### Content API
- `GET /api/cards` - List cards with filtering/paging
- `GET /api/cards/{id}` - Get single card with full data
- `GET /api/cards/types` - Get available card types
- `POST /api/cards/{id}/engagement` - Update engagement metrics

### Management API
- `GET /api/cards/templates` - Get card type templates
- `POST /api/cards/validate` - Validate card data
- `GET /api/cards/schema/{type}` - Get schema.org definitions

## Rendering Strategy

### Razor Partial Views
- Base partial: `Views/Partials/Cards/BaseCard.cshtml`
- Type-specific partials: `Views/Partials/Cards/{Type}Card.cshtml`
- Component partials for reusable elements
- Responsive image rendering with srcset

### JSON Output
- Service layer to transform Umbraco content to JSON
- Schema.org markup generation
- Image optimization and srcset generation
- Caching at multiple levels

### Frontend Integration
- Direct Razor rendering for server-side scenarios
- JSON API for JavaScript/SPA integration
- Support for both approaches simultaneously
- Progressive enhancement strategies

## Content Management

### Editor Experience
- Simplified content entry with contextual fields
- Live preview functionality
- Bulk operations for card collections
- Import/export capabilities

### Content Organization
- Cards container nodes for different sections
- Flexible taxonomy with tags and categories
- Search and filtering in backoffice
- Workflow and approval processes

### Performance Optimization
- Efficient database queries with proper indexing
- Multi-level caching (output, data, media)
- Image optimization and CDN integration
- Lazy loading and progressive enhancement

## Migration and Deployment

### Data Migration
- Scripts to migrate existing content
- Validation and testing procedures
- Rollback strategies
- Performance monitoring

### Deployment Strategy
- Staged deployment approach
- Database upgrade scripts
- Configuration management
- Testing procedures

This implementation provides a robust, scalable foundation for managing all card types in Umbraco while maintaining the flexibility and performance characteristics of the frontend component system.