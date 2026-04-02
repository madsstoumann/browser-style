---
sidebar_label: 🛠️ Security Config
---

# 🛠️ Security Config 🔴

A **singleton** containing the site's vulnerability disclosure policy, served at `/.well-known/security.txt`.

Schema: [`models/security-config.schema.json`](../models/security-config.schema.json)
CMS location: `Configuration / Security`

---

## Fields

| Field | Type | Widget | Description |
|-------|------|--------|-------------|
| `title` | string | | Editorial label |
| `security_txt` | text | <a href="https://browser.style/ui/editor-security" target="_blank">editor-security</a> | Full `security.txt` content |

---

## What is security.txt?

[`security.txt`](https://securitytxt.org/) is a proposed standard (RFC 9116) that provides security researchers with a machine-readable file describing how to report vulnerabilities for a site. It is served at `/.well-known/security.txt`.

Without it, researchers who discover a vulnerability often have no clear way to contact the right team — leading to delays, public disclosure, or reports being sent to unmonitored inboxes.

### Required fields

| Field | Description |
|-------|-------------|
| `Contact:` | How to report a vulnerability (email with `mailto:`, URL to a reporting form, or phone number) |
| `Expires:` | When this file should be considered stale (ISO 8601 datetime) |

### Optional fields

| Field | Description |
|-------|-------------|
| `Acknowledgments:` | URL to a page recognizing past reporters |
| `Canonical:` | The canonical URL of this `security.txt` file |
| `Encryption:` | URL to a PGP key for encrypted communication |
| `Hiring:` | URL to security-related job openings |
| `Policy:` | URL to the full vulnerability disclosure policy |
| `Preferred-Languages:` | Comma-separated language codes (e.g. `en, da`) |

### Example

```
Contact: mailto:security@example.com
Contact: https://example.com/security/report
Expires: 2027-01-01T00:00:00.000Z
Encryption: https://example.com/.well-known/pgp-key.txt
Acknowledgments: https://example.com/security/thanks
Preferred-Languages: en
Canonical: https://example.com/.well-known/security.txt
Policy: https://example.com/security/policy
```

---

## Visual Editor

The <a href="https://browser.style/ui/editor-security" target="_blank"><code>editor-security</code></a> widget provides a form-based editor for constructing the `security.txt` content. It validates required fields (`Contact`, `Expires`) and formats the output as plain text.

---

## Serving

`security.txt` is served as a route handler that reads from the edge store. The `Content-Type` must be `text/plain; charset=utf-8`.

- [Vercel: security.txt](./vercel.md#securitytxt) — Edge Config + Next.js route handler
- [Cloudflare: security.txt](./cloudflare.md#securitytxt) — KV + Worker route
