# RichText Component - Internal Architecture

## Overview

`<rich-text>` is a web component that provides a WYSIWYG (What You See Is What You Get) rich text editor with customizable toolbar, command system, and form integration capabilities.

**Version:** 1.0.11 (index.js), 1.0.16 (package.json)

**Component Type:** Form-associated custom element extending FormElement

**Key Features:**
- Customizable toolbar with command grouping
- Plain text or HTML editing modes
- Form element integration with ElementInternals
- Custom command support
- HTML source code editing toggle
- Accessible skip-to-content navigation
- Input type filtering
- Content sanitization

**Key architectural decisions:**
- **FormElement inheritance**: Provides form association, lifecycle hooks, and utilities
- **Command system**: Extensible command objects with icons, handlers, and highlighting
- **Toolbar grouping**: Pipe-separated groups, comma-separated items within groups
- **ContentEditable**: Uses native contenteditable for WYSIWYG editing
- **execCommand API**: Leverages document.execCommand() for formatting

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  super() → FormElement initialization
  ↓
initializeComponent()               // Called by FormElement (line 23)
  ↓
  Bind commands with component context (lines 24-30)
  Generate unique content ID (line 32)
  Parse eventMode attribute (line 34)
  Parse inputTypes whitelist (line 35)
  Parse toolbar configuration (line 36)
  Check plaintext mode (line 37)
  Store initial content (line 39)
  ↓
  Initialize template and DOM (line 43)
  Cache element references (line 44)
  Add event listeners (line 45)
  ↓
connectedCallback()
  ↓
  Component ready for user interaction
  ↓
attributeChangedCallback(name, oldValue, newValue)
  ↓
  Update state as needed
  ↓
disconnectedCallback()
  ↓
  Cleanup
```

### Module System

**Two-file component structure:**

- **index.js** (206 lines) - RichText class and lifecycle
- **commands.js** (280 lines) - Command definitions and icons

**Import strategy:**
```javascript
import { FormElement } from '../common/form.element.js';
import { commands } from './commands.js';
```

## Data Flow Pipeline

### Content Flow

```
User Input (typing, paste, formatting)
  ↓
ContentEditable captures input
  ↓
beforeinput event  [index.js:51]
  ↓
  handleBeforeInput() filters by inputType (lines 89-93)
  ↓
input event  [index.js:53-59]
  ↓
  Get content based on plaintext mode
  Sanitize HTML if not plaintext (line 55)
  Update form value if form element (line 57)
  Dispatch 'rt:content' event with detail (line 58)
  ↓
OUTPUT: Updated DOM and dispatched events
```

### Command Flow

```
Toolbar Click
  ↓
handleToolbarClick(e)  [index.js:95-105]
  ↓
  Get clicked node (line 96)
  Find command by name attribute (line 97)
  ↓
  If command has custom fn:
    Execute fn(node) (lines 99-100)
  Else:
    document.execCommand(command.command) (line 102)
  ↓
  Update button highlight state (line 103)
```

### HTML Toggle Flow

```
HTML Button Click
  ↓
toggleHTML()  [index.js:187-203]
  ↓
  Toggle htmlcode textarea visibility (line 188)
  Toggle content contentEditable (line 189)
  Disable/enable toolbar buttons (lines 191-195)
  ↓
  If closing HTML editor:
    Copy htmlcode.value to content.innerHTML (line 198)
    Dispatch input event (line 199)
  If opening HTML editor:
    Copy content.innerHTML to htmlcode.value (line 201)
