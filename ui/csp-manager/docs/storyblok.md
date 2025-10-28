# Storyblok Integration Guide

This guide explains how to integrate the CSP Manager web component into Storyblok as a custom field plugin.

## Table of Contents

- [Overview](#overview)
- [How to Load the Web Component](#how-to-load-the-web-component)
- [Setup: Create Custom Field Plugin](#1-setup-create-custom-field-plugin)
- [Plugin Configuration](#2-plugin-configuration)
- [Content Type Setup](#3-content-type-setup)
- [Advanced: Store Both Policy AND String](#4-advanced-store-both-policy-and-string)
- [Backend: Generate CSP Header](#5-backend-generate-csp-header)
- [Webhooks for Auto-Generation](#6-webhooks-for-auto-generation)
- [Validation & Security Warnings](#7-validation--security-warnings)
- [Multi-Environment Support](#8-multi-environment-support)
- [Key Benefits](#key-benefits)

---

## Overview

Storyblok supports custom field plugins that allow you to create rich editing experiences. The CSP Manager can be integrated as a custom field plugin, providing content editors with a visual interface for managing Content Security Policies.

**Key Differences from Contentful:**
- Storyblok plugins are Vue.js-based
- Direct web component integration is simpler
- Plugins can be self-hosted or npm-published
- Better support for external scripts

---

## How to Load the Web Component

### Option 1: **Self-Hosted (Recommended)**

Host your CSP Manager files and load them in the plugin:

```javascript
// In your plugin's mounted() hook
const script = document.createElement('script');
script.type = 'module';
script.src = 'https://your-cdn.com/csp-manager/src/index.js';
document.head.appendChild(script);
```

### Option 2: **NPM Package**

If you publish the component to npm:

```bash
npm install csp-manager-component
```

Then import in your plugin:

```javascript
import 'csp-manager-component';
```

### Option 3: **Bundled with Plugin**

Include the CSP Manager files in your plugin bundle:

```javascript
// plugin/src/Plugin.vue
import '../assets/csp-manager/index.js';
```

---

## 1. Setup: Create Custom Field Plugin

Create a new Storyblok plugin using their CLI:

```bash
# Install Storyblok CLI
npm install -g storyblok

# Create a new plugin
storyblok quickstart
```

### Plugin Structure:

```
csp-manager-plugin/
├── src/
│   ├── Plugin.vue          # Main plugin component
│   └── main.js             # Plugin entry point
├── dist/                   # Built files
├── package.json
└── plugin.json             # Plugin configuration
```

---

### Plugin.vue - Main Component:

```vue
<template>
  <div class="csp-manager-wrapper">
    <csp-manager
      ref="cspManager"
      :evaluate="evaluate"
      @csp-change="handleChange"
    ></csp-manager>
  </div>
</template>

<script>
export default {
  mixins: [window.Storyblok.plugin],

  data() {
    return {
      evaluate: true,
    };
  },

  mounted() {
    // Load the CSP Manager web component
    this.loadCSPManager();

    // Initialize with existing value
    this.$nextTick(() => {
      this.initializeValue();
    });
  },

  methods: {
    loadCSPManager() {
      // Load the web component script
      if (!customElements.get('csp-manager')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://your-cdn.com/csp-manager/src/index.js';
        document.head.appendChild(script);
      }
    },

    initializeValue() {
      const cspManager = this.$refs.cspManager;

      if (this.model?.policy) {
        try {
          cspManager.policy = JSON.parse(this.model.policy);
        } catch (e) {
          console.error('Failed to parse CSP policy:', e);
        }
      }
    },

    handleChange(event) {
      const { policy, cspString, evaluations } = event.detail;

      // Update the field value
      this.$emit('changed-model', {
        policy: JSON.stringify(policy),
        cspString: cspString,
        evaluations: evaluations ? JSON.stringify(evaluations) : null
      });

      // Optional: Show validation warnings
      if (evaluations) {
        this.showValidationWarnings(evaluations);
      }
    },

    showValidationWarnings(evaluations) {
      const highSeverityIssues = Object.values(evaluations)
        .filter(eval => eval.severity === 'high');

      if (highSeverityIssues.length > 0) {
        // Show notification in Storyblok
        this.$toast.error(
          `CSP has ${highSeverityIssues.length} high-severity security issues`,
          { duration: 5000 }
        );
      }
    }
  },

  watch: {
    model: {
      handler(newValue) {
        if (newValue && this.$refs.cspManager) {
          this.initializeValue();
        }
      },
      deep: true
    }
  }
};
</script>

<style scoped>
.csp-manager-wrapper {
  padding: 1rem;
  background: white;
  border-radius: 4px;
}
</style>
```

---

### main.js - Plugin Entry:

```javascript
import Plugin from './Plugin.vue';

if (process.env.NODE_ENV === 'development') {
  window.Storyblok.plugin(Plugin, { dev: true });
} else {
  window.Storyblok.plugin(Plugin);
}
```

---

## 2. Plugin Configuration

### plugin.json:

```json
{
  "name": "CSP Manager",
  "description": "Visual editor for Content Security Policy directives",
  "version": "1.0.0",
  "author": "Your Name",
  "fieldtypes": ["object"],
  "icon": "shield",
  "options": [
    {
      "key": "evaluate",
      "name": "Enable Security Evaluation",
      "type": "boolean",
      "default": true
    },
    {
      "key": "lang",
      "name": "Language",
      "type": "option",
      "options": [
        { "name": "English", "value": "en" },
        { "name": "Danish", "value": "da" }
      ],
      "default": "en"
    }
  ]
}
```

### Build and Publish:

```bash
# Build the plugin
npm run build

# Publish to Storyblok (if using private plugins)
storyblok push-plugin

# OR self-host the plugin
# Upload dist/ files to your CDN
```

---

## 3. Content Type Setup

### Add Field to Component Schema:

In Storyblok, create or edit a component:

1. Go to **Components** → Your component
2. Add a new field:
   - **Name**: `csp_policy`
   - **Technical Name**: `csp_policy`
   - **Field Type**: Select your "CSP Manager" plugin
   - **Required**: Optional

### Schema Example:

```json
{
  "name": "site_config",
  "display_name": "Site Configuration",
  "schema": {
    "csp_policy": {
      "type": "custom",
      "field_type": "csp-manager",
      "pos": 0
    },
    "csp_header": {
      "type": "text",
      "description": "Auto-generated CSP header string (read-only)",
      "pos": 1
    }
  }
}
```

---

## 4. Advanced: Store Both Policy AND String

Update your plugin to store multiple values:

```javascript
handleChange(event) {
  const { policy, cspString, evaluations } = event.detail;

  // Store as a nested object
  this.$emit('changed-model', {
    policy: policy,          // Store as object, not string
    header: cspString,       // Pre-generated header
    evaluations: evaluations,
    lastUpdated: new Date().toISOString()
  });
}
```

### Access in Frontend:

```javascript
// pages/index.js or components/Layout.js
export default {
  async asyncData({ $storyapi }) {
    const { data } = await $storyapi.get('cdn/stories/config');
    const cspPolicy = data.story.content.csp_policy;

    return {
      cspHeader: cspPolicy.header
    };
  },

  head() {
    return {
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          content: this.cspHeader
        }
      ]
    };
  }
};
```

---

## 5. Backend: Generate CSP Header

### Node.js Backend:

```javascript
const StoryblokClient = require('storyblok-js-client');

const storyblok = new StoryblokClient({
  accessToken: process.env.STORYBLOK_ACCESS_TOKEN
});

async function getCSPHeader() {
  const { data } = await storyblok.get('cdn/stories/config');
  const cspPolicy = data.story.content.csp_policy;

  // Option 1: Use pre-generated header
  return cspPolicy.header;

  // Option 2: Generate from policy object
  return generateCSPHeader(cspPolicy.policy);
}

function generateCSPHeader(policy) {
  return Object.entries(policy)
    .map(([directive, config]) => {
      const values = [...(config.defaults || []), ...(config.added || [])];
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

// Use in Express middleware
app.use((req, res, next) => {
  getCSPHeader().then(cspHeader => {
    res.setHeader('Content-Security-Policy', cspHeader);
    next();
  });
});
```

---

### Next.js with Storyblok:

```javascript
// lib/storyblok.js
import StoryblokClient from 'storyblok-js-client';

const client = new StoryblokClient({
  accessToken: process.env.STORYBLOK_ACCESS_TOKEN,
  cache: {
    clear: 'auto',
    type: 'memory'
  }
});

export async function getCSPHeader() {
  const { data } = await client.get('cdn/stories/config');
  return data.story.content.csp_policy.header;
}

// pages/_app.js or middleware
import { getCSPHeader } from '../lib/storyblok';

export default function MyApp({ Component, pageProps, cspHeader }) {
  return (
    <>
      <Head>
        <meta httpEquiv="Content-Security-Policy" content={cspHeader} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

MyApp.getInitialProps = async (appContext) => {
  const cspHeader = await getCSPHeader();
  return { cspHeader };
};
```

---

### Nuxt.js with Storyblok:

```javascript
// nuxt.config.js
export default {
  modules: [
    ['storyblok-nuxt', {
      accessToken: process.env.STORYBLOK_ACCESS_TOKEN
    }]
  ],

  hooks: {
    'render:route': async (url, result, context) => {
      const { $storyapi } = context;
      const { data } = await $storyapi.get('cdn/stories/config');
      const cspHeader = data.story.content.csp_policy.header;

      // Add CSP header to response
      context.res.setHeader('Content-Security-Policy', cspHeader);
    }
  }
};
```

---

## 6. Webhooks for Auto-Generation

Storyblok supports webhooks for automated workflows:

### Webhook Setup:

1. Go to **Settings** → **Webhooks**
2. Create webhook:
   - **URL**: `https://your-server.com/storyblok-webhook`
   - **Event**: `story.published` or `story.saved`
   - **Story**: Filter by component type (e.g., `site_config`)

### Webhook Handler:

```javascript
const express = require('express');
const StoryblokClient = require('storyblok-js-client');

const app = express();
app.use(express.json());

const managementClient = new StoryblokClient({
  oauthToken: process.env.STORYBLOK_OAUTH_TOKEN
});

app.post('/storyblok-webhook', async (req, res) => {
  const { story_id, action } = req.body;

  if (action === 'published') {
    try {
      // Get the story
      const { data } = await managementClient.get(
        `spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${story_id}`
      );

      const cspPolicy = data.story.content.csp_policy;

      if (cspPolicy && cspPolicy.policy) {
        // Generate CSP header from policy
        const cspHeader = generateCSPHeader(cspPolicy.policy);

        // Update the story with generated header
        data.story.content.csp_policy.header = cspHeader;

        await managementClient.put(
          `spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${story_id}`,
          { story: data.story }
        );

        console.log('CSP header auto-generated for story:', story_id);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Webhook error:', error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
});

app.listen(3000);
```

---

## 7. Validation & Security Warnings

Show editors security warnings before publishing:

```javascript
// In Plugin.vue
methods: {
  handleChange(event) {
    const { policy, cspString, evaluations } = event.detail;

    // Check for high-severity issues
    const highSeverityIssues = this.getHighSeverityIssues(evaluations);

    if (highSeverityIssues.length > 0) {
      // Show error notification
      this.$toast.error(
        `⚠️ CSP contains ${highSeverityIssues.length} critical security issues`,
        { duration: 10000 }
      );

      // Log details to console for editors
      console.group('🔴 CSP Security Issues');
      highSeverityIssues.forEach(issue => {
        console.error(issue.directive, issue.findings);
      });
      console.groupEnd();

      // Optional: Mark field with validation error
      this.errors = highSeverityIssues.map(issue =>
        `${issue.directive}: ${issue.findings[0].message}`
      );
    } else {
      this.errors = [];
      this.$toast.success('✅ CSP configuration is secure');
    }

    // Emit the change
    this.$emit('changed-model', {
      policy: JSON.stringify(policy),
      cspString: cspString,
      evaluations: evaluations ? JSON.stringify(evaluations) : null,
      hasErrors: highSeverityIssues.length > 0
    });
  },

  getHighSeverityIssues(evaluations) {
    if (!evaluations) return [];

    return Object.entries(evaluations)
      .filter(([_, eval]) => eval.severity === 'high')
      .map(([directive, eval]) => ({
        directive,
        findings: eval.findings
      }));
  }
}
```

---

## 8. Multi-Environment Support

Manage different CSP policies per environment:

### Component Schema:

```json
{
  "name": "site_config",
  "schema": {
    "csp_development": {
      "type": "custom",
      "field_type": "csp-manager",
      "display_name": "CSP (Development)"
    },
    "csp_staging": {
      "type": "custom",
      "field_type": "csp-manager",
      "display_name": "CSP (Staging)"
    },
    "csp_production": {
      "type": "custom",
      "field_type": "csp-manager",
      "display_name": "CSP (Production)"
    }
  }
}
```

### Backend Logic:

```javascript
async function getCSPForEnvironment(environment = 'production') {
  const { data } = await storyblok.get('cdn/stories/config');
  const cspField = `csp_${environment}`;

  return data.story.content[cspField]?.header;
}

// In Express/Next.js
const environment = process.env.NODE_ENV || 'production';
const cspHeader = await getCSPForEnvironment(environment);
res.setHeader('Content-Security-Policy', cspHeader);
```

---

## Key Benefits

### ✅ **Simpler Integration than Contentful**
Storyblok's Vue.js-based plugin system makes web component integration straightforward.

### ✅ **Real-time Preview**
Storyblok's visual editor shows changes instantly as editors modify the CSP.

### ✅ **No Iframe Restrictions**
Unlike Contentful, Storyblok plugins have fewer CSP restrictions for loading external scripts.

### ✅ **Built-in Localization**
Storyblok's translation system works seamlessly with the CSP Manager's i18n support.

### ✅ **Component Nesting**
CSP Manager can be nested within Storyblok components for complex configurations.

### ✅ **Visual Editor Integration**
The CSP Manager appears inline in Storyblok's visual editor, not in a separate modal.

### ✅ **Draft/Published Workflow**
Different CSP policies for draft vs. published content.

### ✅ **Multi-Space Support**
Use the same plugin across multiple Storyblok spaces.

---

## Additional Resources

- [Storyblok Plugin Development](https://www.storyblok.com/docs/plugins/introduction)
- [Storyblok Field Plugin Tutorial](https://www.storyblok.com/docs/plugins/field-plugin)
- [CSP Manager Demo](../demo.html)
- [Storyblok Management API](https://www.storyblok.com/docs/api/management)

---

## Comparison: Storyblok vs. Contentful

| Feature | Storyblok | Contentful |
|---------|-----------|------------|
| Plugin Framework | Vue.js | Vanilla JS + iframe |
| Web Component Support | ✅ Excellent | ⚠️ Good (with constraints) |
| External Scripts | ✅ Easy to load | ⚠️ CSP restrictions |
| Development Experience | ✅ Hot reload, Vue devtools | ⚠️ Requires rebuild |
| Visual Editor | ✅ Inline editing | ❌ Separate modal |
| Setup Complexity | ⭐⭐ Medium | ⭐⭐⭐ Higher |

---

## Questions?

For other CMS integrations:
- **Sanity**: Use custom input components (React-based)
- **Strapi**: Create custom field extensions
- **Directus**: Use custom interface extensions
- **Contentful**: See [contentful.md](./contentful.md)

All follow similar patterns: embed the web component and listen to the `csp-change` event!
