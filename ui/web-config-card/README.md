# Web Config Card Web Component

A visual web component for editing Content Card data models. Generates schema-driven forms for 25+ card types with support for nested objects, arrays, and form association.

## Features

- **Schema-Driven Forms**: Automatically generates form fields from JSON schemas
- **25+ Card Types**: Article, Product, Event, Recipe, Job, FAQ, and more
- **Nested Data Support**: Handle complex nested objects and arrays
- **Form Associated**: Works with native HTML forms via `ElementInternals`
- **Auto Type Locking**: When a card type is set, the type selector is locked
- **Dynamic Arrays**: Add/remove items with intuitive controls
- **Real-Time Preview**: See JSON output as you edit
- **Clean UI**: Matching design with other Web Config components

## Installation

```bash
npm install @browser.style/web-config-card
```

```html
<script type="module" src="https://unpkg.com/@browser.style/web-config-card/src/index.js"></script>
```

## Basic Usage

```html
<!-- Empty card (user selects type) -->
<web-config-card></web-config-card>

<!-- Pre-populated with data (type auto-locked) -->
<web-config-card value='{
  "type": "article",
  "article": {
    "authors": [
      { "name": "John Smith", "role": "Senior Editor" }
    ]
  }
}'></web-config-card>
```

## Attributes

### `value`

JSON string containing the card data. When the JSON includes a valid `type` property, the type selector is automatically locked.

```html
<web-config-card value='{
  "type": "product",
  "product": {
    "sku": "PROD-001234",
    "product": {
      "availability": "In Stock",
      "price": {
        "current": "299.00",
        "currency": "USD"
      }
    }
  }
}'></web-config-card>
```

## Supported Card Types

| Type | Description |
|------|-------------|
| `achievement` | Certifications, badges, awards |
| `announcement` | System announcements, notifications |
| `article` | Blog posts, articles with authors |
| `booking` | Service bookings, reservations |
| `business` | Business listings with contact info |
| `comparison` | Product/service comparisons |
| `contact` | Contact information cards |
| `course` | Educational courses |
| `event` | Events with dates and locations |
| `faq` | Question and answer pairs |
| `gallery` | Image galleries |
| `job` | Job postings |
| `location` | Places, venues, addresses |
| `membership` | Subscription plans |
| `news` | News articles |
| `poll` | Voting/survey options |
| `product` | E-commerce products |
| `profile` | User/person profiles |
| `quote` | Quotations with attribution |
| `recipe` | Cooking recipes |
| `review` | Product/service reviews |
| `social` | Social media posts |
| `software` | Software applications |
| `statistic` | Metrics and KPIs |
| `timeline` | Chronological events |

## Events

### `change` and `input`

Dispatched whenever the card data changes.

```javascript
const card = document.querySelector('web-config-card');

card.addEventListener('change', (event) => {
  console.log('Card data:', event.detail);
  // { type: 'article', article: { authors: [...] } }
});
```

## JavaScript API

### Properties

#### `value` (getter/setter)

Get or set the card data as a JSON string.

```javascript
const card = document.querySelector('web-config-card');

// Get current value
const json = card.value;

// Set new value
card.value = JSON.stringify({
  type: 'recipe',
  recipe: {
    content: { text: ['2 cups flour', '1 cup sugar'] },
    recipe: { prepTime: '15 minutes', cookTime: '30 minutes' }
  }
});
```

#### `lockType` (getter)

Returns `true` if the type selector is locked (read-only).

```javascript
console.log(card.lockType); // true if type is set
```

## Form Integration

The component is form-associated, meaning it works with native HTML forms:

```html
<form id="card-form">
  <web-config-card name="cardData"></web-config-card>
  <button type="submit">Save</button>
</form>

<script>
  document.getElementById('card-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    console.log('Card data:', formData.get('cardData'));
  });
</script>
```

## CMS Integration (Contentful)

When mounted in Contentful or similar CMS, the component:

1. Receives a blank value or JSON via the `value` attribute
2. If the JSON contains a valid `type`, the type selector is automatically locked
3. Users can only edit data for the locked type
4. Changes emit `change` and `input` events for the CMS to capture

```javascript
// Contentful App SDK example
import { init } from 'contentful-ui-extensions-sdk';

init((sdk) => {
  const card = document.querySelector('web-config-card');

  // Load existing value
  const value = sdk.field.getValue();
  if (value) {
    card.setAttribute('value', JSON.stringify(value));
  }

  // Save changes
  card.addEventListener('change', (e) => {
    sdk.field.setValue(e.detail);
  });
});
```

## Schema Structure

Each card type has a schema defining its fields:

```javascript
{
  article: {
    title: 'Article Details',
    properties: {
      authors: {
        type: 'array',
        title: 'Authors',
        itemTitle: 'Author',  // Displayed as "Author 1", "Author 2"
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name', placeholder: 'John Smith' },
            role: { type: 'string', title: 'Role', placeholder: 'Senior Editor' }
          }
        }
      }
    }
  }
}
```

### Supported Field Types

| Type | Renders As |
|------|------------|
| `string` | `<input type="text">` |
| `string` with `format: 'date'` | `<input type="date">` |
| `string` with `enum` | `<select>` |
| `number` | `<input type="number">` |
| `object` | Nested fieldset |
| `array` | Repeatable items with Add/Remove |

## Styling

The component uses CSS custom properties from `@browser.style/web-config-shared`:

```css
web-config-card {
  --web-config-accent: hsl(211, 100%, 95%);
  --web-config-buttonface: #efefef;
  --web-config-bdrs: 0.5rem;
  --web-config-gap: 1rem;
  --web-config-ff-mono: ui-monospace, monospace;
  --web-config-status-danger: hsl(0, 80%, 50%);
}
```

## Demo

Open [demo.html](./demo.html) to see the component in action with pre-populated examples for various card types.

## Browser Support

Modern browsers with support for:
- Web Components (Custom Elements v1)
- Shadow DOM
- ES Modules
- CSS Custom Properties
- ElementInternals

## Related Components

- [web-config-shared](../web-config-shared/) - Shared utilities and styles
- [content-card](../content-card/) - Component for rendering content cards
