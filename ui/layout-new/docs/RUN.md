# Terminal Commands

All commands you can run from the terminal in the `@browser.style/layout` package.

## Build Commands

### Build CSS (Development)
```bash
node build.js
```
Generates unminified CSS to `dist/layout.css` for development and debugging.

### Build CSS (Production)
```bash
node build.js --minify
```
Generates minified CSS to `dist/layout.css` for production use.

### Watch Mode
```bash
node build.js --watch
```
Watches for changes to `layout.config` and `layouts/*.json` files and automatically rebuilds CSS.

### Custom Config
```bash
node build.js --config path/to/layout.config
```
Build CSS using a custom config file location.

### Custom Output
```bash
node build.js --output path/to/output.css
```
Build CSS to a custom output location.

### Combined Options
```bash
node build.js --config custom.config --output dist/custom.css --minify
```
All options can be combined as needed.

## Package Scripts

### Install Dependencies
```bash
npm install
```
Installs all development dependencies.

### Build CSS via npm
```bash
npm run build
```
Runs the default build command (defined in package.json).

### Clean Build
```bash
rm -rf dist && node build.js
```
Remove existing dist folder and perform fresh build.

## Demo Generation

### Generate Demo Files (Node.js)
```javascript
import { buildDemoFiles } from './src/demofiles.js'

buildDemoFiles('./layouts', './dist')
```

This generates:
- All HTML demo files (asymmetrical.html, autofit.html, etc.)
- Icon gallery (icons.html)
- Main index (index.html)
- All SVG icons in dist/icons/

### Generate Icons Only (Node.js)
```javascript
import { buildIcons } from './src/icons.js'

buildIcons('./layouts', './dist/icons')
```

## Programmatic Usage

### Build CSS from JavaScript
```javascript
import { LayoutBuilder } from './src/builder.js'

const builder = new LayoutBuilder(
  './layout.config',
  './layouts',
  './dist/layout.css'
)

// Development build
await builder.build(false)

// Production build
await builder.buildAll()
```

### Work with Presets
```javascript
import { createPreset, presetToHTML, validatePreset } from './src/preset.js'

// Create a preset
const preset = createPreset({
  id: 'hero',
  name: 'Hero Section',
  breakpoints: {
    md: 'columns(1)',
    lg: 'grid(3a)'
  },
  spaceTop: 3,
  spaceBottom: 3
})

// Convert to HTML
const html = presetToHTML(preset)
// <lay-out md="columns(1)" lg="grid(3a)" space-top="3" space-bottom="3">

// Validate
const result = validatePreset(preset)
if (!result.valid) {
  console.error(result.errors)
}
```

### Auto-generate Srcsets
```javascript
import { autoGenerateSrcsets } from './src/srcset.js'
import { readConfig } from './src/preset.js'

const config = await readConfig('./layout.config')
const preset = { /* your preset */ }

const srcsets = autoGenerateSrcsets(preset, config)
// { default: "100vw", 540: "50vw", 720: "33.33vw" }
```

## Testing & Verification

### Check Output Size
```bash
ls -lh dist/layout.css
```
View generated CSS file size.

### Compare with Original
```bash
diff dist/layout.css ../layout/dist/layout.css
```
Compare new CSS with original (from ui/layout).

### View Build Stats
The build command outputs:
- Number of breakpoints processed
- Layouts included per breakpoint
- Final CSS file size
- Build time

## Development Workflow

### Typical Development Cycle
```bash
# 1. Clean build
rm -rf dist

# 2. Build CSS
node build.js

# 3. Generate demos (optional)
node -e "import('./src/demofiles.js').then(m => m.buildDemoFiles('./layouts', './dist'))"

# 4. Check output
ls -lh dist/
```

### Watch Mode Development
```bash
# Start watch mode
node build.js --watch

# In another terminal, edit files
# Build automatically triggers on save
```

### Quick Test Build
```bash
# Single command: clean, build, check
rm -rf dist && node build.js && ls -lh dist/layout.css
```

## Package Installation

### Install from npm (when published)
```bash
npm install @browser.style/layout
```

### Install Locally for Testing
```bash
# From this directory
npm link

# In another project
npm link @browser.style/layout
```

### Use in Project
```javascript
// Import CSS in your entry file
import '@browser.style/layout/css'

// Or use preset utilities
import { createPreset, presetToHTML } from '@browser.style/layout/preset'
```

## CLI Tool (when installed globally)

### Install CLI
```bash
npm install -g @browser.style/layout
```

### Run from Anywhere
```bash
browser-style-layout --config my-project/layout.config --output dist/layout.css
```

## Troubleshooting

### Build Fails
```bash
# Check Node.js version (requires Node.js 16+)
node --version

# Verify config file exists
cat layout.config

# Check layouts directory
ls -la layouts/
```

### CSS Size Too Large
Check your `layout.config` breakpoints:
- Use object syntax for specific variants: `{"grid": ["grid(3a)"]}`
- Remove unused layout types from breakpoints
- Consider splitting into multiple builds for different pages

### Icons Not Generating
```bash
# Verify layout JSON files have icon data
cat layouts/columns.json | grep -A5 '"icon"'

# Manually trigger icon generation
node -e "import('./src/icons.js').then(m => m.buildIcons('./layouts', './dist/icons'))"
```
