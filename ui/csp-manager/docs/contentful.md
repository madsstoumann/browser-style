# Contentful Integration Guide

This guide explains how to integrate the CSP Manager web component into Contentful as a custom field extension.

## Table of Contents

- [Overview](#overview)
- [How to Load the Web Component](#how-to-load-the-web-component)
  - [Option 1: Self-Hosted (Recommended)](#option-1-self-hosted-recommended-for-production)
  - [Option 2: NPM + Bundler](#option-2-npm--bundler-for-build-process)
  - [Option 3: Public CDN](#option-3-unpkgjsdelivr-quick-testing-not-production)
  - [Contentful Constraints](#️-important-contentful-constraints)
  - [Recommended Approach](#-recommended-approach)
  - [Publishing to NPM](#-publishing-to-npm-optional)
  - [Quick Start](#-quick-start-for-contentful)
- [Setup: Create Custom Field Extension](#1-setup-create-custom-field-extension)
- [Content Model Setup](#2-content-model-setup)
- [Extension Configuration](#3-extension-configuration)
- [Advanced: Store Both Policy AND String](#4-advanced-store-both-policy-and-string)
- [Backend: Generate CSP Header](#5-backend-generate-csp-header)
- [Alternative: Webhook for Auto-Updating String](#6-alternative-webhook-for-auto-updating-string)
- [Validation & Security Warnings](#7-validation--security-warnings)
- [Multi-Environment Support](#8-multi-environment-support)
- [Key Benefits](#key-benefits)

---

## Overview

Contentful allows custom UI extensions for fields. You can create an extension that embeds the CSP Manager, providing content editors with a visual interface for managing Content Security Policies without needing to understand CSP syntax.

---

## How to Load the Web Component

Before diving into the integration, it's important to understand the different ways you can load the CSP Manager web component in Contentful.

### Option 1: **Self-Hosted (Recommended for Production)**

Host the web component files on your own infrastructure:

**Your Setup:**
```
your-cdn.com/
  └── csp-manager/
      └── src/
          ├── index.js
          ├── evaluate.js
          ├── index.css
          ├── csp-directives.json
          └── i18n.json
```

**In Contentful Extension:**
```html
<script type="module" src="https://your-cdn.com/csp-manager/src/index.js"></script>
```

**Hosting Options:**
- Your own CDN (Cloudflare, AWS CloudFront, etc.)
- Vercel/Netlify static hosting
- GitHub Pages
- Any static file hosting service

**Pros:**
- ✅ Full control over versions
- ✅ No external dependencies
- ✅ Better performance (your CDN)
- ✅ Works offline in Contentful's iframe

---

### Option 2: **NPM + Bundler (For Build Process)**

If you're building the Contentful extension locally and deploying it:

**Install:**
```bash
npm install your-csp-manager-package
# or
yarn add your-csp-manager-package
```

**Build the extension:**
```javascript
// contentful-extension.js
import 'your-csp-manager-package';

// Rest of your extension code
window.contentfulExtension.init((extension) => {
  // ...
});
```

**Bundle with Webpack/Vite:**
```bash
# Bundle everything into a single file
vite build contentful-extension.js
# Output: dist/contentful-extension.bundle.js
```

**Upload to Contentful:**
```bash
contentful extension create \
  --src ./dist/contentful-extension.bundle.js
```

**Pros:**
- ✅ Standard npm workflow
- ✅ Version management with package.json
- ✅ Can use bundler optimizations

**Cons:**
- ⚠️ Requires build step
- ⚠️ Need to rebuild/redeploy on updates

---

### Option 3: **Unpkg/JSDelivr (Quick Testing, Not Production)**

Use a public CDN for quick prototyping:

```html
<!-- If your package is on npm as "csp-manager-component" -->
<script type="module" src="https://unpkg.com/csp-manager-component@latest/index.js"></script>

<!-- OR JSDelivr -->
<script type="module" src="https://cdn.jsdelivr.net/npm/csp-manager-component@latest/index.js"></script>
```

**Pros:**
- ✅ Zero setup, instant usage
- ✅ Good for demos/testing

**Cons:**
- ⚠️ External dependency (CDN downtime)
- ⚠️ Contentful iframe may block external scripts
- ⚠️ Version updates can break things

---

### ⚠️ Important Contentful Constraints

#### **Contentful Extensions Run in an Iframe**

Contentful loads your extension in a sandboxed iframe with Content Security Policy restrictions:

```
Content-Security-Policy:
  script-src 'self' https://contentful.com https://unpkg.com;
  connect-src 'self' https://api.contentful.com;
```

This means:
1. ✅ **Self-hosted on your domain** - Works if you configure CORS
2. ✅ **Contentful-hosted** - Upload bundle directly to Contentful
3. ⚠️ **External CDNs** - May be blocked unless whitelisted
4. ✅ **ES Modules** - Supported via `<script type="module">`

---

### 🎯 Recommended Approach

#### **For Production: Contentful-Hosted Bundle**

This is the most reliable approach:

**1. Bundle your component:**
```bash
# Create a single-file bundle
npm run build
# Output: dist/csp-manager-bundle.js (includes all CSS, JSON, etc.)
```

**2. Create extension with inline source:**
```html
<!-- contentful-extension.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/contentful-ui-extensions-sdk@3"></script>
</head>
<body>
  <csp-manager id="csp-editor" evaluate></csp-manager>

  <!-- Inline the entire bundle -->
  <script type="module">
    // Paste your bundled code here
    // Or use srcdoc parameter to reference it
  </script>

  <script>
    window.contentfulExtension.init((extension) => {
      // Extension logic...
    });
  </script>
</body>
</html>
```

**3. Deploy to Contentful:**
```bash
contentful extension create \
  --space-id YOUR_SPACE_ID \
  --srcdoc ./contentful-extension.html
```

---

### 📦 Publishing to NPM (Optional)

If you want to make this available via npm:

**1. Prepare package.json:**
```json
{
  "name": "csp-manager-component",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": "./index.js",
    "./evaluate": "./evaluate.js"
  },
  "files": [
    "index.js",
    "evaluate.js",
    "index.css",
    "csp-directives.json",
    "i18n.json"
  ]
}
```

**2. Publish:**
```bash
npm publish
```

**3. Users can install:**
```bash
npm install csp-manager-component
```

---

### 🔥 Quick Start for Contentful

**Easiest way to test right now:**

1. **Host your files** on GitHub Pages or Vercel
2. **Create this extension HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/contentful-ui-extensions-sdk@3"></script>
  <script type="module" src="https://your-github-pages.io/csp-manager/src/index.js"></script>
</head>
<body>
  <csp-manager id="csp-editor" evaluate></csp-manager>
  <script>
    window.contentfulExtension.init((extension) => {
      const cspManager = document.getElementById('csp-editor');

      const currentValue = extension.field.getValue();
      if (currentValue) {
        cspManager.policy = JSON.parse(currentValue);
      }

      cspManager.addEventListener('csp-change', (e) => {
        extension.field.setValue(JSON.stringify(e.detail.policy));
      });

      extension.window.startAutoResizer();
    });
  </script>
</body>
</html>
```

3. **Upload to Contentful** via the web UI or CLI

---

### Summary: Loading Options

**Can you use the web component directly in Contentful?**
✅ Yes, but with considerations:

- ❌ **Can't load directly from npm** in the browser (npm is for Node.js build tools)
- ✅ **Can bundle from npm** and upload the result
- ✅ **Can self-host** and load via `<script>` tag
- ✅ **Can inline** the entire component into the extension HTML

**Best practices:**
1. Start with self-hosted for testing
2. Move to Contentful-hosted bundle for production
3. Use npm only if you have a build pipeline
4. Avoid external CDNs (unpkg/jsdelivr) for production

---

## 1. Setup: Create Custom Field Extension

Create a custom HTML file that will be hosted and loaded as a Contentful field extension:

**contentful-extension.html**
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/contentful-ui-extensions-sdk@3"></script>
  <script type="module" src="https://your-cdn.com/csp-manager/index.js"></script>
</head>
<body>
  <csp-manager id="csp-editor" evaluate></csp-manager>

  <script>
    window.contentfulExtension.init((extension) => {
      const cspManager = document.getElementById('csp-editor');

      // 1. Load initial value from Contentful
      const currentValue = extension.field.getValue();
      if (currentValue) {
        cspManager.policy = JSON.parse(currentValue);
      }

      // 2. Listen to changes and update Contentful
      cspManager.addEventListener('csp-change', (e) => {
        const policyJSON = JSON.stringify(e.detail.policy);
        extension.field.setValue(policyJSON);

        // Optional: Show validation errors
        if (e.detail.evaluations) {
          const hasErrors = Object.values(e.detail.evaluations).some(
            eval => eval.severity === 'high'
          );
          if (hasErrors) {
            extension.field.setInvalid('CSP has high-severity security issues');
          } else {
            extension.field.removeInvalid();
          }
        }
      });

      // 3. Auto-resize the iframe
      extension.window.startAutoResizer();
    });
  </script>
</body>
</html>
```

### Key Points:

- **Line 3**: Load the Contentful UI Extensions SDK
- **Line 4**: Load your CSP Manager component from your CDN
- **Line 13-16**: Load existing policy from Contentful when the field is opened
- **Line 19-33**: Listen to `csp-change` events and save back to Contentful
- **Line 36**: Auto-resize the extension iframe to fit content

---

## 2. Content Model Setup

In Contentful, create a content type with these fields:

```json
{
  "name": "Website Configuration",
  "fields": [
    {
      "id": "csp_policy",
      "name": "Content Security Policy",
      "type": "Object",
      "widgetId": "csp-manager-extension",
      "required": false
    },
    {
      "id": "csp_header_string",
      "name": "CSP Header (Auto-generated)",
      "type": "Text",
      "disabled": true,
      "omitted": false
    }
  ]
}
```

### Field Descriptions:

- **csp_policy**: Stores the structured policy object (JSON)
- **csp_header_string**: Optional read-only field showing the generated CSP string
- **widgetId**: Links the field to your custom extension

---

## 3. Extension Configuration

Register the extension in Contentful using the CLI:

### Using Contentful CLI:

```bash
contentful extension create \
  --space-id YOUR_SPACE_ID \
  --name "CSP Manager" \
  --field-types Object \
  --src https://your-cdn.com/contentful-extension.html
```

### Using Configuration File:

Create an `extension.json`:

```json
{
  "id": "csp-manager",
  "name": "CSP Manager",
  "srcdoc": "./contentful-extension.html",
  "fieldTypes": ["Object"],
  "sidebar": false
}
```

Then deploy:

```bash
contentful extension create --extension-id csp-manager
```

### Via Contentful Web App:

1. Go to **Settings** → **Extensions**
2. Click **Add extension** → **Create new extension**
3. Select **Hosted by Contentful** or **Self-hosted**
4. Paste your extension HTML or provide the URL
5. Set field type to **Object**
6. Save and install

---

## 4. Advanced: Store Both Policy AND String

You might want to store both the policy object and the generated string for convenience:

```javascript
cspManager.addEventListener('csp-change', async (e) => {
  // Update policy object field
  await extension.field.setValue(JSON.stringify(e.detail.policy));

  // Update the CSP string in a different field (if your content model has it)
  const entry = await extension.entry.getSys();
  const fields = extension.entry.fields;

  // Set the CSP header string field
  fields.csp_header_string.setValue(
    e.detail.cspString.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  );
});
```

This allows you to:
- Store structured data in `csp_policy`
- Display the formatted string in `csp_header_string` for editors to copy
- Use either format in your backend

---

## 5. Backend: Generate CSP Header

On your backend/CDN, retrieve the policy from Contentful and use it:

### Node.js Example:

```javascript
const contentful = require('contentful');

const client = contentful.createClient({
  space: 'YOUR_SPACE_ID',
  accessToken: 'YOUR_ACCESS_TOKEN'
});

// Get the config entry
const entry = await client.getEntry('YOUR_CONFIG_ENTRY_ID');
const cspPolicy = JSON.parse(entry.fields.cspPolicy);

// Convert to CSP header string
function generateCSPHeader(policy) {
  const directives = Object.entries(policy).map(([directive, config]) => {
    const values = [...(config.defaults || []), ...(config.added || [])];
    return `${directive} ${values.join(' ')}`;
  });
  return directives.join('; ');
}

const cspHeader = generateCSPHeader(cspPolicy);

// Set response header
res.setHeader('Content-Security-Policy', cspHeader);
```

### Next.js Example:

```javascript
// pages/api/csp.js or middleware
import { createClient } from 'contentful';

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
});

export default async function handler(req, res) {
  const entry = await client.getEntry(process.env.CSP_CONFIG_ENTRY_ID);
  const cspPolicy = JSON.parse(entry.fields.cspPolicy);

  const cspHeader = generateCSPHeader(cspPolicy);

  res.setHeader('Content-Security-Policy', cspHeader);
  res.status(200).json({ csp: cspHeader });
}
```

### Edge Function Example (Vercel/Netlify):

```javascript
export default async function handler(request, context) {
  const cspPolicy = await fetchCSPFromContentful();
  const cspHeader = generateCSPHeader(cspPolicy);

  const response = await context.next();
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}
```

---

## 6. Alternative: Webhook for Auto-Updating String

Set up a Contentful webhook to automatically generate the string field when the policy changes:

### Webhook Endpoint (on your server):

```javascript
const express = require('express');
const contentful = require('contentful-management');

const app = express();
app.use(express.json());

const managementClient = contentful.createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
});

app.post('/contentful-webhook', async (req, res) => {
  const entry = req.body;

  // Only process if CSP policy field changed
  if (entry.fields.csp_policy) {
    const policy = entry.fields.csp_policy['en-US'];
    const cspString = generateCSPHeader(JSON.parse(policy));

    // Update the entry via Management API
    const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment('master');
    const entryToUpdate = await environment.getEntry(entry.sys.id);

    entryToUpdate.fields.csp_header_string = { 'en-US': cspString };
    await entryToUpdate.update();

    console.log('CSP header string updated for entry:', entry.sys.id);
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### Configure Webhook in Contentful:

1. Go to **Settings** → **Webhooks**
2. Click **Add webhook**
3. Set URL to your endpoint: `https://your-server.com/contentful-webhook`
4. Select triggers: **Entry.save** or **Entry.publish**
5. Optional: Filter by content type
6. Save webhook

---

## 7. Validation & Security Warnings

Show editors when they're using unsafe directives and prevent publishing with security issues:

```javascript
cspManager.addEventListener('csp-change', (e) => {
  if (e.detail.evaluations) {
    const highSeverityIssues = Object.entries(e.detail.evaluations)
      .filter(([_, eval]) => eval.severity === 'high')
      .map(([directive, eval]) => ({
        directive,
        findings: eval.findings
      }));

    if (highSeverityIssues.length > 0) {
      // Show warning notification
      extension.dialogs.openAlert({
        title: 'Security Warning',
        message: `Your CSP has ${highSeverityIssues.length} high-severity issues. Review before publishing.`,
        intent: 'negative'
      });

      // Mark field as invalid (prevents publishing)
      extension.field.setInvalid(
        `${highSeverityIssues.length} security issue(s) detected`
      );
    } else {
      // Clear validation errors
      extension.field.removeInvalid();
    }
  }
});
```

### Validation Levels:

- **High Severity**: Block publishing, show error
- **Medium Severity**: Show warning, allow publishing
- **Secure**: Clear all warnings

---

## 8. Multi-Environment Support

Store different CSP policies per environment (dev, staging, production):

### Content Model:

```json
{
  "name": "Website Configuration",
  "fields": [
    {
      "id": "csp_development",
      "name": "CSP (Development)",
      "type": "Object",
      "widgetId": "csp-manager-extension"
    },
    {
      "id": "csp_staging",
      "name": "CSP (Staging)",
      "type": "Object",
      "widgetId": "csp-manager-extension"
    },
    {
      "id": "csp_production",
      "name": "CSP (Production)",
      "type": "Object",
      "widgetId": "csp-manager-extension"
    }
  ]
}
```

### Backend Logic:

```javascript
const environment = process.env.NODE_ENV || 'production';
const cspFieldName = `csp_${environment}`;

const entry = await client.getEntry(CONFIG_ENTRY_ID);
const cspPolicy = JSON.parse(entry.fields[cspFieldName]);

const cspHeader = generateCSPHeader(cspPolicy);
res.setHeader('Content-Security-Policy', cspHeader);
```

### Benefits:

- **Development**: Relaxed CSP for easier debugging
- **Staging**: Test strict policies before production
- **Production**: Strictest security policies

---

## Key Benefits

### ✅ **Visual Editing**
Content editors don't need to understand CSP syntax or memorize directive names.

### ✅ **Real-time Validation**
Immediate feedback on security issues with color-coded severity levels (red/orange/green).

### ✅ **Type Safety**
Structured data instead of free-form text reduces errors and typos.

### ✅ **Version Control**
Contentful tracks all changes with full revision history.

### ✅ **Multi-language Support**
The CSP Manager component already supports i18n (English/Danish).

### ✅ **Preview Mode**
Editors can see exactly what they're configuring before publishing.

### ✅ **CMS Integration**
The `csp-change` event makes it easy to sync with any backend system.

### ✅ **Security Evaluation**
Built-in security checker based on Google's CSP Evaluator catches common mistakes.

---

## Additional Resources

- [Contentful Extensions SDK](https://www.contentful.com/developers/docs/extensibility/ui-extensions/)
- [CSP Manager Demo](../demo.html)
- [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/)

---

## Questions?

This same integration pattern works for other headless CMSs:
- **Storyblok**: Use their custom field plugin system
- **Sanity**: Create a custom input component
- **Strapi**: Use custom field extensions
- **Directus**: Create custom interface extensions

The core concept remains the same: embed the web component and use the `csp-change` event to sync data.
