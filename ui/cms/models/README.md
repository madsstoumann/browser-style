# Schema Examples

This folder contains example schemas demonstrating the Universal Data Model format.

## Example Schemas

- **[blog-post.schema.json](blog-post.schema.json)** - Complete blog post content type with all standard fields
- **[author.schema.json](author.schema.json)** - Author profile referenced by blog posts

## Schema Structure

All schemas follow the JSON Schema Draft 7 specification with Universal Data Model extensions:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "id": "content-type-id",
  "title": "Display Name",
  "description": "Description of this content type",
  "type": "object",
  "properties": {
    "fieldName": {
      "type": "universal-type",
      "title": "Field Label",
      "description": "Field description",
      "validation": { ... },
      "options": { ... }
    }
  },
  "required": ["field1", "field2"],
  "metadata": { ... }
}
```

## Field Structure

Each field in `properties` contains:

- **type** - Universal type (string, text, number, boolean, date, datetime, richtext, media, reference, array, select, url, slug, tags, color, geopoint)
- **title** - Human-readable label for the field
- **description** - Help text explaining the field's purpose
- **validation** - Validation rules
  - `required` - Whether the field is mandatory
  - `pattern` - Regular expression for validation
  - `minLength` / `maxLength` - String length constraints
  - `minimum` / `maximum` - Number range constraints
- **options** - Type-specific configuration
- **default** - Default value for the field

## Universal Types Reference

### Core Types

| Type | Description | CMS Mapping |
|------|-------------|-------------|
| `string` | Single-line text | Symbol, Text (single), String |
| `text` | Multi-line text | Text, Textarea, Multi-line Text |
| `number` | Integer or decimal | Number, Integer, Numeric |
| `boolean` | True/false | Boolean, Checkbox, True/False |
| `date` | Date without time | Date, Date Picker |
| `datetime` | Date with time | DateTime, Date/Time |

### Structural Types

| Type | Description | CMS Mapping |
|------|-------------|-------------|
| `richtext` | Formatted content | RichText, XhtmlString, Rich Text Editor |
| `media` | File references | Link (Asset), Image, File, Media Picker |
| `reference` | Content references | Link (Entry), Reference, Content Picker |
| `array` | Lists of items | Array, Block List, ContentArea |
| `select` | Dropdown/checkboxes | Option/Options, Dropdown, SelectOne |
| `url` | Web addresses | Url, Link, Multilink |

### Special Types

| Type | Description | CMS Mapping |
|------|-------------|-------------|
| `slug` | URL-safe identifier | Slug (Sanity), Symbol with validation |
| `tags` | Tag collections | Tags, Array of strings |
| `color` | Color values | Color Picker, String with validation |
| `geopoint` | Geographic coordinates | Location, Geopoint |

## Validation Rules

Common validation properties:

```json
"validation": {
  "required": true,
  "minLength": 10,
  "maxLength": 100,
  "pattern": "^[a-z0-9-]+$",
  "minimum": 0,
  "maximum": 100
}
```

## Field Options

Type-specific configuration:

### String/Text Options
```json
"options": {
  "maxLength": 200
}
```

### Media Options
```json
"options": {
  "accept": ["image/jpeg", "image/png"],
  "maxSize": 5242880
}
```

### Reference Options
```json
"options": {
  "referenceType": "author",
  "multiple": false,
  "maxItems": 3
}
```

### Select Options
```json
"options": {
  "choices": [
    { "value": "draft", "label": "Draft" },
    { "value": "published", "label": "Published" }
  ],
  "multiple": false
}
```

### Array Options
```json
"options": {
  "minItems": 1,
  "maxItems": 10
}
```

### Slug Options
```json
"options": {
  "source": "title"
}
```

## Metadata

Content type metadata for CMS configuration:

```json
"metadata": {
  "icon": "📝",
  "displayField": "title",
  "previewUrl": "/blog/{slug}",
  "description": "Additional context"
}
```

## Using the Schemas

With the CLI tool:

```bash
# Create content types from schema
udm create blog-post.schema.json

# Update existing content type
udm update blog-post.schema.json

# Delete content type
udm delete blog-post

# Sync multiple schemas
udm sync *.schema.json
```

## Best Practices

1. **Use meaningful IDs** - The `id` field should match your filename (without .schema.json)
2. **Provide descriptions** - Help editors understand each field's purpose
3. **Set appropriate validation** - Balance user freedom with data quality
4. **Consider relationships** - Use references for related content
5. **Plan for localization** - Consider which fields need translation
6. **Use slug fields** - For URL-friendly identifiers
7. **Set required fields** - Only require truly essential fields
8. **Provide defaults** - Help editors with sensible default values
