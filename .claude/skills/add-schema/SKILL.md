---
name: add-schema
description: Use when adding or modifying a schema.org card type — a new schemaType in the card renderer, a new subtype, new itemprops, microdata or rich-result work, or validating structured data against schema.org or Google Rich Results.
argument-hint: <type, e.g. "recipe" or "Recipe">
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, AskUserQuestion, WebFetch
---

# Adding a schema.org card type

The card system emits **inline microdata** — `itemscope` / `itemtype` / `itemprop` plus
hidden `<meta itemprop content>`. No JSON-LD, no data attributes.

Two sources define a type: `ui/card/render.js` (the renderer) and
`ui/card/demo/schema.html` (the hand-authored reference markup). **The demo page is the
spec**; `ui/card/schema.compare.js` diffs the renderer's output against it card by card and
a mismatch is a hard failure. That comparator has caught a wrong price and a currency
non-breaking space that nothing else would have.

Per-type notes and the existing vocabulary: `ui/card/docs/schema.md`. Google feature
coverage: `ui/card/docs/google-rich-results.md`.

## First: is it a subtype? (no code at all)

If the type is a *specialisation* of one the renderer already handles (e.g. another
`business` or `product` flavour), there is nothing to write in `render.js`:

1. Add the string to the relevant `Set` in the `SUBTYPES` map in `render.js`.
2. Add it to the § Subtypes table in `ui/card/docs/schema.md` — `tokens.lint.js` checks
   both directions.
