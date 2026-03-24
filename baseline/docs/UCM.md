---
sidebar_label: UCM Specification
---

# Unified Content Model

This document describes the Unified Content Model - a standardized approach to defining content structures that work across multiple Content Management Systems (CMS). It provides a unified JSON schema that abstracts CMS-specific differences, enabling cross-platform compatibility, easier migrations, and consistent content modeling.

## The Unified Content Model Concept

### The Problem
Content management systems vary significantly in their data models, APIs, and capabilities. This creates challenges when:
- Migrating content between CMS platforms
- Building omnichannel experiences that span multiple systems
- Maintaining consistent content structures across different environments
- Developing reusable components and templates

### The Solution
The Unified Content Model defines a standardized JSON schema (`schemas/unified-content-type.schema.json`) that provides:
- **Unified Types**: Abstract field types (`string`, `boolean`, `richtext`, etc.) that map to CMS-specific implementations
- **Consistent Structure**: Standardized schema properties for fields, validation, and content organization
- **Cross-CMS Compatibility**: Adapters that translate unified schemas to platform-specific formats
- **Extensibility**: Support for CMS-specific features while maintaining portability

### Key Benefits
- **Portability**: Define content models once, deploy anywhere
- **Migration**: Automated content and schema migration between CMS platforms
- **Consistency**: Unified content modeling approach across teams and projects
- **Future-Proofing**: Adapt to new CMS platforms without rewriting schemas

## The Unified Schema

The Unified Content Model uses a JSON Schema (draft-07) format that defines content types with consistent structure and validation. The meta-schema in `schemas/unified-content-type.schema.json` validates all unified content type definitions.

### Core Schema Properties

Every unified content type schema must include:
- `$schema`: Reference to the JSON Schema version
- `id`: Unique identifier (lowercase, hyphens allowed)
- `title`: Human-readable name
- `type`: Must be `"object"`
- `properties`: Field definitions
- `required`: Array of required field names (optional)

### Unified Field Types

The model defines these field types that map to all supported CMS platforms:

#### Core Types

| Unified Type | Description | Example Use |
|----------------|-------------|-------------|
| `array` | Ordered lists | Multiple items |
| `boolean` | True/false values | Enable/disable flags |
| `date` | Date-only values | Publication dates |
| `datetime` | Date and time | Event timestamps |
| `media` | File references | Images, documents |
| `number` | Numeric values | Quantities, ratings |
| `object` | Arbitrary JSON | Settings, CSP, config |
| `reference` | Content links | Related articles |
| `richtext` | Formatted text | Content bodies |
| `select` | Choice options | Dropdowns, radio buttons |
| `string` | Single-line text | Titles, names |
| `text` | Multi-line text | Descriptions, notes |
| `url` | URL strings | Links, references |

#### Specialized Types

| Unified Type | Description | Example Use | CMS Support |
|----------------|-------------|-------------|-------------|
| `color` | Color values | Theme colors, brands | 7/7 platforms |
| `geopoint` | Geographic coordinates | Store locations | 6/7 platforms |
| `slug` | URL-safe identifiers | Page slugs, routes | 7/7 platforms |
| `tags` | Tag collections | Keywords, categories | 7/7 platforms |

### Field Definition Structure

```json
{
  "fieldName": {
    "type": "string",
    "title": "Field Title",
    "description": "Field description",
    "validation": {
      "required": true,
      "minLength": 1,
      "maxLength": 100
    },
    "options": {
      "choices": [
        {"value": "option1", "label": "Option 1"}
      ]
    }
  }
}
```

### Content Organization

The `structure` property controls how content types appear and behave in CMS interfaces:

```json
{
  "structure": {
    "folder": "Content Types",
    "allowedAsRoot": true,
    "allowedChildContentTypes": ["article", "page"],
    "layout": [
      {
        "type": "group",
        "name": "Content",
        "fields": ["title", "body"]
      }
    ]
  }
}
```

