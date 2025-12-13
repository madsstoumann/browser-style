# Contentful Integration Guide

This directory contains Contentful app wrappers for browser.style UI components. Each component is packaged to work seamlessly within Contentful's iframe-based app architecture.

## Available Components

- **web-config-csp** - Content Security Policy visual editor with security evaluation
- **web-config-robots** - robots.txt editor (structured config + output)
- **web-config-security** - security.txt editor (structured config + output)
- **web-config-manifest** - web app manifest editor

## Setup Instructions

### 1. Create a New App in Contentful

1. Go to your Contentful organization settings
2. Navigate to **Apps** → **Manage apps** → **Create app**
3. Choose **Create a custom app**
4. Fill in the app details:
   - **App name**: `Web Config CSP` (or component name)
   - **Short description**: Brief description of what the app does
   - **App URL**: `https://browser.style/ui/cms/contentful/web-config-csp/`

### 2. Configure App Locations

In the app configuration, enable the **Entry field** location:

1. Under **Locations**, check **Entry field**
2. Configure field types that the app supports:
   - For **web-config-csp**: Select **JSON object** as the field type
   - For **web-config-robots**: Select **Long text** as the field type
   - For **web-config-security**: Select **Long text** as the field type
   - For **web-config-manifest**: Select **JSON object** as the field type
3. Save the configuration

### 3. Install App to Space

1. After creating the app, go to the **Install** tab
2. Select the space(s) where you want to use this app
3. Click **Install to selected spaces**
4. The app will now be available in those spaces

### 4. Add to Content Model

1. In your Contentful space, go to **Content model**
2. Select the content type where you want to use the component
3. Click **Add field**
4. Choose the appropriate field type:
   - For **web-config-csp**: Select **JSON object**
   - For **web-config-robots**: Select **Long text**
   - For **web-config-security**: Select **Long text**
   - For **web-config-manifest**: Select **JSON object**
5. Configure the field:
   - **Name**: e.g., "Content Security Policy"
   - **Field ID**: e.g., `contentSecurityPolicy`
6. In the **Appearance** tab:
   - Select your custom app (e.g., "Web Config CSP")
7. Save the content type

## Field Type Requirements

Each component requires a specific Contentful field type:

| Component | Field Type | Description |
|-----------|------------|-------------|
| web-config-csp | JSON object | Stores CSP policy configuration as structured JSON |
| web-config-robots | Long text | Stores robots.txt as plain text |
| web-config-security | Long text | Stores security.txt as plain text |
| web-config-manifest | JSON object | Stores manifest.json as structured JSON |

## Using the Components

### Web Config CSP

**Initial State:**
- If the field is **empty**, the component starts with a blank slate (no directives enabled)
- Users build their CSP from scratch using the "Add directive" button
- If the field has **existing data**, it loads that saved policy

**Features:**
- Visual CSP policy editor
- Real-time security evaluation
- High-severity issues block publishing
- Auto-saves changes to Contentful

**Data Format:**
```json
{
  "default-src": {
    "added": ["'self'"]
  },
  "script-src": {
    "added": ["'self'", "'unsafe-inline'"],
    "defaults": ["'strict-dynamic'"]
  }
}
```

## Security Headers

These apps are served from `/ui/cms/contentful/*` with special security headers configured in Cloudflare:

- **Content-Security-Policy**: Allows iframe embedding from `*.contentful.com`
- **No X-Frame-Options**: Prevents conflicts with CSP frame-ancestors
- **No Permissions-Policy**: CMS apps need flexible permissions

This is handled automatically via Cloudflare Rules.

## Troubleshooting

### App doesn't load in Contentful

1. **Check the URL**: Ensure it's `https://browser.style/ui/cms/contentful/[component]/`
2. **Verify field type**: Must match the component requirements
3. **Check browser console**: Look for CSP or iframe errors
4. **Verify Cloudflare rules**: Ensure `/ui/cms/*` has correct headers

### Data not saving

1. **Check field type**: Must match the component requirements (CSP/manifest: JSON object; robots/security: Long text)
2. **Check browser console**: Look for Contentful SDK errors
3. **Verify API keys**: Ensure Contentful space has proper permissions

### Validation errors

For **web-config-csp**, high-severity security issues will block publishing. This is intentional. Review and fix the security findings before publishing.

### Web Config Robots

**Initial State:**
- If the field is **empty**, the component starts blank
- If the field has **existing data**, it loads that saved config

**Data Format:**
The field stores the component's `config` object.

### Web Config Security

**Initial State:**
- If the field is **empty**, the component starts blank
- If the field has **existing data**, it loads that saved config

**Data Format:**
The field stores the component's `config` object.

### Web Config Manifest

**Initial State:**
- If the field is **empty**, the component starts with defaults
- If the field has **existing data**, it loads that saved manifest

**Data Format:**
The field stores the manifest JSON object.

## Adding New Components

To add a new component to Contentful:

1. Create a new directory: `/ui/cms/contentful/[component-name]/`
2. Create `index.html` with Contentful SDK integration
3. Import the original component: `import 'https://browser.style/ui/[component-name]/src/index.js'`
4. Handle Contentful field lifecycle:
   - Initialize with `api.field.getValue()`
   - Save changes with `api.field.setValue(data)`
   - Add validation if needed
5. Follow the setup instructions above to register in Contentful

## Resources

- [Contentful Apps Documentation](https://www.contentful.com/developers/docs/extensibility/app-framework/)
- [Contentful UI Extensions SDK](https://github.com/contentful/ui-extensions-sdk)
- [browser.style Components](https://browser.style/)