```

## Command System

### Command Object Structure

```javascript
{
  key: String,              // Unique identifier (toolbar key)
  command?: String,         // document.execCommand name
  icon?: String,            // SVG path(s) for button
  title?: String,           // Tooltip text
  fn?: Function,            // Custom handler (overrides execCommand)
  highlight?: Boolean,      // Should show active state
  inputType?: String,       // Input element type (color, etc.)
  options?: String,         // Select options pipe/semicolon separated
}
```

### Built-in Commands (commands.js)

**Text Formatting (with highlight):**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `b` | bold | 16-21 | Bold text |
| `i` | italic | 159-164 | Italic text |
| `u` | underline | 261-266 | Underlined text |
| `s` | strikethrough | 240-245 | Strikethrough |
| `sub` | subscript | 247-252 | Subscript |
| `sup` | superscript | 254-259 | Superscript |

**Lists (with highlight):**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `ol` | insertOrderedList | 145-150 | Numbered list |
| `ul` | insertUnorderedList | 152-157 | Bullet list |

**Headings:**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `h1`-`h6` | formatBlock | 83-117 | Heading levels |

**Formatting with Inputs:**

| Key | Command | Input Type | Line | Description |
|-----|---------|------------|------|-------------|
| `bgc` | backColor | color | 3-14 | Background color |
| `fc` | foreColor | color | 65-75 | Font color |
| `fn` | fontName | select | 53-57 | Font family |
| `fs` | fontSize | select | 59-63 | Font size |

**Alignment (with highlight):**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `left` | justifyLeft | 180-182 | Left align |
| `center` | justifyCenter | 183-185 | Center align |
| `right` | justifyRight | 186-188 | Right align |
| `justify` | justifyFull | 189-191 | Justify |

**Structure:**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `hr` | insertHorizontalRule | 130-134 | Horizontal rule |
| `blockquote` | formatBlock | 77-81 | Block quote |
| `indent` | indent | 124-128 | Increase indent |
| `outdent` | outdent | 194-198 | Decrease indent |

**Links & Media:**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `link` | createLink | 38-45 | Insert link (prompt) |
| `unlink` | unlink | 268-272 | Remove link |
| `img` | insertImage | 136-143 | Insert image (prompt) |

**Clipboard:**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `copy` | copy | 32-36 | Copy selection |
| `cut` | cut | 47-51 | Cut selection |
| `paste` | paste | 200-204 | Paste clipboard |

**History:**

| Key | Command | Line | Description |
|-----|---------|------|-------------|
| `undo` | undo | 274-278 | Undo last action |
| `redo` | redo | 206-210 | Redo last action |

**Special Commands:**

| Key | Purpose | Line | Description |
|-----|---------|------|-------------|
| `remove` | removeFormat | 212-216 | Clear formatting |
| `html` | Toggle | 119-122 | HTML source view |
| `clear` | Custom | 23-30 | Clear all content |
| `reset` | Custom | 218-225 | Reset to initial |
| `save` | Custom | 227-238 | Dispatch save event |

### Command Context Binding (lines 24-30)

```javascript
this.commands = commands.map(command => {
  if (command.fn) {
    const origFn = command.fn;
    command.fn = (...args) => origFn.apply(this, args);
  }
  return command;
});
```

**Why this matters:** Custom functions need access to the RichText instance (`this`) for methods like `resetContent()`, `setContent()`, etc.

## Event System

### Custom Events Dispatched

| Event | Detail | Trigger | Line |
|-------|--------|---------|------|
| `rt:content` | `{ content }` | On input | 58 |
| `rt:save` | `{ content }` | Save command | 231-235 (commands.js) |

### Custom Events Listened

| Event | Handler | Purpose | Line |
|-------|---------|---------|------|
| `rt:clear` | resetContent(true) | Clear all content | 49 |
| `rt:reset` | resetContent(false) | Reset to initial | 50 |

### DOM Event Handlers

| Event | Target | Handler | Purpose | Line |
|-------|--------|---------|---------|------|
| `beforeinput` | content | handleBeforeInput | Filter input types | 51 |
| `click` | content | highlightToolbar | Update toolbar state | 52 |
| `input` | content | Anonymous | Dispatch rt:content | 53-59 |
| `keydown` | content | highlightToolbar | Update on keypress | 60 |
| `click` | toggle | toggleHTML | Toggle HTML view | 61 |
| `click` | toolbar | handleToolbarClick | Handle commands | 62 |

## DOM Structure

### Shadow DOM Template (lines 176-185)

```html
<fieldset part="toolbar">
  <button type="button" part="skip" onclick="...">
    Skip to content
  </button>
  <!-- Rendered toolbar groups here -->
  <fieldset part="custom"></fieldset>
</fieldset>
<textarea name="htmlcode" hidden part="html"></textarea>
<div
  contenteditable="plaintext-only|true"
  style="outline:none;"
  part="content"
  id="{contentID}">
  {initialValue}
</div>
```

### CSS Parts for External Styling

| Part | Element | Purpose |
|------|---------|---------|
| `skip` | button | Skip-to-content button |
| `toolbar` | fieldset | Main toolbar container |
| `custom` | fieldset | Custom commands area |
| `html` | textarea | HTML source textarea |
| `content` | div | Contenteditable area |

### Element References (lines 65-72)

```javascript
this.content = root.querySelector('[contenteditable]');
this.customToolbar = root.querySelector('[part=custom]');
this.htmlcode = root.querySelector('[name=htmlcode]');
this.toggle = root.querySelector('[name=html]');
this.toolbar = root.querySelector('[part=toolbar]');
this.highlight = this.commands
  .filter(c => c.highlight)
  .map(c => c.command);