## Polymorphic Content Support

All supported CMS platforms enable polymorphic content references, allowing layouts to contain multiple different content types in a single array field.

| CMS | Field Type | Supports Multiple Content Types |
|-----|-----------|--------------------------------|
| Contentful | Array of Links with `linkContentType` validation | ✅ |
| Contentstack | Blocks (Modular Blocks) | ✅ |
| Optimizely | ContentArea | ✅ |
| Sanity | Array of References | ✅ |
| Sitecore | Multilist / Treelist | ✅ |
| Storyblok | Bloks | ✅ |
| Umbraco | Block List / Nested Content | ✅ |

This capability enables flexible page structures where layouts can contain multiple content items of different types, with frontend receiving type information to render appropriate components.

## CMS Platform Comparisons

The following tables compare how each CMS implements the unified field types. Each row shows the CMS-specific type names and key implementation details.

### Boolean

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Boolean | Simple true/false field |
| Contentstack | Boolean | Field type: "boolean" |
| Optimizely | Boolean | Property type: `PropertyBoolean` |
| Sanity | Boolean | Standard boolean field |
| Sitecore | Checkbox | Field type: "Checkbox" |
| Storyblok | Boolean | Checkbox field |
| Umbraco | True/False | Property editor: "Umbraco.TrueFalse" |

### Short Text / String

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Short text | Single line, max 256 chars |
| Contentstack | Text | Field type: "text", max length configurable |
| Optimizely | String | Property type: `PropertyString` |
| Sanity | String | Basic string field |
| Sitecore | Single-Line Text | Field type: "Single-Line Text" |
| Storyblok | Text | Single line text field |
| Umbraco | Textstring | Property editor: "Umbraco.TextBox" |

### Long Text / Text

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Long text | Multi-line text, no rich formatting |
| Contentstack | Textarea | Field type: "textarea" |
| Optimizely | String (Long) | Property type: `PropertyLongString` |
| Sanity | Text | Multi-line text field |
| Sitecore | Multi-Line Text | Field type: "Multi-Line Text" |
| Storyblok | Textarea | Multi-line text field |
| Umbraco | Textarea | Property editor: "Umbraco.TextArea" |

### Number

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Number (Integer/Decimal) | Separate types for int/decimal |
| Contentstack | Number | Field type: "number" |
| Optimizely | Number | Property type: `PropertyNumber` |
| Sanity | Number | Basic number field |
| Sitecore | Number | Field type: "Number" |
| Storyblok | Number | Numeric input field |
| Umbraco | Number | Property editor: "Umbraco.Integer" or "Umbraco.Decimal" |

### Date

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Date | Date only (no time) |
| Contentstack | Date | Field type: "date" |
| Optimizely | Date | Property type: `PropertyDate` |
| Sanity | Date | Date field |
| Sitecore | Date | Field type: "Date" |
| Storyblok | Date | Date picker |
| Umbraco | Date Picker | Property editor: "Umbraco.DatePicker" |

### DateTime

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Date & time | Full datetime with timezone |
| Contentstack | Date | Field type: "date" (time support varies) |
| Optimizely | DateTime | Property type: `PropertyDateTime` |
| Sanity | Datetime | Date and time field |
| Sitecore | Datetime | Field type: "Datetime" |
| Storyblok | Datetime | Date and time picker |
| Umbraco | Date Time | Property editor: "Umbraco.DateTime" |

### URL

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Short text | With URL validation |
| Contentstack | Link | Field type: "link" |
| Optimizely | URL | Property type: `PropertyUrl` |
| Sanity | URL | Dedicated URL field |
| Sitecore | General Link | Field type: "General Link" |
| Storyblok | Link | URL field |
| Umbraco | Textstring | With URL validation |

