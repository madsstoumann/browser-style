---
sidebar_label: UCF Specification
---

# Unified Content Format (UCF) Specification

Version 1.0.0

## Overview

The Unified Content Format (UCF) is a portable JSON schema for representing content instances across multiple CMS platforms. While the Unified Content Model (UDM) defines content *types* (schemas), UCF defines content *instances* (the actual data).

UCF enables:
- **Cross-platform content migration** - Move content between CMS platforms
- **Content backup and restore** - Version-controlled content outside the CMS
- **Multi-environment sync** - Push the same content to development, staging, and production
- **CMS-agnostic workflows** - Edit content locally, deploy anywhere

---

## Content File Structure

Each content item is stored as a JSON file with the following structure:

```json
{
  "$schema": "../../models/{model-id}.schema.json",
  "id": "content-identifier",
  "model": "model-id",
  "meta": { ... },
  "fields": { ... }
}
```

### Root Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `$schema` | string | Yes | Relative path to the content model schema |
| `id` | string | Yes | Unique content identifier (slug-based) |
| `model` | string | Yes | The content model/type this content belongs to |
| `meta` | object | Yes | Metadata about the content item |
| `fields` | object | Yes | The actual content field values |

### Content ID Convention

The `id` field serves as a human-readable, URL-safe identifier:

- **Format**: lowercase, hyphen-separated words
- **Source**: Derived from title, name, slug, or URL field
- **Uniqueness**: Must be unique within a model
- **Examples**: `welcome-to-ucm`, `sarah-chen`, `about-us`

```
Good: "getting-started-guide"
Good: "product-enterprise-license"
Bad:  "Getting Started Guide" (spaces, uppercase)
Bad:  "6aBcD3fGh1jK" (CMS-specific ID)
```

---

## Meta Object

The `meta` object contains metadata about the content item:

```json
{
  "meta": {
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T14:30:00Z",
    "locale": "en-US",
    "status": "published",
    "umbraco": {
      "id": 1234,
      "key": "e9a2c384-7d2f-4dce-990b-88e84fd302d2",
      "parentId": -1
    }
  }
}
```

### Meta Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `createdAt` | string (ISO 8601) | Yes | When the content was first created |
| `status` | string | Yes | Publication status: `draft` or `published` |
| `updatedAt` | string (ISO 8601) | Yes | When the content was last modified |
| `locale` | string | No* | Content locale (e.g., `en-US`, `da`, `de-DE`). *Falls back to `DEFAULT_LOCALE` config |

### CMS-Specific Metadata

Each CMS can store platform-specific data in a namespaced property:

```json
{
  "meta": {
    "umbraco": {
      "id": 1234,
      "key": "e9a2c384-7d2f-4dce-990b-88e84fd302d2",
      "parentId": -1
    }
  }
}
```

```json
{
  "meta": {
    "contentful": {
      "entryId": "6aBcD3fGh1jK",
      "version": 5
    }
  }
}
```

```json
{
  "meta": {
    "storyblok": {
      "id": 123456789,
      "uuid": "abc123-def456"
    }
  }
}
```

This metadata is preserved during pull operations and can be used for reference, but is **not required** for push operations.

---

## Fields Object

The `fields` object contains the actual content values. Field names must match the property names defined in the content model schema.

```json
{
  "fields": {
    "headline": "Welcome to UCM",
    "summary": "Cross-platform content management made simple.",
    "publishDate": "2026-01-12",
    "featured": true,
    "rating": 4.8
  }
}
```

### Primitive Field Types

| Type | JSON Type | Example |
|------|-----------|---------|
| boolean | boolean | `true`, `false` |
| color | string | `"#FF5733"` |
| date | string | `"2026-01-12"` |
| datetime | string | `"2026-01-12T10:30:00Z"` |
| number | number | `42`, `3.14` |
| slug | string | `"my-page-slug"` |
| string | string | `"Hello World"` |
| text | string | `"Multi-line\ntext content"` |
| url | string | `"https://example.com"` |

---

## Special Field Types

UCF uses special object structures to represent complex field types that require CMS-specific handling.

### Content References (`$ref`)

References to other content items use the `$ref` property with a composite key:

```json
{
  "author": {
    "$ref": "author/jane-doe"
  }
}
```

**Composite Key Format**: `{model}/{content-id}`

The composite key is resolved to CMS-specific IDs during push operations using the manifest.

#### Array of References

```json
{
  "relatedArticles": [
    { "$ref": "article/getting-started" },
    { "$ref": "article/advanced-usage" },
    { "$ref": "article/api-reference" }
  ]
}
```

