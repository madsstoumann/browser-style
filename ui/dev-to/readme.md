# DevTo Component

A web component to display articles from dev.to. Can show a list of articles from a specific author or display a single article. Supports themes, pagination, and internationalization.

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

## Attributes

- `article`: ID of a single article to display
- `author`: dev.to username to fetch articles from
- `theme`: Visual theme (see below)
- `itemsperpage`: Number of articles per page (default: 30)
- `lang`: Language code for dates and translations (default: "en")
- `i18n`: JSON string with translations
- `links`: Set to "external" to open articles in new tab, "internal" for in-component viewing
- `noshadow`: Remove shadow DOM if needed

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

## Styling
The component uses CSS custom properties for fonts and colors. Style parts are exposed through `::part()`:
- `part="avatar"`: Author profile image
- `part="cover"`: Article cover image
- `part="list"`: Article list container
- `part="more"`: Load more button

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

