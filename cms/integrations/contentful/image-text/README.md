# Image Text (Alt Text) — Contentful App

AI-powered alt text and long description generator for Contentful assets.

## App Definition Setup

1. Go to **Apps > Manage Apps > Create App** (or edit existing)
2. Set **App URL** to: `https://browser.style/cms/integrations/contentful/image-text/`
3. Under **Locations**, enable **Entry sidebar**
4. Under **Installation parameters**, add:

| Parameter   | Type       | Display Name | Description                                      |
|-------------|------------|--------------|--------------------------------------------------|
| `workerUrl` | Short text | Worker URL   | Image analysis API endpoint (e.g. `https://your-worker.workers.dev`) |
| `apiKey`    | Short text | API Key      | Authentication key for the worker API            |

5. Save the app definition
6. Install the app in your space

## Configuration

After installing, go to **Apps > Manage Apps > Configure** and set:

- **Worker URL** — the endpoint for your image analysis worker
- **API Key** — the secret key for authenticating with the worker

These values are stored as installation parameters and apply to all assets in the space.

## How It Works

The app appears in the **sidebar** when editing any asset. It:

1. Reads the asset's image from the `file` field
2. Sends it to the worker API for analysis
3. Writes the generated alt text to the asset's **Title** field
4. Writes the long description to the asset's **Description** field

Editors can also manually edit both fields after generation.