3. Set `details.subtype` on the instance.
4. `node ui/card/details.build.js` — the editor's subtype dropdowns re-materialize from
   `SUBTYPES` (the manifest's `SUBTYPES.<family>` lookup refs need no edit); commit the
   regenerated `cms/editors/card/src/details.data.js`.

Never interpolate a supplied string into an `itemtype`. Allowlist Sets exist for exactly
that reason.

## The full sequence for a new type

**A. Write the failing test first.** Append a `describe` block to
`ui/card/render.test.js` asserting the emitted `itemtype`, every `itemprop` the renderer
must produce, and that a hostile string in a free-text field comes out escaped.

**B. Watch it fail.** `node --test ui/card/render.test.js` → FAIL. *If it passes, the test
is wrong.*

**C. Snapshot before touching the renderer.**
`node ui/card/render.snapshot.js . /tmp/before.txt`

**D. Add the type to `SCHEMA_TYPES`** in `ui/card/render.js`, keeping the map's grouping,
plus any behaviour-map entries it needs: `HEADLINE_PROP`, `SUMMARY_PROP`, `EYEBROW_PROP`,
`PUBLISHED_PROP`, `TAGS_PROP`, `NO_IMAGE_PROP`, `ARTICLE_BODY_TYPES`, `ROOT_VIDEO_TYPES`,
`DETAILS_OWNS_SUMMARY`, `BYLINE_EARLY`, `SUBHEADLINE_SLOT`, `DETAILS_ACTIONS`,
`HAS_MAP_TYPES`, `WATCHABLE`.

**E. Write the `DETAILS` renderer** — `<key>(d, fields, parts = {}, itemtype = null, owned
= NO_PROPS)`. Follow the neighbours' house style: build a `let html = meta(...)` chain,
append parts, `return html`. **Reuse the existing helpers, do not reinvent them**: `esc`
`meta` `scope` `num` `fmtPrice` `plain` `renderInline` `ratingPart` `listPart` `scopedList`
`addressPart` `geoPart` `hoursPart` `avatarPart` `quotePart` `accordion` `byline`
`datelinePart` `mapCta` `reviewItems` `collagePart`. If the type needs a non-generic reveal
split, add a `REVEAL_FACES` entry.

**F. Run the test until green.**

**G. Data, reference markup, docs, editor.**
1. `ui/card/data/<key>.json` — a UCF instance; copy the envelope from `data/software.json`.
2. Register `"<key>"` in `cards` in `ui/card/data/index.json`.
3. **`ui/card/data/details.json`** — add the type: `label` (the dropdown label), `group`
   (one of the eleven `schema.html` section names — match where the card lands in G.4), and
   its `details` fields (type / control / `lookup` / `shape` refs — see the manifest's
   `$comment` for the field vocabulary). A new enum `Set` in `render.js` must be `export`ed
   and referenced by name; a vocabulary with no `render.js` home goes in the manifest's
   `vocab` block. This is what the card editor renders — a type missing here has no panel.
4. Hand-author the reference card in `ui/card/demo/schema.html`, in the right themed
   section, with `<ui-chip data-type>` as the **last** child of the frame. Give it an `id=`
   only if something links to it.
5. Add a `### <Type> — \`<ItemType>\`` section to `ui/card/docs/schema.md`, and update the
   count paragraphs there and in the page's `<meta name="description">`. A matching
   `### \`<key>\` — <ItemType>` heading + `<!-- details:fields type=<key> -->` marker pair
   in `ui/card/docs/card.model.md` § Per-type details gets its table generated.
6. Add `['<ItemType>', 'ui/card/data/<key>.json']` to `PAIRS` in `ui/card/schema.compare.js`.

`cms/baseline/models/card.schema.json` needs only a hand-bump of `metadata.version` /
`lastModified` — its `schemaType` options and `details` digest are **generated** by
`details.build.js` from the manifest.

**H. Gates.**

```bash
node ui/card/tokens.build.js && node ui/card/tokens.build.js   # 2nd run must be a no-op
node ui/card/tokens.lint.js                                     # tokens lint: ok
node ui/card/details.build.js && node ui/card/details.build.js  # 2nd run must be a no-op (git status clean)
node ui/card/details.lint.js                                    # details.lint: ok — manifest ↔ render.js ↔ corpus ↔ editor
node --test ui/card/render.test.js
node --test cms/editors/card/roundtrip.test.js                  # editor value contract over the corpus
node ui/card/schema.compare.js                                  # every pair transcribes exactly
node ui/card/render.snapshot.js . /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt                             # ONLY the new type's block
```

Commit the regenerated files (`cms/editors/card/src/details.data.js`,
`card.schema.json`, the injected `card.model.md` tables) **with** the manifest edit.

A diff in a pre-existing block means shared code moved — stop and find out why.

**I. Verify the vocabulary against schema.org.** Every `itemprop` must be in its type's
domain. Walk `schema:domainIncludes` against the transitive closure of `rdfs:subClassOf` in
the official dump:

```
https://raw.githubusercontent.com/schemaorg/schemaorg/main/data/releases/<version>/schemaorg-current-https.jsonld
```

Context7 MCP also serves schema.org and Google structured-data docs. Out-of-domain property
→ drop it, do not guess.

**J. Validate the rendered page.** `validator.schema.org` and Google's Rich Results Test
have **no public API** — serve the page locally and drive them with the Playwright MCP
tools, or paste the markup manually. Expect the Rich Results Test to need a public URL for
some checks.

## Scope decisions — settled, do not relitigate

- **Nothing is deleted or deprecated.** Google dropped rich results for `FAQPage`, `HowTo`,
  `SpecialAnnouncement`, `ClaimReview`, `Dataset` and narrowed `Course` — we keep them all.
  The markup stays valid schema.org and remains valuable to AI agents and answer engines
  that read structured data independently of Google SERP features.
- **`ProductGroup` is not a new type** — it is `product` + the subtype map + an optional
  `variants` block. **`EmployerAggregateRating` is not a new type** — it extends `job`.
- **Page-level markup is out of scope**: `ProfilePage`, `BreadcrumbList`,
  `MerchantReturnPolicy`, `ShippingService`, `Speakable`, `MathSolver`.

## Sharp edges

- **The envelope wins.** `envelopeProps()` computes which itemprops the envelope already
  claims and passes them to the `DETAILS` renderer as `owned` — skip those, or the page
  emits a property twice and the comparator fails.
- **`num()` and `fmtPrice()` return already-escaped strings.** Interpolate them bare; a
  second `esc()` double-escapes.
- **Price is `<meta itemprop="price">` plus a text node**, not `<data>`.
- **Two page conventions the renderer deliberately does not reproduce** (normalised by the
  comparator): the page writes `media=` on the `<ui-card>` while the renderer writes it on
  the `<ui-media>`, and the page puts the machine-`<meta>` block above the eyebrow while the
  renderer puts it after the summary. Do not "fix" either side to match.
- `render.js` must stay **Node-safe** — no `document`, no browser globals — and every
  interpolated value passes `esc()`. `renderInline()` is the one exception and its allowlist
  is deliberate.
- **Smoke the editor**: serve the repo and open `cms/editors/card/demo.html` — pick the new
  type from the dropdown (right optgroup?), load its corpus instance, confirm the panel
  renders and the round-trip readout stays byte-equal.
- Commit one type per commit.