```

## Public API

### Properties

| Property | Type | Access | Purpose |
|----------|------|--------|---------|
| `value` | String | get/set | Current content (inherited) |
| `defaultValue` | String | get | Initial content (inherited) |
| `form` | HTMLFormElement | get | Associated form |
| `name` | String | get | Element name |
| `type` | String | get | Always "rich-text" |
| `isFormElement` | Boolean | get | Form association flag |
| `commands` | Array | get | Command objects |
| `content` | HTMLDivElement | get | Contenteditable element |
| `toolbar` | HTMLFieldSetElement | get | Toolbar element |
| `customToolbar` | HTMLFieldSetElement | get | Custom commands area |
| `htmlcode` | HTMLTextAreaElement | get | HTML source textarea |
| `plaintext` | Boolean | get | Plaintext mode flag |
| `initialValue` | String | get | Initial content |

### Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `addCustomCommand(cmd)` | Command object | void | Add toolbar command |
| `setContent(content, plaintextOnly)` | String, Boolean | void | Set editor content |
| `resetContent(clear)` | Boolean | void | Clear or reset content |
| `sanitizeHTML(html)` | String | String | Normalize HTML |
| `formReset()` | None | void | Form reset callback |
| `toggleHTML()` | None | void | Switch HTML/visual |

### addCustomCommand (lines 79-87)

```javascript
addCustomCommand(customCommand) {
  if (this.customToolbarItems.includes(customCommand.key)) {
    console.error(`RichText: Custom command "${customCommand.key}" already exists.`);
    return;
  }
  this.commands.push(customCommand);
  this.customToolbarItems.push(customCommand.key);
  this.customToolbar.innerHTML += this.renderToolbarItem(customCommand.key);
}
```

### setContent (lines 170-174)

```javascript
setContent(content, plaintextOnly = false) {
  const stripTags = (input) => input.replace(/<[^>]*>/g, '');
  this.setAttribute('plaintext', plaintextOnly);
  this.content[plaintextOnly ? 'textContent' : 'innerHTML'] =
    plaintextOnly ? stripTags(content) : content;
}
```

### resetContent (lines 148-154)

```javascript
resetContent(clear = false) {
  const content = clear ? '' : this.initialValue;
  this.setContent(content, this.plaintext);
  if (this.isFormElement) {
    super.value = content;
  }
}
```

### sanitizeHTML (lines 156-168)

```javascript
sanitizeHTML(html) {
  return html
    .replace(/[\n\t\r]/g, '')              // Remove newlines, tabs
    .replace(/\s{2,}/g, ' ')               // Multiple spaces → single
    .replace(/>\s+</g, '><')               // Space between tags
    .replace(/\s+>/g, '>')                 // Space before >
    .replace(/<\s+/g, '<')                 // Space after <
    .trim()
    .replace(/>([^\s])/g, '> $1')          // Space after tag content
    .replace(/([^\s])</g, '$1 <')          // Space before tag
    .replace(/\s{2,}/g, ' ')               // Clean remaining doubles
    .replace(/<([a-z]+)(\s[^>]*)?\s*\/\s*>/gi, '<$1$2 />'); // Self-closing
}
```

## Input Type Filtering

### Default Input Types (line 35)

```javascript
inputTypes = [
  'deleteByContent', 'deleteByCut', 'deleteByDrag',
  'deleteContentBackward', 'deleteContentForward',
  'deleteEntireSoftLine', 'deleteHardLineBackward',
  'deleteHardLineForward', 'deleteSoftLineBackward',
  'deleteSoftLineForward', 'deleteWordBackward',
  'deleteWordForward', 'formatBackColor', 'formatBold',
  'formatFontColor', 'formatFontName', 'formatIndent',
  'formatItalic', 'formatJustifyCenter', 'formatJustifyFull',
  'formatJustifyLeft', 'formatJustifyRight', 'formatOutdent',
  'formatRemove', 'formatSetBlockTextDirection',
  'formatSetInlineTextDirection', 'formatStrikethrough',
  'formatSubscript', 'formatSuperscript', 'formatUnderline',
  'historyRedo', 'historyUndo', 'insertCompositionText',
  'insertFromComposition', 'insertFromDrop', 'insertFromPaste',
  'insertFromYank', 'insertHorizontalRule', 'insertLineBreak',
  'insertLink', 'insertOrderedList', 'insertParagraph',
  'insertReplacementText', 'insertText', 'insertTranspose',
  'insertUnorderedList'
];
```

### beforeinput Handler (lines 89-93)

```javascript
handleBeforeInput(event) {
  if (!this.inputTypes.includes(event.inputType)) {
    event.preventDefault();  // Block disallowed input types
  }
}
```

## Attributes Reference

### Configuration

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `event-mode` | String | 'both' | Event handling mode |
| `input-types` | CSV | Full list | Allowed input types |
| `plaintext` | Boolean | false | Plaintext-only mode |
| `skip-toolbar` | String | 'Skip to content' | Skip button text |
| `toolbar` | String | 'b,i,u' | Command groups |
| `name` | String | - | Form element name |
| `styles` | String | 'index.css' | CSS file path |
| `noshadow` | Boolean | false | Disable shadow DOM |
| `nomount` | Boolean | false | Delay mounting |
| `noform` | Boolean | false | Disable form association |

### Toolbar Configuration

Format: `group1,group2|group3,group4|group5`

- Pipe (`|`) separates groups (rendered as fieldsets)
- Comma (`,`) separates items within groups

Example:
```html
<rich-text toolbar="b,i,u|h1,h2,h3|ol,ul|link,img|html,save"></rich-text>
```

## CSS Styling

### CSS Custom Properties

| Property | Default | Purpose |
|----------|---------|---------|
| `--richtext-active-bg` | `var(--Highlight)` | Active button background |
| `--richtext-active-c` | `inherit` | Active button text color |

### Key CSS Rules (index.css)

**Host Styles (lines 3-10):**
```css
:host {
  background: Canvas;
  color: CanvasText;
  color-scheme: inherit;
}
```

**Skip Button (lines 11-27):**
```css
:host::part(skip) {
  inset-block: -100vh auto;    /* Off-screen */
  inset-inline: -100vw auto;
}
:host::part(skip):focus {
  inset-block-start: 0;        /* On-screen when focused */
  inset-inline-start: 0;
}
```

**Button Reset (line 35):**
```css
button { all: unset; }
```

**Active State (lines 92-95):**
```css
.--active {
  background: var(--richtext-active-bg);
  color: var(--richtext-active-c);
}
```

**HTML Textarea (lines 72-81):**
```css
[name="htmlcode"] {
  field-sizing: content;
  color-scheme: dark;
  font-family: monospace;
  max-height: 25dvh;
  resize: vertical;
  width: 100%;
}
```

## Integration Patterns

### Basic Usage

```html
<rich-text toolbar="b,i,u|ol,ul" styles>
  <p>Initial content</p>