### Rich Text

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Rich text | JSON-based rich text format |
| Contentstack | Rich Text Editor | Field type: "rich_text_editor" |
| Optimizely | XhtmlString | Property type: `PropertyXhtmlString` |
| Sanity | Rich text | Portable Text format |
| Sitecore | Rich Text | Field type: "Rich Text" |
| Storyblok | Richtext | HTML-based rich text |
| Umbraco | Rich Text Editor | Property editor: "Umbraco.RichText" |

### Media

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Media | Asset reference |
| Contentstack | File | Field type: "file" |
| Optimizely | ContentReference | Property type: `PropertyContentReference` |
| Sanity | Image/File | Asset references |
| Sitecore | Image/File | Field type: "Image" or "File" |
| Storyblok | Image/File | Asset fields |
| Umbraco | Media Picker | Property editor: "Umbraco.MediaPicker" |

### Reference

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Reference | Single content reference |
| Contentstack | Reference | Field type: "reference" |
| Optimizely | ContentReference | Property type: `PropertyContentReference` |
| Sanity | Reference | Content reference field |
| Sitecore | Droplink/Droptree | Field type: "Droplink" or "Droptree" |
| Storyblok | Link | Content link field |
| Umbraco | Content Picker | Property editor: "Umbraco.ContentPicker" |

### Array

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Array | Ordered list of items |
| Contentstack | Group | Field type: "group" |
| Optimizely | ContentArea | Property type: `PropertyContentArea` |
| Sanity | Array | Ordered collection |
| Sitecore | Multilist | Field type: "Multilist" |
| Storyblok | Blocks | Ordered list of blocks |
| Umbraco | Block List | Property editor: "Umbraco.BlockList" |

### Select / Choice

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Short text | With predefined values |
| Contentstack | Select | Field type: "select" |
| Optimizely | SelectOne | Property type: `PropertySelectOne` |
| Sanity | String | With predefined options |
| Sitecore | Droplist | Field type: "Droplist" |
| Storyblok | Select | Dropdown field |
| Umbraco | Dropdown | Property editor: "Umbraco.Dropdown" |

#### Unified Schema Structure for Select

```json
{
  "type": "select",
  "title": "Choose an Option",
  "description": "Select from predefined choices",
  "validation": {
    "required": true
  },
  "options": [
    {
      "value": "option1",
      "label": "Option 1"
    },
    {
      "value": "option2",
      "label": "Option 2"
    }
  ]
}
```

### Object / JSON

| CMS | Implementation | Status | Notes |
|-----|----------------|--------|-------|
| **Contentful** | `Object` | ✅ Native | Fully supported as a JSON object field. |
| **Contentstack** | `json` | ✅ Native | Supported via the JSON RTE / JSON field type. |
| **Optimizely** | `PropertyJsonString` | ⚠️ String | Stored as a string, parsed at runtime. |
| **Sanity** | `object` | ✅ Native | Supported, though typically expects a defined schema. |
| **Sitecore** | `NameValueList` | ⚠️ Limited | Key-value pairs only, or stored as a string blob. |
| **Storyblok** | `text` / `plugin` | ⚠️ String | Usually stored as a stringified JSON blob unless a specific JSON plugin is used. |
| **Umbraco** | `Nested Content` | ⚠️ Complex | Can be modeled as a Block List or stored as a JSON string. |

### Geopoint (Geographic Coordinates)

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Location | Object with `lat`, `lon` (numbers) |
| Contentstack | JSON | Custom JSON object |
| Optimizely | String | Via custom property or JSON object |
| Sanity | geopoint | Object with `lat`, `lng`, optional `alt` |
| Sitecore | Coordinate | Field type: "Coordinate" |
| Storyblok | String | Via custom plugin or JSON object |
| Umbraco | String | Via community package or JSON object |

#### Unified Schema Structure for Geopoint

```json
{
  "type": "geopoint",
  "title": "Location",
  "description": "Geographic coordinates for mapping",
  "validation": {
    "required": false
  }
}
```

