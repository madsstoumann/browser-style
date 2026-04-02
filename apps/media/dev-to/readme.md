# DevTo Component

A web component to display articles from dev.to. Can show a list of articles from a specific author or display a single article. Supports themes, pagination, internationalization, and local data sources.

## Installation

```bash
npm install @browser.style/dev-to
```

## Basic Usage

```javascript
import '@browser.style/dev-to';
```

### Display Author's Articles
```html
<dev-to author="madsstoumann"></dev-to>
```

### Display Single Article
```html
<dev-to article="123456"></dev-to>
```

### Use Local Data Source
```html
<dev-to author="madsstoumann" baseurl="./data"></dev-to>
```

### With Header Slots
```html
<dev-to author="madsstoumann">
  <h1 slot="headline">My Blog</h1>
  <p slot="description">Articles about web development.</p>
</dev-to>
```

## Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `article` | ID of a single article to display | - |
| `author` | dev.to username to fetch articles from | - |
| `baseurl` | Base URL for local JSON data (uses `articles.json` and `articles/{id}.json`) | - |
| `theme` | Visual theme (`brutalist`, `classic`, `modern`) | - |
| `itemsperpage` | Number of articles per page | `30` |
| `lang` | Language code for dates and translations | `en` |
| `i18n` | JSON string with translations | - |
| `links` | Set to `external` to open articles on dev.to | `internal` |
| `noshadow` | Remove shadow DOM if present | - |

## URL Parameters

The component supports URL parameters for deep linking and state preservation:

- `?article=ID` - Load a specific article directly
- `?page=X` - Load the list view with pages 1 through X

When navigating between list and article views, the URL updates automatically. Refreshing the page restores the correct view and pagination state.

## Themes
The component includes these themes:
- `brutalist`: A rugged, industrial look
- `classic`: Traditional article layout with drop caps and serif fonts
- `modern`: Swiss, modern article layout

```html
<dev-to author="madsstoumann" theme="classic"></dev-to>
```

## Internationalization
Customize text strings using the `i18n` attribute:

```html
<dev-to 
  author="madsstoumann"
  lang="da"
  i18n='{"da":{"more":"Flere...","reactions":"reaktioner"}}'
></dev-to>
```

## Slots

The component supports named slots for customizing the list header:

- `slot="headline"` - Main heading above the article list
- `slot="description"` - Subheading or description text

## Styling

The component uses CSS custom properties for fonts and colors. Style parts are exposed through `::part()`:

| Part | Description |
|------|-------------|
| `avatar` | Author profile image (article view) |
| `cover` | Article cover image (article view) |
| `list` | Article list container |
| `list-header` | Header containing slots |
| `more` | Load more button |

## Examples

### Basic List with Custom Items Per Page
```html
<dev-to
  author="madsstoumann"
  theme="classic"
  itemsperpage="10"
></dev-to>
```

### Single Article View
```html
<dev-to
  article="123456"
  theme="classic"
></dev-to>
```

### Static Blog with Local Data
```html
<dev-to
  author="madsstoumann"
  baseurl="./data"
  theme="classic"
  itemsperpage="10">
  <h1 slot="headline">My Blog</h1>
  <p slot="description">Articles about CSS, JavaScript, and web development.</p>
</dev-to>
```

When using `baseurl`, the component expects:
- `{baseurl}/articles.json` - Array of article metadata for the list view
- `{baseurl}/articles/{id}.json` - Full article content for each article

### Deep Linking
Link directly to an article or paginated list:
```
https://example.com/?article=123456
https://example.com/?page=3
```

