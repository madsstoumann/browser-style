# Zaraz — GA4 page tracking on v4.browser.style

Basic page tracking for the v4 site: **Google Analytics 4** via **Cloudflare Zaraz**,
**pageviews only**, **humans only**, with the built-in consent banner. Nothing ships
from this repo to visitors — Zaraz injects its script into every HTML response **at
the edge** (zone-level auto-inject). The repo's part is config-as-code:
`scripts/zaraz/config.json` mirrors the zone's Zaraz configuration, and
`scripts/zaraz/zaraz.js` moves it in both directions.

Investigated 2026-08-31. **Wrangler cannot manage Zaraz** — it has no `zaraz`
commands (it only meets Zaraz when deploying custom Managed-Component workers,
`custom-mc-*`). The automation surface is the Zaraz Config API:

| Endpoint (under `/zones/{zone_id}/settings/zaraz`) | Does |
|---|---|
| `GET/PUT /config` | read / replace the full configuration |
| `PUT /workflow` | `"realtime"` or `"preview"` |
| `POST /publish` | publish the preview config (body = description string) |
| `GET /export`, `GET /history` | export; version history |

Auth: API token with zone permission **Zaraz: Edit**.

## One-time account setup (dashboard) — done 2026-08-31

Zaraz moved to the ACCOUNT level in Feb 2025: dashboard → **Tag Management →
Tag Setup** → select zone `browser.style` (not the old per-zone Zaraz page).

1. **GA4**: create/reuse a property with a web data stream for
   `https://v4.browser.style`; copy the **Measurement ID** (`G-…`) from
   Admin → Data streams → the stream. **Not the numeric property ID** — the
   Zaraz field accepts either silently, and the wrong one sends every hit
   nowhere (cost an hour of debugging).
2. Tag Setup for `browser.style`:
   - **Add tool → Google Analytics 4**, paste the Measurement ID. Permissions:
     *Client network requests* off, the other three on (client key-value store
     keeps the GA client id — without it every view is a "new user"). Keep only
     the automated **Pageviews** action enabled ("only pageviews" lives here);
     Events + E-commerce off. Tool settings: *Hide Originating IP Address* on,
     and **Blocking Triggers EMPTY** — a blocking trigger *suppresses* the tool
     when it matches, so "Pageview" in that box silently zeroes all tracking
     (the firing trigger lives on the Pageviews action, not here).
   - **Settings → Web API**: *Automatic Pageview Tracking* **on** (it shipped
     unchecked here; the site has no manual `zaraz.track()` calls, so off = no
     events at all).
   - **Consent**: enable Consent Management, create one purpose **Analytics**,
     assign the GA4 tool to it, fill company name/email. The banner then shows
     automatically on first visit; the tool cannot fire before Accept.
   - **Settings → Other** (bottom of the page): *Bot Score Threshold* →
     **Block automated and likely automated**. Leave *E-commerce* and *Single
     Page Application support* **off** (the site is MPA). Workflow stays
     real-time (Save applies immediately; no Publish button appears).
3. **Rules → Configuration Rules**: add `zaraz-v4-only` — expression
   `(http.host ne "v4.browser.style")` → **Zaraz: Off**. Zaraz is zone-wide by
   default; this keeps the apex (old site) untracked.
4. **API token**: My Profile → API Tokens → Create Custom Token → zone
   `browser.style`, permission **Zaraz: Edit**. Zone ID is on the zone Overview page.

```bash
export CLOUDFLARE_API_TOKEN=…   # never committed
export CLOUDFLARE_ZONE_ID=…
```

## The config-as-code loop

```bash
node scripts/zaraz/zaraz.js pull            # live config -> scripts/zaraz/config.json
node scripts/zaraz/zaraz.js push            # config.json -> preview
node scripts/zaraz/zaraz.js publish -m "…"  # preview -> live
node scripts/zaraz/zaraz.js status          # workflow + recent versions
```

- After the dashboard bootstrap (and after ANY later dashboard change): `pull`,
  review, commit. `config.json` is the source of truth between dashboard sessions.
- Repo-side change: edit `config.json` → `push` → `publish`. With the workflow on
  *Preview & Publish*, `push` never goes live by itself.
- `config.json` holds no secrets — the GA4 measurement ID is public by nature
  (visible in any GA-tagged page).

## Why only humans get counted (three layers)

1. **`settings.botScoreThreshold: 29`** — requests scoring as automated / likely
   automated never get the Zaraz script injected: no load, no event, no quota.
   Without a Bot Management subscription the dependable band is verified/definite
   bots (score 1 — Googlebot, Bing, etc.); the 2–29 "likely" band is best-effort.
2. **Consent gating** — GA4 is assigned to the Analytics purpose, so it fires only
   after Accept. Bots never consent, so even a bot that executes JS produces no GA
   hit.
3. **GA4's own filtering** — known bots/spiders are excluded from reports.

Billing: every event *received* by Zaraz (a pageview) counts — 1,000,000/month free
per account, then $5 per additional million. Layer 1 is what protects the quota;
layers 2–3 protect the data.

## Verification (all passed 2026-08-31)

1. `pull` succeeds; `config.json` shows `settings.autoInjectScript: true`,
   `settings.botScoreThreshold: 29`, one GA4 tool with only the Pageviews action
   and NO blocking triggers, `consent.enabled: true`, and the tool assigned to
   the Analytics purpose.
2. https://v4.browser.style: the edge injects an inline loader that fetches
   `/cdn-cgi/zaraz/s.js?z=<payload>` — the payload IS the pageview (url, title,
   screen). Banner on first visit; nothing dispatched before Accept; after
   Accept the pageview lands in GA4 Realtime (check *Views by Page title* to
   distinguish real traffic from test hits); no banner on later loads. The GA
   call happens edge-side — the browser never contacts Google, so DevTools
   showing "only s.js" is the healthy state, not a failure.
3. `curl -s https://browser.style/ | grep -c cdn-cgi/zaraz` → `0` (Configuration
   Rule keeps the apex clean). Note: injection also requires a browser-like
   `Accept: text/html` header — plain `curl`/scrapers with `Accept: */*` get
   uninjected HTML, a free bot layer before the score threshold.
4. Limit: bot blocking can't be proven locally — a headless browser or spoofed UA
   may still score human without Bot Management. Trust the config value + the
   event count trend in the Zaraz dashboard (Monitoring).
5. GA-leg isolation trick: a raw
   `curl 'https://www.google-analytics.com/g/collect?v=2&tid=G-…&cid=1&en=page_view&dl=…'`
   (expect 204) proves the property/stream receives, independently of Zaraz.

## Out of scope (parked)

- Event-level unique-pageview dedupe — would need a client script on every page
  (439 of them) or a paid edge injector (Snippets = Pro+); GA4 already reports
  uniques (users/sessions) natively.
- Custom events, e-commerce, SPA/History-Change tracking.