**Adapter Implementation:**
- **Contentful**: Maps to `Location` field type
- **Sanity**: Maps to `geopoint` schema type
- **Storyblok**: Creates JSON object with `lat`/`lng` or uses custom plugin
- **Umbraco**: Creates JSON string or uses community package
- **Sitecore**: Maps to `Coordinate` field type
- **Others**: JSON object with structure `{ "lat": number, "lng": number, "alt"?: number }`

### Slug (URL-Safe Identifiers)

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Symbol | With regex validation `^[a-z0-9-]+$` and unique constraint |
| Contentstack | Text | With unique validation |
| Optimizely | String | With regex validation |
| Sanity | slug | Native type with auto-generation from source field |
| Sitecore | Single-Line Text | With regex validation |
| Storyblok | Text | With regex validation |
| Umbraco | Textstring | With regex validation |

#### Unified Schema Structure for Slug

```json
{
  "type": "slug",
  "title": "URL Slug",
  "description": "URL-friendly identifier",
  "validation": {
    "required": true,
    "unique": true,
    "pattern": "^[a-z0-9-]+$"
  },
  "options": {
    "source": "title"
  }
}
```

**Adapter Implementation:**
- **Contentful**: Symbol with validation (regex + unique)
- **Sanity**: Native `slug` type with `source` option
- **Storyblok**: Text field with regex validation
- **Umbraco**: Textstring with validation
- **Others**: String/text with regex pattern validation

**Note:** Only Sanity supports automatic slug generation from a source field. Other platforms require manual entry or custom code.

### Color (Color Picker)

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Symbol | With regex validation for hex colors |
| Contentstack | Text | With validation |
| Optimizely | String | With validation |
| Sanity | String | With custom color input component |
| Sitecore | Droplist | Predefined color options |
| Storyblok | Custom | Via color picker plugin |
| Umbraco | Color Picker | Property editor: "Umbraco.ColorPicker" |

#### Unified Schema Structure for Color

**Free-form picker** (no presets — any color value):
```json
{
  "type": "color",
  "title": "Accent Color",
  "description": "Free-form color picker",
  "validation": {
    "pattern": "^#[0-9A-Fa-f]{6}$"
  },
  "options": {
    "format": "hex"
  }
}
```

**Palette picker with plain presets** (hex swatches, no labels):
```json
{
  "type": "color",
  "title": "Brand Color",
  "options": {
    "format": "hex",
    "presets": ["#FF0000", "#00FF00", "#0000FF"]
  }
}
```

**Palette picker with labeled presets** (hex swatches + semantic labels):
```json
{
  "type": "color",
  "title": "Brand Color",
  "options": {
    "format": "hex",
    "presets": [
      { "value": "#ecaba4", "label": "bg-coral" },
      { "value": "#583459", "label": "bg-purple" },
      { "value": "#09bc8a", "label": "bg-green" }
    ]
  }
}
```

When labeled presets are used, adapters store the **label** as the field value (e.g., `bg-coral`). This is useful when labels represent CSS utility classes or design tokens.

#### Adapter Behavior by Preset Mode

| Presets | Behavior | Adapter mapping |
|---------|----------|-----------------|
| **None** (free-form) | Any color value allowed | Umbraco → Eye Dropper; Sanity → `@sanity/color-input` plugin; Storyblok → color picker plugin; Contentful/ContentStack → text + regex |
| **Plain strings** | Palette of hex values, no labels | Umbraco → Color Picker (labels OFF); others → select/dropdown with hex values |
| **Objects with `{value, label}`** | Labeled palette | Umbraco → Color Picker (labels ON); others → select/dropdown showing labels |

**Adapter Implementation:**
- **Umbraco**: Color Picker (with or without labels) or Eye Dropper for free-form
- **Contentful**: Symbol with hex regex validation; labeled presets map to predefined values
- **Sanity**: String with custom color picker component or `@sanity/color-input` plugin
- **Storyblok**: Color picker plugin for free-form; select for presets
- **Others**: String/text with hex validation

