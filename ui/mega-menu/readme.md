# Mega Menu Component

A responsive, accessible mega menu component with keyboard navigation, scroll detection, and mobile support. This component follows the [ARIA Authoring Practices Guide for Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) and provides a complete navigation solution for modern web applications.

## Features

- 📱 **Responsive Design**: Adapts to mobile with slide-in navigation
- ♿ **Accessibility**: Full keyboard navigation and ARIA compliance
- 🔄 **Scroll Detection**: Optional auto-hide/show based on scroll direction
- 🎨 **Customizable**: CSS custom properties for extensive styling control
- 🚀 **Progressive Enhancement**: Works without JavaScript, enhanced with it

## Quick Start

### Basic HTML Structure

```html
<mega-menu>
  <a href="#main" data-menu="skip">Skip to main content</a>
  
  <header data-menu="menubar">
    <a href="/">BRAND</a>
    
    <label aria-label="Open menu" data-menu="trigger">
      <input type="checkbox">
      ☰
    </label>

    <div data-menu="view">
      <nav aria-label="Main navigation" data-menu="nav">
        <details data-menu="topic" name="main-menu">
          <summary>Products</summary>
          <div data-menu="content">
            <!-- Menu content here -->
          </div>
        </details>
      </nav>
    </div>
  </header>
</mega-menu>
```

### Required Files

Include these CSS files in your HTML:

```html
<link rel="stylesheet" href="index.css">      <!-- Core styles -->
<link rel="stylesheet" href="scroll.css">     <!-- Optional: scroll detection -->
```

Add JavaScript for accessibility enhancement:

```html
<script type="module">
  import setupMegaMenu from './index.js';
  setupMegaMenu(
    document.querySelector('mega-menu'),
    'nav[data-menu="nav"] > details[data-menu="topic"]',
    '[data-menu="content"]',
    'a[href]:not([disabled]), button:not([disabled]), input:not([disabled])'
  );
</script>
```

## HTML Elements Reference

### Core Container

#### `<mega-menu>`
The root container element that wraps the entire menu system.

**Attributes:**
- `bleed` - Extends the menu to full viewport width while maintaining content constraints

```html
<mega-menu bleed>
  <!-- All menu content -->
</mega-menu>
```

### Accessibility

#### `data-menu="skip"`
Skip link for keyboard users to bypass navigation and go directly to main content.

```html
<a href="#main" data-menu="skip">Skip to main content</a>
```

### Menu Structure

#### `data-menu="menubar"`
Main container that holds the brand, mobile trigger, and navigation elements.

```html
<header data-menu="menubar">
  <!-- Brand, trigger, and navigation -->
</header>
```

#### `data-menu="trigger"`
Mobile menu toggle button with hidden checkbox for state management.

```html
<label aria-label="Open menu" data-menu="trigger">
  <input type="checkbox">
  ☰
</label>
```

#### `data-menu="view"`
Viewport container that slides in on mobile and contains navigation on desktop.

```html
<div data-menu="view">
  <!-- Navigation content -->
</div>
```

#### `data-menu="nav"`
Navigation container that flexes horizontally on desktop.

```html
<nav aria-label="Main navigation" data-menu="nav">
  <!-- Menu topics -->
</nav>
```

### Menu Content

#### `data-menu="topic"`
Top-level menu items that contain dropdown content. Uses `<details>` for progressive enhancement.

```html
<details data-menu="topic" name="main-menu">
  <summary>Products</summary>
  <div data-menu="content">
    <!-- Dropdown content -->
  </div>
</details>
```

**Important:** All topics should share the same `name` attribute to ensure only one can be open at a time.

#### `data-menu="content"`
Dropdown content area that appears below menu items on desktop.

```html
<div data-menu="content">
  <!-- Links, sections, or other content -->
</div>
```

#### `data-menu="section"`
Sub-sections within dropdown content that can be nested for organized menu structures.

```html
<details data-menu="section">
  <summary>Smartphones</summary>
  <div role="group">
    <a href="/products/smartphones/iphone">iPhone</a>
    <a href="/products/smartphones/android">Android</a>
    <a href="/products/smartphones/pixel">Google Pixel</a>
  </div>
</details>
```

## Complete Example

```html
<mega-menu bleed>
  <a href="#main" data-menu="skip">Skip to main content</a>
  
  <header data-menu="menubar">
    <a href="/">BRAND</a>
    
    <label aria-label="Open menu" data-menu="trigger">
      <input type="checkbox">
      ☰
    </label>

    <div data-menu="view">
      <nav aria-label="Main navigation" data-menu="nav">
        <!-- Products menu with nested sections -->
        <details data-menu="topic" name="main-menu">
          <summary>Products</summary>
          <div data-menu="content">
            <details data-menu="section">
              <summary>Smartphones</summary>
              <div role="group">
                <a href="/products/smartphones/iphone">iPhone</a>
                <a href="/products/smartphones/android">Android</a>
                <a href="/products/smartphones/pixel">Google Pixel</a>
              </div>
            </details>
            
            <details data-menu="section">
              <summary>Laptops</summary>
              <div role="group">
                <a href="/products/laptops/macbook">MacBook</a>
                <a href="/products/laptops/surface">Surface</a>
                <a href="/products/laptops/thinkpad">ThinkPad</a>
              </div>
            </details>
          </div>
        </details>

        <!-- Simple menu without sections -->
        <details data-menu="topic" name="main-menu">
          <summary>About</summary>
          <div data-menu="content">
            <a href="/about/company">Company</a>
            <a href="/about/careers">Careers</a>
            <a href="/about/news">News</a>
            <a href="/about/contact">Contact</a>
          </div>
        </details>

        <!-- Search functionality -->
        <details data-menu="topic" name="main-menu">
          <summary>Search</summary>
          <search data-menu="content">
            <input type="text" placeholder="Search..." role="searchbox">
            <button type="submit">Search</button>
          </search>
        </details>
      </nav>
    </div>
  </header>
</mega-menu>
```

