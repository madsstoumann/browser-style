# Web Config Taxonomy - Contentful App

A Contentful app for selecting product categories from Google or Meta/Facebook taxonomies.

## Features

- Search Google Product Taxonomy (~5,600 categories)
- Search Meta/Facebook Product Taxonomy
- Fuzzy search with typo tolerance
- Per-field configuration via instance parameters

## Setup Instructions

### 1. Create the App in Contentful

1. Go to your Contentful organization settings
2. Navigate to **Apps** → **Manage apps** → **Create app**
3. Fill in the app details:
   - **App name**: `Web Config Taxonomy`
   - **App URL**: `https://browser.style/ui/cms/contentful/web-config-taxonomy/`

### 2. Configure Instance Parameters

In the app definition, add instance parameters to allow per-field configuration:

```json
{
  "parameters": {
    "instance": [
      {
        "id": "taxonomyType",
        "name": "Taxonomy Type",
        "description": "Select which product taxonomy to use",
        "type": "Enum",
        "required": true,
        "default": "google",
        "options": [
          { "value": "google", "label": "Google Product Taxonomy" },
          { "value": "facebook", "label": "Meta/Facebook Taxonomy" },
          { "value": "google-fuzzy", "label": "Google (Fuzzy Search)" }
        ]
      },
      {
        "id": "label",
        "name": "Custom Label",
        "description": "Optional custom label for the input field",
        "type": "ShortText",
        "required": false
      }
    ]
  }
}
```

### 3. Configure App Locations

Enable the **Entry field** location:

1. Under **Locations**, check **Entry field**
2. Select **JSON object** as the supported field type
3. Save the configuration

### 4. Install to Space

1. Go to the **Install** tab
2. Select the space(s) where you want to use this app
3. Click **Install to selected spaces**

### 5. Add to Content Model

1. In your Contentful space, go to **Content model**
2. Select or create a content type (e.g., "Product")
3. Click **Add field** → **JSON object**
4. Configure the field:
   - **Name**: e.g., "Product Category"
   - **Field ID**: e.g., `productCategory`
5. In the **Appearance** tab:
   - Select "Web Config Taxonomy"
   - **Choose the taxonomy type** (Google, Facebook, or Google Fuzzy)
6. Save the content type

## Field Configuration Per-Use

The key benefit of instance parameters is that you can configure different taxonomy types for different fields, all using the same app:

| Field | Taxonomy Type | Use Case |
|-------|---------------|----------|
| `googleCategory` | Google | Google Shopping feeds |
| `facebookCategory` | Facebook | Meta Commerce feeds |
| `searchCategory` | Google Fuzzy | User-facing category search |

## Data Format

The app stores the selected taxonomy item as a JSON object:

```json
{
  "id": "3237",
  "name": "Live Animals",
  "path": "Animals & Pet Supplies > Live Animals",
  "categories": ["Animals & Pet Supplies", "Live Animals"]
}
```

### Using the Data

In your frontend, you can use the stored data directly:

```javascript
// For Google Shopping feeds
const googleCategoryId = entry.fields.productCategory.id;

// For display
const categoryPath = entry.fields.productCategory.path;
const categoryName = entry.fields.productCategory.name;

// For breadcrumbs
const breadcrumbs = entry.fields.productCategory.categories;
```

## Taxonomy Types

### Google Product Taxonomy
- ~5,600 categories
- Used for Google Shopping, Google Merchant Center
- Format: `Animals & Pet Supplies > Live Animals`
- [Official taxonomy file](https://www.google.com/basepages/producttype/taxonomy.en-US.txt)

### Meta/Facebook Product Taxonomy
- Used for Facebook/Instagram Commerce
- Format: Similar hierarchical structure
- [Official taxonomy file](https://www.facebook.com/products/categories/en_US.txt)

### Google Fuzzy Search
- Same data as Google taxonomy
- Tolerates typos and spelling mistakes
- Better for user-facing category selection
- Ranks results by relevance

## Troubleshooting

### App doesn't load
1. Check the URL is correct: `https://browser.style/ui/cms/contentful/web-config-taxonomy/`
2. Verify field type is **JSON object**
3. Check browser console for errors

### Categories not loading
1. Ensure the app has network access
2. Check browser console for fetch errors
3. Verify taxonomy files are accessible

### Instance parameters not showing
1. Ensure parameters are defined in app configuration
2. Re-save the app definition
3. Try removing and re-adding the app to the field

## Related

- [Web Config Taxonomy Component](https://browser.style/ui/web-config-taxonomy/) - The underlying web component
- [Auto-Suggest Component](https://browser.style/ui/auto-suggest/) - The search component used internally
- [Contentful Apps Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/)