**Format Options:**
- `hex` - Hexadecimal (default): `#RRGGBB`
- `rgb` - RGB format: `rgb(255, 255, 255)`
- `rgba` - RGBA with alpha: `rgba(255, 255, 255, 0.5)`

### Tags (Tag Collections)

| CMS | Type Name | Notes |
|-----|-----------|-------|
| Contentful | Array | Array of Symbol (strings) |
| Contentstack | Text | Multi-line with comma separation |
| Optimizely | String | Comma-separated string |
| Sanity | Array | Array of string with tag input |
| Sitecore | Multilist | Array of references |
| Storyblok | Options | Multi-select or array of strings |
| Umbraco | Tags | Property editor: "Umbraco.Tags" |

#### Unified Schema Structure for Tags

```json
{
  "type": "tags",
  "title": "Tags",
  "description": "Keywords for categorization and search",
  "validation": {
    "required": false,
    "maxItems": 10
  },
  "options": {
    "autocomplete": true,
    "allowCustom": true,
    "suggestions": ["technology", "design", "development"]
  }
}
```

**Adapter Implementation:**
- **Contentful**: Array of Symbol
- **Sanity**: Array of string with tag input component
- **Storyblok**: Options field (multiselect) or array
- **Umbraco**: Native Tags property editor
- **Optimizely**: Comma-separated string
- **Contentstack**: Multi-line text with comma separation
- **Sitecore**: Multilist for predefined tags

**Storage Formats:**
- **Array**: `["tag1", "tag2", "tag3"]` (Contentful, Sanity, Storyblok, Umbraco)
- **Comma-separated**: `"tag1,tag2,tag3"` (Optimizely, Contentstack)
- **Reference array**: List of tag item IDs (Sitecore)

## Implementation & Adapters

### Adapter Architecture

Each CMS has a dedicated adapter that:
1. **Parses** unified schemas from JSON
2. **Validates** schemas against the meta-schema
3. **Maps** unified types to CMS-specific implementations
4. **Creates** content types, data types, and validation rules
5. **Syncs** schema changes to the CMS

### Current Adapters

| CMS | Language | Location | Status |
|-----|----------|----------|--------|
| Contentful | JavaScript | `src/adapters/contentful.js` | ✅ Complete |
| ContentStack | JavaScript | `src/adapters/contentstack.js` | ✅ Complete |
| Sanity | JavaScript | `src/adapters/sanity.js` | ✅ Complete |
| Storyblok | JavaScript | `src/adapters/storyblok.js` | ✅ Complete |
| Umbraco | C# | `src/umbraco/SchemaImport/UnifiedSchemaImporter.cs` | ✅ Complete |

### Sync Scripts

Automated sync scripts handle the deployment process:

```bash
# Sync all schemas
npm run sync:contentful
npm run sync:sanity
npm run sync:storyblok
npm run sync:umbraco
npm run sync:contentstack

# Sync single schema
npm run sync:storyblok -- --file="models/page.schema.json"
npm run sync:contentstack -- --file="models/page.schema.json"
```

### Validation

All schemas are validated against the unified meta-schema:

```bash
npm run validate
```

## Best Practices & Guidelines

### Schema Design
- Use lowercase identifiers with hyphens (e.g., `blog-post`)
- Include descriptive titles and descriptions
- Define required fields explicitly
- Use consistent naming conventions

### Field Types
- Prefer `string` for simple text inputs
- Use `text` for multi-line content without formatting
- Choose `richtext` for formatted content
- Use `select` for predefined choices
- Leverage `reference` for content relationships

### Content Organization
- Define content hierarchies with `allowedChildContentTypes`
- Use `structure.folder` for logical grouping
- Set `allowedAsRoot` appropriately for page types

### Migration Considerations
- Start with simple content types
- Test thoroughly in development environments
- Plan content migration strategies
- Validate data integrity after migration

### Performance
- Limit array depths for complex structures
- Use references instead of embedding large content
- Consider CMS-specific limitations
- Monitor sync performance for large schemas

