# Content Type Schemas

This folder contains the Universal Content Model schema definitions.

## Current Schemas

| Schema | Description |
|--------|-------------|
| [page.schema.json](page.schema.json) | Top-level page with URL, SEO, and layout references |
| [layout.schema.json](layout.schema.json) | Layout container that holds content cards |
| [layout-config.schema.json](layout-config.schema.json) | Layout configuration options |
| [content-card.schema.json](content-card.schema.json) | Polymorphic card supporting 25 content types |
| [site.schema.json](site.schema.json) | Global singleton configuration (analytics, icons, CSP, etc.) |
| [navigation.schema.json](navigation.schema.json) | Navigation menu structure |
| [navigation-item.schema.json](navigation-item.schema.json) | Individual navigation items |
| [social-link.schema.json](social-link.schema.json) | Social media profile links |
| [theme.schema.json](theme.schema.json) | Theme/design settings |

## Schema Structure

All schemas follow JSON Schema Draft 7 with Universal Content Model extensions:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "id": "content-type-id",
  "title": "Display Name",
  "description": "Description of this content type",
  "metadata": {
    "version": "1.0.0",
    "displayField": "title"
  },
  "structure": {
    "allowedAsRoot": true,
    "folder": "Content",
    "layout": [...]
  },
  "type": "object",
  "properties": {
    "fieldName": {
      "type": "universal-type",
      "title": "Field Label",
      "description": "Field description",
      "validation": { ... },
      "options": { ... },
      "ui": { "widget": "custom-widget-id" }
    }
  },
  "required": ["field1", "field2"]
}
```

## Universal Types Reference

### Core Types

| Type | Description |
|------|-------------|
| `string` | Single-line text |
| `text` | Multi-line text |
| `number` | Integer or decimal |
| `boolean` | True/false |
| `date` | Date without time |
| `datetime` | Date with time |

### Structural Types

| Type | Description |
|------|-------------|
| `richtext` | Formatted content (HTML/JSON) |
| `media` | File references (images, videos, documents) |
| `reference` | Links to other content items |
| `array` | Lists of items |
| `select` | Dropdown with predefined options |
| `url` | Web addresses |
| `object` | Arbitrary JSON data |

### Special Types

| Type | Description |
|------|-------------|
| `slug` | URL-safe identifier |
| `tags` | Tag collections |
| `color` | Color values |
| `geopoint` | Geographic coordinates |

## Field Properties

### Validation

```json
"validation": {
  "required": true,
  "minLength": 10,
  "maxLength": 100,
  "pattern": "^[a-z0-9-]+$",
  "minimum": 0,
  "maximum": 100,
  "minItems": 1,
  "maxItems": 10
}
```

### Options (Type-specific)

**Media:**
```json
"options": {
  "accept": ["image/jpeg", "image/png"],
  "maxSize": 5242880
}
```

**Reference:**
```json
"options": {
  "referenceType": "page",
  "multiple": true,
  "maxItems": 5
}
```

**Select:**
```json
"options": {
  "choices": [
    { "value": "draft", "label": "Draft" },
    { "value": "published", "label": "Published" }
  ],
  "multiple": false
}
```

**Slug:**
```json
"options": {
  "source": "title"
}
```

### UI (Custom Widgets)

For fields that use custom property editors:

```json
"ui": {
  "widget": "web-config-card"
}
```

Available widgets:
- `web-config-card` - Content Card editor
- `web-config-csp` - CSP policy editor
- `web-config-manifest` - PWA manifest editor
- `web-config-robots` - robots.txt editor
- `web-config-security` - security.txt editor

## Structure Configuration

### Editor Layout

Organize fields into groups/tabs:

```json
"structure": {
  "layout": [
    {
      "type": "group",
      "name": "Content",
      "description": "Main content fields",
      "collapse": false,
      "fields": ["title", "body", "image"]
    },
    {
      "type": "group",
      "name": "SEO",
      "collapse": true,
      "fields": ["meta_title", "meta_description"]
    }
  ]
}
```

### Content Tree

Control where content appears:

```json
"structure": {
  "allowedAsRoot": true,
  "folder": "Pages",
  "allowedChildContentTypes": ["content-card"]
}
```

## Using the Schemas

```bash
# Validate all schemas
npm run validate

# Sync to CMS (uses CMS_PLATFORM from .cmsconfig)
npm run sync

# Sync single schema
npm run sync:umbraco -- --file=models/page.schema.json

# Pull existing content types from CMS
npm run pull:contentful

# Compare local vs CMS
npm run diff
```

## Best Practices

1. **Use meaningful IDs** - The `id` field should be lowercase with hyphens (e.g., `blog-post`)
2. **Provide descriptions** - Help editors understand each field's purpose
3. **Set appropriate validation** - Balance flexibility with data quality
4. **Use references** - Link related content types
5. **Organize with layout** - Group related fields together
6. **Set required fields** - Only require truly essential fields
7. **Use custom widgets** - For complex data like CSP, manifests, etc.
