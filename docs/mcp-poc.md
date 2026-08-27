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
| `functions/mcp.js` | The MCP server: a single stateless Streamable-HTTP Pages Function at `/mcp` (no auth, no sessions, no SSE); dummy data inline |
| `_routes.json` | Narrow `include: ["/mcp"]` so the Worker fronts **only** `/mcp` — the other ~300 markdown/demo files stay purely static |
| `_headers` | `/.well-known/*` CORS + short TTL; content-type for the extensionless card |

The endpoint is exactly `/mcp` — `/mcp/` (trailing slash) falls through to static
serving and 404s. Both discovery documents point at the **production** URL
`https://v4.browser.style/mcp` even on preview deployments, by design.

## Testing — discovery half

```bash
curl -i https://v4.browser.style/.well-known/mcp-server-card
curl -i https://v4.browser.style/.well-known/mcp.json
```

Or ask any web-enabled Claude session: *"Does v4.browser.style advertise an MCP
server?"* — it can fetch the card and name the endpoint.

## Testing — live half (claude.ai)

Settings → Connectors → **Add custom connector**, no auth:

1. Try the bare origin `https://v4.browser.style` first — if connector-side
   `.well-known` probing has reached your account, discovery resolves the endpoint
   itself.
2. Otherwise use the explicit endpoint `https://v4.browser.style/mcp`.

Then in a chat: *"Is v4.browser.style open this Friday, and are there tickets?"*
Claude should call `get_opening_hours` and `check_ticket_availability`. The dummy
data has Friday **2026-08-28** open 10:00–22:00 with 14 tickets left for
"CSS Live!"; Mondays closed; 2026-09-05 is a sold-out extended-hours exception;
2026-12-24/25 are closed holidays. Event dates go stale after September 2026.

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

Delete `.well-known/`, `functions/`, `_routes.json`, the two `/.well-known/…`
blocks in `_headers`, and this doc.

## Note

This POC trips the re-check trigger in `docs/llms-txt.md` §7 ("the repo gains a
server or Pages Function → reconsider `Accept: text/markdown` negotiation").
Recorded here; deliberately not acted on while this is a POC.
