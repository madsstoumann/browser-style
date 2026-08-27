# MCP discovery POC — `.well-known` + `/mcp`

A **disposable proof of concept**: v4.browser.style advertises an MCP server via
`.well-known` discovery documents, and serves a working dummy MCP server for a
fictional ticketed venue ("browser.style Studio") with **static, hardcoded data**.
The target scenario is a ticket-selling client; this domain is just the testbed.
Remove the whole thing with § Removal below.

## Status of the "standard" (as of 2026-08)

Auto-discovery — a client resolving a bare domain to a connectable MCP endpoint —
is the goal, but not yet a ratified part of the MCP spec. Two conventions coexist:

- **`/.well-known/mcp-server-card`** — the draft-standard path from SEP-2127
  ("MCP Server Cards", Anthropic-authored, running alongside the 2026-07-28 spec
  release candidate). JSON with `$schema`, `name`, `version`, `description` and a
  `remotes: [{ type: "streamable-http", url }]` array naming the endpoint. Served
  with `Content-Type: application/json` (set in `_headers` — the file is
  extensionless). **This is the primary document here.**
- **`/.well-known/mcp.json`** — the popular pre-standard convention (SEP-1960
  manifest lineage) many clients and writeups probe. Kept as an alias carrying the
  same endpoint.

Claude clients already probe `.well-known` paths around a configured connector URL
(OAuth protected-resource metadata, transport detection); a shipped bare-domain →
full auto-discovery flow is not yet confirmed on any Claude surface. Expect the
path/shape to move when a SEP is ratified — that is the point of a POC.

## File inventory

| File | Role |
|---|---|
| `.well-known/mcp-server-card` | SEP-2127 server card (primary discovery document) |
| `.well-known/mcp.json` | Popular-convention alias manifest |
| `api/venue-availability.json` | **The single source of all dummy data** (2.7 KB): weekly hours, exceptions, events, and per-day ticket counts for 2026-08-01 – 2027-08-31; served statically, read by the Function via the ASSETS binding |
| `functions/mcp.js` | The MCP server: a single stateless Streamable-HTTP Pages Function at `/mcp` (no auth, no sessions, no SSE) — a thin protocol wrapper over the JSON above; plus the GET bridge below |
| `_routes.json` | Narrow `include: ["/mcp"]` so the Worker fronts **only** `/mcp` — the other ~300 markdown/demo files stay purely static |
| `_headers` | `/.well-known/*` CORS + short TTL; content-type for the extensionless card; `Link` discovery header on `/` |
| `index.html` | `<link rel="mcp-server-card" …>` in the head |
| `llms.txt` | § MCP server — the advertisement agents actually read |
| `robots.txt` | `Allow: /.well-known/` + `Allow: /mcp` in both agent groups — without these, robots-respecting fetchers (claude.ai's `Claude-User` included) were blocked from the discovery chain |

The endpoint is exactly `/mcp` — `/mcp/` (trailing slash) falls through to static
serving and 404s. Both discovery documents point at the **production** URL
`https://v4.browser.style/mcp` even on preview deployments, by design.

## Agentic auto-discovery (works today)

The chain a web-enabled agent can walk unaided, no connector configured:

1. Fetch `https://v4.browser.style/` (sees the `<link rel="mcp-server-card">` /
   `Link` header) or `llms.txt` (§ MCP server) — robots.txt permits it.
2. Fetch `/.well-known/mcp-server-card` → `remotes[0].url` names the endpoint.
3. Call tools: POST JSON-RPC for agents that can (Claude Code via curl), or the
   **GET bridge** for GET-only agents (claude.ai web fetch):
   - `GET /mcp` → JSON self-description (server, tools, examples)
   - `GET /mcp?tool=get_opening_hours&date=2026-08-28`
   - `GET /mcp?tool=check_ticket_availability&date=2026-08-28`

The GET bridge is a **POC affordance outside the MCP spec** — read-only, same tool
implementations, same `isError` semantics. POST JSON-RPC remains the real MCP
endpoint.

**Test it:** in claude.ai with web search/fetch enabled, ask
*"Is v4.browser.style open this Friday? Check whether the site advertises an MCP
server."* The plain question alone may work; the nudge makes it deterministic.
In Claude Code, the plain question suffices — it can curl the full handshake.
Whether an unnudged model chooses to go fetch is probabilistic; that
unpredictability is precisely what client-native SEP-2127 discovery will remove.

The dummy data covers **every day from 2026-08-01 to 2027-08-31** (per-day
ticket counts, deterministically generated: closed days 0, ~8% of open days
sold out, ~10% low stock 1–4). Useful probe questions and their expected
answers:

| Question | Expected |
|---|---|
| "Is v4.browser.style open this Friday, and are there tickets?" | 2026-08-28 (Fri) open 10:00–22:00, 40 day tickets + "CSS Live!" event, 14 of 120 at 150 DKK |
| "Is v4.browser.style open on May 1st 2027?" | Open (Sat) 09:00–22:00, 65 day tickets |
| "Can I buy 2 tickets on September 2nd 2026?" | Open, but SOLD OUT — 0 day tickets left |
| "Can I buy 2 tickets on September 8th 2026?" | Only **1** day ticket left — so no |
| Any Monday, or 2026-12-24/25 | Closed — no tickets sold |
| A date after 2027-08-31 | "No availability data for … (data covers 2026-08-01 to 2027-08-31)" |

Data goes stale after August 2027. To regenerate with different randomness,
adjust and re-run the seeded generator (mulberry32, seed 42) described in the
git history of `api/venue-availability.json`.

## The spec-pure path (claude.ai connector)

Settings → Connectors → **Add custom connector**, no auth:

1. Try the bare origin `https://v4.browser.style` first — if connector-side
   `.well-known` probing has reached your account, discovery resolves the endpoint
   itself.
2. Otherwise use the explicit endpoint `https://v4.browser.style/mcp`.

Then ask the same question in a chat; Claude calls the tools over real MCP.

## curl handshake

```bash
MCP=https://v4.browser.style/mcp
curl -s $MCP -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
curl -s $MCP -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
curl -s $MCP -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_ticket_availability","arguments":{"date":"2026-08-28"}}}'
```

## Preview vs production

Pushing a non-`v4` branch produces a Cloudflare Pages *preview* deployment (alias
on `*.browser-style-v4.pages.dev`); the Function and discovery files work there
relative to the preview origin, but the URLs *inside* the documents stay
production. Everything goes live on merge to `v4`.

## Removal

Delete `.well-known/`, `functions/`, `api/`, `_routes.json`; in `_headers` the
`/.well-known/…` blocks, the `/` Link-header rule and the `/api/…` rule; in
`index.html` the `rel="mcp-server-card"` link; in `llms.txt` the § MCP server
section; in `robots.txt` the `Allow: /.well-known/`, `Allow: /mcp` and
`Allow: /api/venue-availability.json` lines (both groups); and this doc.

## Note

This POC trips the re-check trigger in `docs/llms-txt.md` §7 ("the repo gains a
server or Pages Function → reconsider `Accept: text/markdown` negotiation").
Recorded here; deliberately not acted on while this is a POC.
