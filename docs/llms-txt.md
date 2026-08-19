# llms.txt, markdown alternates and AI agents

What this repo serves for machine consumers, what the evidence says it is worth, and
which parts of the 2026 "make your site visible to LLMs" advice we deliberately declined.

Audited 2026-08-19. Every claim below is dated, because this area moves and most of the
public advice is written as if it does not.

> **Short version.** `llms.txt` is not read by AI answer engines, and Google Search
> ignores it — but Lighthouse audits it, so we keep it. The
> `<link rel="alternate" type="text/markdown">` tag has no measured readership; we ship
> it anyway on the pages where a real doc already exists, because the `.md` files were
> already being served and the tag costs one line. Content negotiation
> (`Accept: text/markdown`) is the only mechanism with real, growing traffic, and it is
> the one this repo cannot use on static hosting.

---

## 1. The two claims, and what the evidence actually supports

| Claim | Verdict | Basis |
|---|---|---|
| Crawlers read `<link rel="alternate" type="text/markdown">` | **Unsupported** | The article making the claim concedes there is no evidence crawlers read it |
| Coding agents send `Accept: text/markdown` | **True, narrow** | 3 of 7 agents measured (Feb 2026) |
| AI *crawlers* use content negotiation | **False** | "No AI crawler uses content negotiation. Not one." (Jan 2026) |
| AI answer engines fetch `llms.txt` | **False** | 52 requests in a month, all from SEO audit tools |
| Google Search ignores `llms.txt` | **True** | Google's own AI-optimization guide |
| Lighthouse rewards `llms.txt` | **True** | Agentic Browsing, default config since 13.3.0 |

### 1.1 Content negotiation — real, but only from user-driven agents

Checkly tested seven coding agents in February 2026:

| Agent | `Accept` header sent |
|---|---|
| Claude Code 2.1.38 | `text/markdown, text/html, */*` |
| Cursor 2.4.28 | `text/markdown,text/html;q=0.9,…` |
| OpenCode 1.2.5 | `text/markdown;q=1.0, text/x-markdown;q=0.9,…` |
| OpenAI Codex | *(no markdown)* |
| Gemini CLI 0.28.2 | `*/*` |
| GitHub Copilot | *(no markdown)* |
| Windsurf 1.9552.21 | `*/*` |

Three of seven. Independently, a 44-day log study (Mar–Apr 2026) counted 1,421 requests
carrying `Accept: text/markdown`, 35% of them from Anthropic infrastructure. So the
traffic is real and growing — but it is **user-initiated agent fetches**, not indexing.

### 1.2 Crawlers — no content negotiation, but they do fetch `.md` URLs

A month of Cloudflare logs (Jan 2026, 57,279 bot requests) found **zero** use of content
negotiation, yet substantial direct `.md` fetching once such URLs exist and are linked:

| Bot | `.md` requests | Share of its traffic |
|---|---|---|
| Amazonbot | 1,840 | 10.9% |
| OAI-SearchBot | 1,300 | 22.7% |
| GPTBot | 1,177 | 34.8% |
| ChatGPT-User | 8 | 0.1% |
| Bytespider, CCBot, PerplexityBot | 0 | 0% |

Note the two findings sit in tension across sources: one CDN analysis reported *zero*
`.md` requests from GPTBot/ClaudeBot/PerplexityBot even when listed in `llms.txt`, while
the log study above shows GPTBot spending a third of its budget on `.md`. **The evidence
is site-dependent and not settled.** Treat any confident claim in either direction as
unproven.

The same study measured crawl efficiency at **1,241 pages fetched per citation emitted**,
which is the strongest argument for this repo's restrictive `robots.txt`.

### 1.3 `llms.txt` — nobody reads it except auditors

52 requests in one month, and "Every one came from SEO audit tools. Not a single request
came from an AI answer engine or crawler."

---

## 2. Why Google says two opposite things

Both statements are real, current, and not actually contradictory — they come from
different products measuring different things.