#### Unresolved References

When pulling content, if a reference cannot be resolved to a known content item, it uses the `unresolved/` prefix:

```json
{
  "author": {
    "$ref": "unresolved/6aBcD3fGh1jK"
  }
}
```

### Media/Asset References (`$asset`)

References to media assets (images, files, videos) use the `$asset` property:

```json
{
  "heroImage": {
    "$asset": "assets/hero-banner",
    "assetId": "hero-banner"
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `$asset` | string | Asset path in format `assets/{asset-id}` |
| `assetId` | string | The asset identifier |

When using `--with-assets`, the actual files are stored in `.ucm/assets/` with content-addressed naming (hash-based deduplication).

### Rich Text (`$richtext`)

Rich text content uses the `$richtext` marker with format-specific content:

```json
{
  "body": {
    "$richtext": true,
    "content": "<p>This is <strong>rich</strong> text.</p>",
    "format": "html"
  }
}
```

For CMS-specific rich text formats (like Contentful's structured content):

```json
{
  "body": {
    "$richtext": true,
    "content": {
      "nodeType": "document",
      "content": [
        {
          "nodeType": "paragraph",
          "content": [
            { "nodeType": "text", "value": "Hello World" }
          ]
        }
      ]
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `$richtext` | boolean | Always `true` - marks this as rich text |
| `content` | string \| object | The rich text content (HTML string or structured object) |
| `format` | string | Optional format hint: `html`, `markdown`, `structured` |

### JSON/Object Fields

Complex data stored as JSON objects or arrays. Some CMS platforms store these as strings:

```json
{
  "data": {
    "type": "product",
    "sku": "UDM-ENT-2026",
    "price": {
      "amount": 999,
      "currency": "USD"
    },
    "features": ["Feature 1", "Feature 2"]
  }
}
```

**Note**: When pulling from CMS platforms like Umbraco that store JSON as strings, the content may appear as:

```json
{
  "data": "{\"type\":\"product\",\"sku\":\"UDM-ENT-2026\"}"
}
```

UCF adapters automatically parse JSON strings when pushing to platforms that expect native objects (like Contentful).

### Tags/Arrays

Simple arrays of strings:

```json
{
  "tags": ["typescript", "nodejs", "cms"]
}
```

Or as a JSON string (from some CMS platforms):

```json
{
  "tags": "[\"typescript\",\"nodejs\",\"cms\"]"
}
```

### Geopoint

Geographic coordinates:

```json
{
  "location": {
    "lat": 55.6761,
    "lng": 12.5683
  }
}
```

---

## Complete Example

```json
{
  "$schema": "../../models/article.schema.json",
  "id": "getting-started-with-ucm",
  "model": "article",
  "meta": {
    "createdAt": "2026-01-10T09:00:00Z",
    "updatedAt": "2026-01-12T14:30:00Z",
    "locale": "en-US",
    "status": "published",
    "contentful": {
      "entryId": "3Kt1Th8vZ4TrBNzwFjMUXW",
      "version": 3
    }
  },
  "fields": {
    "title": "Getting Started with UCM",
    "slug": "getting-started-with-ucm",
    "summary": "Learn how to use the Unified Content Model for cross-platform content management.",
    "body": {
      "$richtext": true,
      "content": "<h2>Introduction</h2><p>Welcome to UCM...</p>",
      "format": "html"
    },
    "author": {
      "$ref": "author/jane-doe"
    },
    "heroImage": {
      "$asset": "assets/ucm-hero",
      "assetId": "ucm-hero"
    },
    "publishDate": "2026-01-10",
    "tags": ["tutorial", "getting-started", "documentation"],
    "featured": true,
    "relatedArticles": [
      { "$ref": "article/advanced-configuration" },
      { "$ref": "article/cms-adapters" }
    ],
    "metadata": {
      "readTime": "5 min",
      "difficulty": "beginner"
    }
  }
}
```

---

## File Storage Structure

Content files are organized in a predictable directory structure:

```
.ucm/
├── content/
│   ├── manifest.json              # ID mappings and dependencies
│   ├── article/
│   │   ├── getting-started.json
│   │   └── advanced-usage.json
│   ├── author/
│   │   └── jane-doe.json
│   └── content-card/
│       ├── welcome-card.json
│       └── feature-highlight.json
└── assets/                        # Media files (with --with-assets)
    ├── hero-banner.jpg
    └── profile-photo.png
```

### File Naming

Content files are named `{content-id}.json`:

- `getting-started.json` for content with `"id": "getting-started"`
- `jane-doe.json` for content with `"id": "jane-doe"`

---

## Manifest File

The manifest (`manifest.json`) tracks CMS-specific IDs and dependencies:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-12T14:30:00.000Z",
  "environments": {
    "umbraco:production": {
      "article/getting-started": "e9a2c384-7d2f-4dce-990b-88e84fd302d2",
      "author/jane-doe": "4b63de2b-f7fc-4d30-b63b-505cbf251c6a"
    },
    "contentful:master": {
      "article/getting-started": "3Kt1Th8vZ4TrBNzwFjMUXW",
      "author/jane-doe": "6eQyQIsfPhaKAiwoJasEE6"
    }
  },
  "dependencies": {
    "article/getting-started": ["author/jane-doe"],
    "author/jane-doe": []
  },
  "restoreOrder": [
    "author/jane-doe",
    "article/getting-started"
  ]
}
```

### Manifest Properties

| Property | Description |
|----------|-------------|
| `dependencies` | Content reference dependencies for each item |
| `environments` | Map of environment keys to content ID mappings |
| `lastUpdated` | ISO 8601 timestamp of last modification |
| `restoreOrder` | Topologically sorted order for pushing (dependencies first) |
| `version` | Manifest schema version |

### Environment Keys

Environment keys follow the format `{platform}:{environment}`:

- `contentful:master`
- `contentful:staging`
- `umbraco:production`
- `storyblok:draft`
- `sanity:production`

---

## Reference Resolution

When pushing content, references are resolved in two steps:

### 1. Composite Key Lookup

The `$ref` value (`model/content-id`) is looked up in the manifest for the target environment:

```json
{ "$ref": "author/jane-doe" }
```

Manifest lookup:
```json
{
  "environments": {
    "contentful:master": {
      "author/jane-doe": "6eQyQIsfPhaKAiwoJasEE6"
    }
  }
}
```

### 2. CMS-Specific Format

The resolved ID is formatted for the target CMS:

**Contentful:**
```json
{
  "sys": {
    "type": "Link",
    "linkType": "Entry",
    "id": "6eQyQIsfPhaKAiwoJasEE6"
  }
}
```

**Umbraco:**
```json
{
  "udi": "umb://document/4b63de2bf7fc4d30b63b505cbf251c6a"
}
```

---

## Locale Handling

UCF supports multi-locale content through locale-suffixed filenames.

> **Note:** For schema-level localization (which fields vary by culture), see the [Localization docs](https://github.com/user/unified-content-model/blob/main/docs/LOCALE.md) in the UCM project.

```
.ucm/content/article/
├── getting-started.json        <- en-US (default locale)
├── getting-started.da.json     <- Danish
└── getting-started.de-DE.json  <- German
```

### Locale Resolution

1. **Explicit**: `meta.locale` in content file
2. **Fallback**: `DEFAULT_LOCALE` from `.cmsconfig`
3. **Default**: `en-US` if neither specified

### Filename Convention

- Default locale: `{content-id}.json`
- Other locales: `{content-id}.{locale}.json`

Examples:
- `article-1.json` (en-US)
- `article-1.da.json` (Danish)
- `article-1.de-DE.json` (German)

### CLI Commands

```bash
# Pull default locale only
ucm content pull

# Pull specific locale(s)
ucm content pull --locale da
ucm content pull --locale en-US,da,de-DE

# Pull all available locales
ucm content pull --all-locales

# Push all locale files found
ucm content push
```

### CMS Mapping

Multiple locale files map to the **same CMS entry**. The manifest stores one entry ID per content item:

```json
{
  "environments": {
    "contentful:master": {
      "article/getting-started": "3Kt1Th8vZ4TrBNzwFjMUXW"
    }
  }
}
```

Both `getting-started.json` and `getting-started.da.json` push to entry `3Kt1Th8vZ4TrBNzwFjMUXW`, just to different locale slots.

### Cross-Platform Locale Mapping

When pushing to a CMS, the adapter uses the locale from the content file's `meta.locale` field. This allows content to be properly localized across different CMS platforms:

| Source | Target | Result |
|--------|--------|--------|
| `getting-started.json` (en-US) | Contentful | Content pushed to `en-US` locale slot |
| `getting-started.da.json` (da) | Contentful | Content pushed to `da` locale slot |

---

## Type Coercion

UCF adapters automatically handle type differences between CMS platforms:

### JSON String Parsing

Some CMS platforms store arrays and objects as JSON strings. UCF adapters parse these automatically:

**Input (from Umbraco):**
```json
{
  "tags": "[\"cms\",\"tutorial\"]",
  "data": "{\"type\":\"article\"}"
}
```

**Output (to Contentful):**
```json
{
  "tags": ["cms", "tutorial"],
  "data": { "type": "article" }
}
```

### Null Handling

Null values are preserved and passed through:

```json
{
  "subtitle": null,
  "heroImage": null
}
```

---

## CLI Commands

### Pull Content from CMS

```bash
ucm content pull                           # Pull all content
ucm content pull --model article           # Pull specific model
ucm content pull --model article --id home # Pull specific item
ucm content pull --with-assets             # Include media files
ucm content pull --output ./backup         # Pull to custom directory
```

### Push Content to CMS

```bash
ucm content push                           # Push all content
ucm content push --model article           # Push specific model
ucm content push --model article --id home # Push specific item
ucm content push --with-assets             # Include media files
ucm content push --input ./backup          # Push from custom directory
ucm content push --dry-run                 # Preview without applying
ucm content push --yes                     # Skip confirmation
```

### Command Options

| Flag | Short | Description |
|------|-------|-------------|
| `--dry-run` | `-d` | Preview changes without applying |
| `--id <id>` | `-I` | Filter by content identifier |
| `--input <dir>` | `-i` | Input directory for push (overrides `CONTENT_PATH`) |
| `--model <model>` | `-m` | Filter by content model |
| `--output <dir>` | `-o` | Output directory for pull (overrides `CONTENT_PATH`) |
| `--verbose` | `-v` | Verbose output |
| `--with-assets` | `-a` | Include binary assets |
| `--yes` | `-y` | Skip confirmation prompts |

### Use Cases for `--output` and `--input`

**Backup before pulling new content:**
```bash
# Pull to backup location first
ucm content pull --output ./backup/content-$(date +%Y%m%d)

# Then pull to default location
ucm content pull
```

**Cross-CMS migration workflow:**
```bash
# Pull from CMS A to isolated folder
CMS_PLATFORM=umbraco ucm content pull --output ./migration/from-umbraco

# Push to CMS B from that folder
CMS_PLATFORM=contentful ucm content push --input ./migration/from-umbraco
```

**Keep separate content versions:**
```bash
# Production content
ucm content pull --output ./content/production

# Staging content
CONTENTFUL_ENVIRONMENT=staging ucm content pull --output ./content/staging
```

---

## Best Practices

### 1. Use Descriptive Content IDs

```
Good: "getting-started-guide"
Good: "2026-annual-report"
Bad:  "page1"
Bad:  "temp"
```

### 2. Keep Content Files in Version Control

The `.ucm/content/` directory should be committed to your repository for:
- Content versioning and history
- Team collaboration
- Disaster recovery

### 3. Exclude CMS-Specific Metadata When Creating Content

When manually creating content files, only the core structure is required:

```json
{
  "$schema": "../../models/article.schema.json",
  "id": "my-new-article",
  "model": "article",
  "meta": {
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T10:00:00Z",
    "locale": "en-US",
    "status": "draft"
  },
  "fields": {
    "title": "My New Article",
    "body": "Content here..."
  }
}
```

CMS-specific metadata will be added automatically after the first push.

### 4. Resolve Dependencies Before Pushing

Content with references should be pushed after the referenced content exists. The manifest's `restoreOrder` handles this automatically, but for manual operations:

1. Push `author/jane-doe` first
2. Then push `article/getting-started` (which references the author)

### 5. Use `--dry-run` Before Large Pushes

```bash
ucm content push --dry-run
```

This previews what would be created/updated without making changes.

---

## Validation

UCF content files can be validated against the schema at `schemas/unified-content.schema.json`.

### Running Validation

```bash
# Validate all content files
npm run validate:content

# Validate a single content file
npx ajv validate -s schemas/unified-content.schema.json -d .ucm/content/content-card/welcome-card.json
```

### Validation Rules

Content files should:

1. Have a valid `$schema` reference pointing to an existing model
2. Have a unique `id` within the model
3. Have all required `meta` properties
4. Have field values matching the types defined in the model schema
5. Have valid `$ref` composite keys for references
6. Have valid `$asset` references for media

---

## Comparison: UCF vs UDM

| Aspect | UDM (Models) | UCF (Content) |
|--------|--------------|---------------|
| Purpose | Define content structure | Store content instances |
| Location | `models/*.schema.json` | `.ucm/content/{model}/*.json` |
| Validates against | `schemas/unified-content-type.schema.json` | `schemas/unified-content.schema.json` |
| Contains | Field definitions, validations, options | Actual content values |
| Example | "Article has title (string), body (richtext)" | "Welcome Article with title='Hello'" |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial specification |