## CSS Customization

The mega menu supports extensive customization through CSS custom properties that can be set via HTML attributes using CSS `attr()` function.

### Available Attributes

#### Layout & Spacing
- `margin-inline` - Horizontal margin for the menu container
- `max-width` - Maximum width constraint for the menu content
- `menubar-height` - Height of the main menu bar (default: `3rem`)

#### Mobile Behavior
- `mobile-view-width` - Width of the mobile slide-in menu (default: `60vw`)
- `mobile-view-entry` - Set to `"right"` to make mobile menu slide in from the right

#### Z-Index
- `z-index` - Stack order for the menu (default: `1000`)

#### Content Styling
- Custom properties for padding, colors, and other visual aspects

### Usage Examples

```html
<!-- Custom menu bar height and mobile width -->
<mega-menu 
  menubar-height="4rem" 
  mobile-view-width="75vw"
  max-width="1200px">
  <!-- menu content -->
</mega-menu>

<!-- Mobile menu slides in from right -->
<mega-menu mobile-view-entry="right">
  <!-- menu content -->
</mega-menu>

<!-- Full-width menu with custom margins -->
<mega-menu 
  bleed 
  margin-inline="2rem" 
  max-width="1400px">
  <!-- menu content -->
</mega-menu>
```

### CSS Custom Properties

You can also override these properties directly in CSS:

```css
mega-menu {
  --mega-menu-menubar-height: 4rem;
  --mega-menu-view-width: 75vw;
  --mega-menu-max-width: 1200px;
  --mega-menu-margin-inline: 2rem;
  --mega-menu-z-index: 2000;
}
```

## Scroll Detection (Optional)

The `scroll.css` module provides automatic hiding/showing of the menu based on scroll direction. This creates a more immersive browsing experience by maximizing content visibility.

### How It Works

The scroll detection uses CSS custom properties and container queries to track scroll direction:

- **Scrolling Down**: Menu slides up and hides
- **Scrolling Up**: Menu slides down and becomes visible
- **At Top**: Menu remains visible

### Usage

Simply include the scroll CSS file:

```html
<link rel="stylesheet" href="scroll.css">
```

### Customization

Control the animation timing:

```css
:root {
  --header-effect-duration: 0.5s; /* Default: 0.3s */
}
```

## JavaScript Enhancement

The `index.js` module adds comprehensive keyboard navigation and accessibility features following the ARIA Authoring Practices Guide for Menubar.

### Features Added

#### Keyboard Navigation
- **Arrow Keys**: Navigate between menu items and within dropdowns
- **Enter/Space**: Open/close menu items
- **Escape**: Close current menu and return focus
- **Tab**: Standard tab navigation with proper menu closure
- **Home/End**: Jump to first/last item in current context

#### Type-to-Search
- Type any letter to jump to menu items starting with that character
- Repeated typing cycles through matching items

#### Focus Management
- Proper focus trapping within open menus
- Automatic focus restoration when menus close
- Visual focus indicators

#### Auto-Close Behavior
- Only one top-level menu can be open at a time
- Clicking outside closes open menus
- Tab key closes menus and continues navigation

### Setup

```javascript
import setupMegaMenu from './index.js';

document.addEventListener('DOMContentLoaded', () => {
  setupMegaMenu(
    document.querySelector('mega-menu'),          // Container element
    'nav[data-menu="nav"] > details[data-menu="topic"]', // Topic selector
    '[data-menu="content"]',                      // Content panel selector
    'a[href]:not([disabled]), button:not([disabled])' // Focusable elements
  );
});
```

### Parameters

1. **container**: The mega-menu element
2. **groupSelector**: CSS selector for menu topic containers (details elements)
3. **panelSelector**: CSS selector for dropdown content areas
4. **focusSelector**: CSS selector for focusable elements within menus

## Browser Support

- **Modern Browsers**: Full support with all features
- **Older Browsers**: Progressive enhancement ensures basic functionality
- **No JavaScript**: Menu works as standard details/summary disclosure widgets

## Accessibility Features

- ✅ **ARIA Compliance**: Follows WAI-ARIA authoring practices
- ✅ **Keyboard Navigation**: Full keyboard operability
- ✅ **Screen Reader Support**: Proper labeling and structure
- ✅ **Focus Management**: Logical focus flow and trapping
- ✅ **Skip Links**: Quick navigation for assistive technology users
- ✅ **Semantic HTML**: Uses appropriate HTML elements

## Best Practices

1. **Always include skip links** for accessibility
2. **Use the same `name` attribute** for all topic details elements
3. **Provide meaningful labels** for navigation elements
4. **Test keyboard navigation** thoroughly
5. **Consider content organization** in your menu structure
6. **Use semantic HTML** for menu content (links, buttons, etc.)

## Troubleshooting

### Menu doesn't close on mobile
- Ensure the checkbox input is inside the trigger label
- Check that the `name` attribute is consistent across topic elements

### Keyboard navigation not working
- Verify the JavaScript is loaded and initialized
- Check the selectors passed to `setupMegaMenu()`
- Ensure focusable elements match the focus selector

### Styling issues
- Verify all required CSS files are included
- Check for CSS conflicts with existing styles
- Use browser developer tools to inspect CSS custom properties