**Google Search** ([AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide#mythbusting)):

> You don't need to create new machine readable files, AI text files, markup, or Markdown
> to appear in Google Search […] Doing so will neither harm nor help your site's
> visibility or rankings in Google Search, as Google Search ignores them.

**Google Lighthouse** shipped an **Agentic Browsing** category that explicitly audits for
`llms.txt`, moved from experimental into the **default config** in Lighthouse 13.3.0
(7 May 2026), with PageSpeed Insights and Chrome 150 DevTools following.

John Mueller resolved it directly:

> The short answer is that it's not done for search. There's more to websites than just
> SEO :-)

…distinguishing **discovery** (ranking, which ignores the file) from **functionality**
(an agent trying to use your reference material efficiently, which is what the audit
measures). For a component library that exists to be *used by* coding agents, the second
concern is the relevant one.

---

## 3. The Lighthouse Agentic Browsing audit

Four checks, reported as a fractional pass-ratio rather than a 0–100 score, because
"the standards for the agentic web are still emerging":

| Audit | Checks |
|---|---|
| `llms.txt` | Exists, and follows the recommended shape |
| WebMCP | Forms carry declarative WebMCP annotations; registered tools surfaced |
| Accessibility for agents | The accessibility tree is well-formed |
| Layout stability | CLS |

### 3.1 Exact `llms.txt` pass conditions

From the audit implementation, not from blog summaries:

| Condition | Rule |
|---|---|
| Fetch | Non-5xx; a fetch failure scores 0 |
| H1 | Matches `^\s*#\s+.+` |
| Link | At least one `\[.+\]\(.+\)` — a **markdown** link |
| Length | ≥ 50 characters |

Content-type is **not** enforced. The common failure is a link list written as bare URLs
or dashes: the parser does not count those as links at all.

### 3.2 This repo's status

`/llms.txt` passes all three content conditions:

| Condition | Value |
|---|---|
| H1 | `# browser.style` ✅ |
| Markdown links | 3 ✅ |
| Length | 898 chars ✅ |

**But it only passes on one host.** See § 5.

---

## 4. What this repo serves, and why

### 4.1 `.md` is already a first-class response

Cloudflare Pages serves every markdown file in the repo — 294 of them — at its natural
path with the correct type:

```
GET https://v4.browser.style/ui/card/docs/media.md
200  content-type: text/markdown; charset=utf-8
```

No build step, no route, no middleware. This is why the markdown-alternate work was cheap:
the endpoints already existed and were already correct; only discovery was missing.

### 4.2 The crawler posture is deliberate, and now has a carve-out

`robots.txt` blocks ~180 AI user-agents from the site with a narrow allow-list. That
remains the policy for **training and scraping** crawlers — at 1,241 fetches per citation,
they cost far more than they return.

The audit found a contradiction, however: the blocked list included `Claude-Code`,
`Cursor` and `opencode` — precisely the three agents measured to request markdown, and
precisely the audience a v4 component library wants reading its reference, since the
whole point is agents emitting correct v4 markup. `llms.txt` advertised the schema page
as "machine-readable reference markup" while `robots.txt` told those readers to go away.

Resolved by splitting the single group in two: coding agents get the documentation trees,
training crawlers keep `Disallow: /`. See `robots.txt`.

### 4.3 Markdown alternates

`<link rel="alternate" type="text/markdown" href="…">` is on the card demo pages that
have a genuine documentation counterpart, pointing at the already-served `.md`. It is
**not** applied where no such doc exists, and no `.md` renditions of demo pages were
generated — a demo page is a CSS demonstration, and prose is not an alternate
representation of it.

The tag is shipped on weak evidence and known to be so. The justification is cost, not
proof: one line per page, pointing at a file that was already public and already correct.

---

## 5. Open issue: the apex domain fails the audit

| Host | `robots.txt` | `llms.txt` |
|---|---|---|
| `v4.browser.style` (Cloudflare Pages, `v4` branch) | repo file + Cloudflare managed content appended (6,006 B) | **200** ✅ |
| `browser.style` (apex) | Cloudflare *managed content only* (1,836 B) | **404** ❌ |

`robots.txt` and `llms.txt` exist only on the `v4` branch. The apex serves neither, so the
production domain fails the Lighthouse `llms.txt` audit and carries none of the crawler
policy above — only Cloudflare's own managed block-list.

Worth noting Cloudflare **appends** its managed robots content to ours rather than
replacing it (4,170 + 1,836 = 6,006), so the two layers stack on `v4`.

Fixing this is a deployment decision, not a code one: either promote both files to the
branch the apex serves, or accept that the apex is the legacy site.

---

## 6. Deliberately not done

| Rejected | Why |
|---|---|
| `Accept: text/markdown` content negotiation | Needs a server. Cloudflare Pages `_headers` cannot vary a response body by request header. This is the mechanism with the best evidence and we cannot use it on static hosting. |
| HTTP `Link:` header for the alternates | `_headers` supports path placeholders, but is capped at 100 rules and there is no 1:1 path mapping from demo to doc. Cost exceeds any measured benefit. |
| `.md` renditions of demo pages | Demo pages demonstrate CSS. A markdown rendering of a carousel is noise. The docs already *are* the markdown. |
| `llms-full.txt` | No measured readership for `llms.txt` itself; a concatenated variant multiplies the maintenance without changing that. |

`cms/baseline` specifies a full markdown-endpoint system (`{url}.md`, `includeInMarkdown`,
generated `llms.txt`/`llms-full.txt`) for CMS-backed sites — that is a different context,
where pages are content rather than demonstrations.

---

## 7. Re-check triggers

This file records a 2026-08-19 reading of a moving target. Revisit if any of these change:

- A major provider publicly commits its **crawler** to content negotiation (would make
  `.md` addressing worth automating).
- Lighthouse Agentic Browsing leaves "under development", or its `llms.txt` audit starts
  enforcing content-type or structure beyond the three conditions in § 3.1.
- Google Search reverses its position on machine-readable files.
- The repo gains a server or Pages Function — at which point `Accept: text/markdown` is
  cheap and should be reconsidered first, being the best-evidenced mechanism.

### Verifying the current state

```bash
# llms.txt against the three Lighthouse conditions
curl -s https://v4.browser.style/llms.txt | tee /dev/stderr | \
  python3 -c "import sys,re; s=sys.stdin.read(); \
print('H1', bool(re.search(r'^\s*#\s+.+',s,re.M)), \
'link', bool(re.search(r'\[.+\]\(.+\)',s)), 'len', len(s)>=50)"

# markdown endpoints still serve as text/markdown
curl -sI https://v4.browser.style/ui/card/docs/media.md | grep -i content-type

# the apex gap
curl -so /dev/null -w '%{http_code}\n' https://browser.style/llms.txt   # 404 today
```

---

## Sources

- [Checkly — The Current State of Content Negotiation for AI Agents (Feb 2026)](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/)
- [Dries Buytaert — Markdown, llms.txt and AI crawlers (Jan 2026 logs)](https://dri.es/markdown-llms-txt-and-ai-crawlers)
- [44 days of markdown-request tracking (Mar–Apr 2026)](https://suganthan.com/blog/cloudflare-markdown-for-agents/)
- [Google — AI features and your website (mythbusting)](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide#mythbusting)
- [Chrome — Lighthouse agentic browsing scoring](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring)
- [Search Engine Land — Google adds llms.txt check to Lighthouse (Mueller quote)](https://searchengineland.com/google-llms-txt-chrome-lighthouse-478246)
- [Evil Martians — How to make your website visible to LLMs](https://evilmartians.com/chronicles/how-to-make-your-website-visible-to-llms)
- [llmstxt.org](https://llmstxt.org/)