## CMS-Specific Field Types Not Covered

The Unified Content Model focuses on **core field types** that work across all supported CMS platforms. However, each CMS offers additional specialized field types that don't have unified equivalents. This section documents these platform-specific types for reference.

### Why These Types Are Not in the Unified Model

These field types are excluded from the unified model because:
- ❌ **Not widely supported** - Only available in one or a few CMS platforms
- ❌ **Platform-specific implementation** - No clear mapping to other CMS platforms
- ❌ **Special use cases** - Niche requirements that don't apply to general content modeling
- ⚠️ **Can be modeled differently** - Often achievable using unified types with validation

### Mapping Strategy

When you need these specialized types:
1. **Use closest unified type** - Map to the nearest unified equivalent
2. **Add validation rules** - Use `validation` property for constraints
3. **Document in metadata** - Note the original CMS type for reference
4. **Consider custom adapters** - Extend adapters for specialized handling

---

### Location / Geopoint (Geographic Coordinates)

Stores latitude/longitude pairs for mapping and location-based features.

| CMS | Type Name | Implementation | Status |
|-----|-----------|----------------|--------|
| **Contentful** | `Location` | Object with `lat`, `lon` (numbers) | ✅ Native |
| **Contentstack** | Not available | Use JSON object | ❌ Manual |
| **Optimizely** | Custom | Via extension | ⚠️ Extension |
| **Sanity** | `geopoint` | Object with `lat`, `lng`, optional `alt` | ✅ Native |
| **Sitecore** | Coordinate | Map field type | ✅ Native |
| **Storyblok** | Custom Plugin | Via Field Plugin (not built-in) | ⚠️ Plugin |
| **Umbraco** | Custom Property | Via community packages | ⚠️ Package |

**Unified Model Workaround:**
```json
{
  "location": {
    "type": "object",
    "title": "Location",
    "description": "Geographic coordinates",
    "properties": {
      "lat": { "type": "number", "title": "Latitude" },
      "lng": { "type": "number", "title": "Longitude" }
    }
  }
}
```

**Recommendation:** Consider adding `geopoint` as a unified type in future versions.

---

### Slug (URL-Safe Identifiers)

Generates or validates URL-friendly identifiers (lowercase, hyphens, no spaces).

| CMS | Type Name | Auto-generation | Status |
|-----|-----------|-----------------|--------|
| **Contentful** | `Symbol` | With validation | ⚠️ Manual |
| **Contentstack** | `text` | Unique validation | ⚠️ Manual |
| **Optimizely** | `String` | With validation | ⚠️ Manual |
| **Sanity** | `slug` | From source field | ✅ Native |
| **Sitecore** | `Single-Line Text` | With validation | ⚠️ Manual |
| **Storyblok** | `text` | With regex validation | ⚠️ Manual |
| **Umbraco** | `Textstring` | With validation | ⚠️ Manual |

**Unified Model Workaround:**
```json
{
  "slug": {
    "type": "string",
    "title": "URL Slug",
    "validation": {
      "required": true,
      "pattern": "^[a-z0-9-]+$",
      "unique": true
    },
    "options": {
      "source": "title"  // Hint for auto-generation
    }
  }
}
```

**Note:** Only Sanity has native auto-generation from source fields. Other CMS platforms require manual slug entry or custom validation.

---

### Color (Color Picker)

Stores color values (hex, RGB, HSL). Now a first-class unified type (`color`) with support for free-form pickers and labeled preset palettes.

| CMS | Type Name | Free-form | Preset palette | Status |
|-----|-----------|-----------|----------------|--------|
| **Contentful** | `Symbol` | Text + regex | Predefined values | ⚠️ Manual |
| **Contentstack** | `text` | Text + regex | Select | ⚠️ Manual |
| **Optimizely** | `String` | Text + validation | Dropdown | ⚠️ Manual |
| **Sanity** | `string` | `@sanity/color-input` plugin | `options.list` | ⚠️ Plugin |
| **Sitecore** | `Droplist` | Text + validation | Predefined colors | ⚠️ Limited |
| **Storyblok** | `custom` (Color Picker plugin) | Native plugin | Select | ⚠️ Plugin |
| **Umbraco** | `Color Picker` / `Eye Dropper` | Eye Dropper | Color Picker (with/without labels) | ✅ Native |