</rich-text>
```

### Form Integration

```html
<form>
  <rich-text name="editor" styles>
    <p>Initial content</p>
  </rich-text>
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>

<script>
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const editor = form.elements.editor;
  console.log('Editor value:', editor.value);
});
</script>
```

### Custom Commands

```javascript
const editor = document.querySelector('rich-text');

editor.addCustomCommand({
  key: 'timestamp',
  icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  title: 'Insert Timestamp',
  fn: function() {
    const timestamp = new Date().toLocaleString();
    document.execCommand('insertText', false, timestamp);
  }
});
```

### Event Handling

```javascript
const editor = document.querySelector('rich-text');

// Content changes
editor.addEventListener('rt:content', (e) => {
  console.log('Content:', e.detail.content);
});

// Save event (from save command)
editor.addEventListener('rt:save', (e) => {
  fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify({ content: e.detail.content })
  });
});

// Clear programmatically
editor.dispatchEvent(new CustomEvent('rt:clear'));

// Reset programmatically
editor.dispatchEvent(new CustomEvent('rt:reset'));
```

### Plaintext Mode

```html
<rich-text plaintext toolbar="save" styles>
  Plain text content only
</rich-text>

<script>
const editor = document.querySelector('rich-text');
editor.setContent('New text content', true);
</script>
```

### Input Type Restrictions

```html
<!-- Only allow paste and text insertion -->
<rich-text
  input-types="insertFromPaste,insertText"
  toolbar="copy|clear,reset"
  styles>
  Paste content here