**Unified Model:** Use the `color` type directly. See the [Color section above](#color-color-picker) for schema examples with free-form, plain presets, and labeled presets.

---

### Tags (Tag Collections)

Comma-separated or array-based tags for categorization and filtering.

| CMS | Type Name | Format | Status |
|-----|-----------|--------|--------|
| **Contentful** | `Array` of `Symbol` | Array of strings | ✅ Native |
| **Contentstack** | `text` (multiline) | Comma-separated | ⚠️ Manual |
| **Optimizely** | `String` | Comma-separated | ⚠️ Manual |
| **Sanity** | `array` of `string` | Array of strings | ✅ Native |
| **Sitecore** | `Multilist` | Array of IDs | ⚠️ Different |
| **Storyblok** | `option` (multiselect) | Array of strings | ✅ Native |
| **Umbraco** | `Tags` | Comma-separated | ✅ Native |

**Unified Model Mapping:**
```json
{
  "tags": {
    "type": "array",
    "title": "Tags",
    "items": {
      "type": "string"
    },
    "validation": {
      "maxItems": 10
    }
  }
}
```

**Note:** Unified type `tags` maps to native tags in Umbraco, arrays in Contentful/Sanity, and multiselect in Storyblok.

---

### Table (Tabular Data)

Structured rows and columns for data tables.

| CMS | Type Name | Format | Status |
|-----|-----------|--------|--------|
| **Contentful** | Not available | Use array of objects | ❌ Manual |
| **Contentstack** | Not available | Use group | ❌ Manual |
| **Optimizely** | Not available | Use array | ❌ Manual |
| **Sanity** | `array` of `object` | Rows as objects | ⚠️ Manual |
| **Sitecore** | Not available | Use list | ❌ Manual |
| **Storyblok** | `table` | JSON rows/columns | ✅ Native |
| **Umbraco** | Grid Editors | Complex grid | ⚠️ Different |

**Unified Model Workaround:**
```json
{
  "pricing_table": {
    "type": "array",
    "title": "Pricing Table",
    "items": {
      "type": "object",
      "properties": {
        "plan": { "type": "string" },
        "price": { "type": "number" },
        "features": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

---

### Markdown (Markdown Text)

Raw markdown input (not converted to HTML/JSON).

| CMS | Type Name | Editor | Status |
|-----|-----------|--------|--------|
| **Contentful** | `Text` | Plain text | ⚠️ Manual |
| **Contentstack** | `text` (markdown: true) | Markdown editor | ✅ Native |
| **Optimizely** | `String` | Plain text | ⚠️ Manual |
| **Sanity** | `text` | Textarea | ⚠️ Manual |
| **Sitecore** | `Multi-Line Text` | Plain text | ⚠️ Manual |
| **Storyblok** | `markdown` | Markdown editor | ✅ Native |
| **Umbraco** | `Textarea` | Plain text | ⚠️ Manual |

**Unified Model Mapping:**
Use `type: "text"` with metadata hint:
```json
{
  "content": {
    "type": "text",
    "title": "Content",
    "options": {
      "format": "markdown"  // Hint for adapters
    }
  }
}
```

---

### Integer vs. Float (Number Precision)

Some CMS platforms distinguish between integers and floating-point numbers.

| CMS | Integer Type | Float Type | Status |
|-----|--------------|------------|--------|
| **Contentful** | `Integer` | `Number` | ✅ Distinct |
| **Contentstack** | `number` | `number` | ❌ Same |
| **Optimizely** | `PropertyNumber` | `PropertyNumber` | ❌ Same |
| **Sanity** | `number` | `number` | ❌ Same |
| **Sitecore** | `Integer` | `Number` | ✅ Distinct |
| **Storyblok** | `number` | `number` | ❌ Same |
| **Umbraco** | `Numeric` (Integer) | `Numeric` (Decimal) | ✅ Distinct |

**Unified Model:**
Currently uses `type: "number"` for all numeric values. Adapters can infer precision from validation rules:

```json
{
  "quantity": {
    "type": "number",
    "validation": {
      "minimum": 0,
      "maximum": 1000
      // No decimals implied = integer in Contentful
    }
  },
  "price": {
    "type": "number",
    "validation": {
      "minimum": 0.01,
      "maximum": 999999.99
      // Decimals implied = Number/Float in Contentful
    }
  }
}
```

---

### Multi-Link (Hybrid Link Types)

Links that can point to internal content, external URLs, assets, or emails.

| CMS | Type Name | Capabilities | Status |
|-----|-----------|--------------|--------|
| **Contentful** | `Link` | Entry or Asset | ⚠️ Limited |
| **Contentstack** | `link` | Internal/external | ✅ Native |
| **Optimizely** | `Url` | Any URL | ⚠️ Limited |
| **Sanity** | Custom object | Manual structure | ⚠️ Manual |
| **Sitecore** | `General Link` | All types | ✅ Native |
| **Storyblok** | `multilink` | Internal/external/asset/email | ✅ Native |
| **Umbraco** | `Multi URL Picker` | Internal/external/media | ✅ Native |

**Unified Model Workaround:**
```json
{
  "cta_link": {
    "type": "object",
    "title": "CTA Link",
    "properties": {
      "type": {
        "type": "select",
        "options": [
          { "value": "internal", "label": "Internal Page" },
          { "value": "external", "label": "External URL" },
          { "value": "asset", "label": "File/Asset" }
        ]
      },
      "internal_link": { "type": "reference" },
      "external_url": { "type": "url" },
      "asset": { "type": "media" },
      "label": { "type": "string" },
      "target": {
        "type": "select",
        "options": [
          { "value": "_self", "label": "Same Window" },
          { "value": "_blank", "label": "New Window" }
        ]
      }
    }
  }
}
```

---

## Summary: Type Coverage

### ✅ Fully Supported Unified Types
- `boolean` - All CMS platforms
- `string` - All CMS platforms
- `text` - All CMS platforms
- `number` - All CMS platforms
- `date` - All CMS platforms
- `datetime` - All CMS platforms
- `richtext` - All CMS platforms
- `media` - All CMS platforms
- `reference` - All CMS platforms
- `array` - All CMS platforms
- `select` - All CMS platforms
- `url` - All CMS platforms
- `object` - All CMS platforms

### ⚠️ Partially Supported (Platform-Specific)
- **geopoint** - Contentful, Sanity, Sitecore (native); others via JSON object
- **slug** - Sanity (native); others via validated string
- **color** - Umbraco (native); others via validated string
- **tags** - Umbraco, Contentful, Sanity (native); others via arrays
- **markdown** - Storyblok, Contentstack (native); others via text

### ❌ Not Supported (Manual Workarounds Required)
- **table** - Only Storyblok native; others via array of objects
- **multilink** - Storyblok, Umbraco, Sitecore, Contentstack (native); Contentful/Sanity via custom object
- **integer vs. float precision** - Contentful, Umbraco, Sitecore distinguish; others infer from validation

### 🔮 Future Considerations

Types that could be added to the unified model:
1. **geopoint** - Wide enough support (3/7 platforms native)
2. **slug** - Common use case, clear semantics
3. **color** - Standard UI pattern
4. **markdown** - Alternative to richtext for developer-friendly content

Types that should remain platform-specific:
1. **table** - Too complex, better as array of objects
2. **multilink** - Can be modeled as object with conditional fields
3. **custom/plugin types** - By definition, platform-specific