</rich-text>
```

## Deep Dives

### Toolbar Rendering Pipeline

**renderToolbar()** (lines 139-141):
```javascript
renderToolbar() {
  return this.toolbarItems.map((group) =>
    `<fieldset>${group.split(',').map((entry) =>
      this.renderToolbarItem(entry)).join('')}</fieldset>`
  ).join('');
}
```

**renderToolbarItem(entry)** (lines 143-146):
```javascript
renderToolbarItem(entry) {
  const obj = this.commands.find(c => c.key === entry);
  return obj?.options ? this.renderSelect(obj) : this.renderCommand(obj);
}
```

**renderCommand(obj)** (lines 120-122):
```javascript
renderCommand(obj) {
  return obj ? `<button type="button" name="${obj.key}"
    title="${obj.title}"${obj.highlight ? ` data-command="${obj.command}"` : ''}>
    ${obj.icon ? this.icon(obj.icon) : ''}</button>
    ${obj.inputType ? this.renderInput(obj) : ''}` : '';
}
```

### Highlight State Management

**highlightToggle(command, node)** (lines 107-110):
```javascript
highlightToggle = (command, node) => {
  const isActive = document.queryCommandState(command);
  node.classList.toggle('--active', isActive);
}
```

**highlightToolbar()** (lines 112-118):
```javascript
highlightToolbar = () => {
  [...this.toolbar.elements].forEach(item => {
    if (this.highlight.includes(item.dataset.command)) {
      this.highlightToggle(item.dataset.command, item);
    }
  })
}
```

**Why this matters:**
- Uses `document.queryCommandState()` to detect formatting state
- Only commands with `highlight: true` are tracked
- Called on click and keydown in content area
- Shows user current formatting at cursor position

### HTML Source Editing

**toggleHTML()** (lines 187-203):

1. Toggle textarea visibility
2. Toggle content editability
3. Disable/enable toolbar buttons (except HTML toggle)
4. Sync content between visual and source views

**Critical timing:** When closing HTML editor, the `input` event is manually dispatched to trigger `rt:content` event for listeners.

## Gotchas and Edge Cases

### 1. Content Synchronization (lines 198-201)

**Issue:** HTML and visual editor content can diverge.

**Solution:** Content synced on toggle close, with manual input event dispatch.

### 2. Command Context Binding (lines 25-27)

**Issue:** Custom command functions need `this` reference.

**Solution:** Functions are re-bound during initialization.

**Gotcha:** Commands added via `addCustomCommand()` after initialization don't get auto-bound.

### 3. Custom Command Duplication (lines 80-86)

**Issue:** Adding command with duplicate key fails silently.

**Solution:** Check `customToolbarItems` array before adding.

### 4. FormElement Integration (lines 74-77)

**Issue:** Component doesn't integrate with forms if `noform` attribute present.

**Impact:** No form association, value property returns null, formReset() won't fire.

### 5. Content ID Generation (line 32)

**Issue:** ContentID generated once in initializeComponent.

**Gotcha:** Cloned components have same contentID, breaking skip button focus.

### 6. Toolbar Item Rendering (line 36)

**Issue:** Empty groups render as hidden fieldsets.

**CSS Solution:** `&:empty { display: none; }` (line 54)

### 7. Command Highlight State (lines 71, 114)

**Issue:** Only commands with `highlight: true` show active state.

**Gotcha:** Custom commands need both `highlight: true` AND a `command` property.

### 8. HTML Sanitization Limitations (lines 156-168)

**Issue:** sanitizeHTML only normalizes whitespace, doesn't prevent XSS.

**Risk:** User-entered HTML could contain malicious content.

**Recommendation:** Use proper HTML sanitization library for user-submitted content.

### 9. Input Handler Event Propagation (lines 53-54)

**Issue:** Input event stopped unless component is form element.

```javascript
if (!this.isFormElement) e.stopPropagation();
```

**Impact:** If not in a form, events won't bubble to ancestors.

### 10. Plaintext Attribute State (lines 37, 172)

**Issue:** plaintext attribute affects setContent behavior.

**Gotcha:** Setting attribute directly affects subsequent setContent calls.

## Dependencies

### External Package

```json
{
  "dependencies": {
    "@browser.style/common": "^1.0.1"
  }
}
```

### Internal Module

```javascript
import { commands } from './commands.js';  // 280 lines, 40+ commands
```

### Inherited from FormElement

| Method | Purpose |
|--------|---------|
| `uuid()` | Generate unique ID |
| `icon()` | Generate SVG from paths |
| `toKebabCase()` | String conversion |
| `escapeJsonForHtml()` | Safe HTML attributes |
| `debounced()` | Debounce function calls |
| `mount()` | Manual initialization |
| `register()` | Register custom element |

### Browser APIs Used

| API | Purpose |
|-----|---------|
| `ElementInternals` | Form association |
| `ContentEditable` | Editor functionality |
| `document.execCommand()` | Text formatting |
| `document.queryCommandState()` | Button state detection |
| `CustomEvent` | Event dispatching |
| `ShadowDOM` | Encapsulation |
| `CSSStyleSheet` | Dynamic style loading |
| `crypto.getRandomValues()` | UUID generation |
| `fetch()` | Load CSS file |

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.js | 206 | Main component class |
| index.css | 99 | Shadow DOM styles |
| commands.js | 280 | Command definitions |
| index.html | 77 | Demo with 4 examples |
| package.json | 47 | Package metadata |
| readme.md | 109 | User documentation |
