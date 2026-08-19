---
name: add-card-token
description: Use when adding, renaming, or changing a token in the card DSLs — editing ui/card/data/tokens.json, token needles in ui-card.css/media.css/content.css or their satellites, tokens.build.js or tokens.lint.js — and whenever tokens.lint.js reports an error.
argument-hint: <axis and token, e.g. "media: new frame(hex) stem">
allowed-tools: Read, Edit, Bash, Glob, Grep, AskUserQuestion
---

# Changing the card token vocabulary

**`ui/card/data/tokens.json` is the source of truth.** It generates `data/tokens.data.js`
(the renderer's import), `ui/card/docs/tokens.md`, and the marker-injected
`<!-- tokens:… -->` tables inside the hand-written docs of `ui/card` **and** `ui/reveal`.
Never edit a generated file or anything between those markers — the next build reverts it.

This is a **gated** change: the manifest and the CSS must agree in both directions, and the
renderer's output must not move unless you meant it to. Run the sequence in order.

## The sequence

```bash
# 1. Snapshot BEFORE touching anything — an after-only snapshot proves nothing
node ui/card/render.snapshot.js . /tmp/before.txt

# 2. Edit data/tokens.json AND the CSS needle together (see "What to edit" below)

# 3. Regenerate — twice; the second run must be a no-op (generation is idempotent)
node ui/card/tokens.build.js && node ui/card/tokens.build.js
git status --porcelain          # second run changed nothing? good.

# 4. Lint — five invariants: substring shadowing, needle↔manifest both ways,
#    tokens.data.js sync, the NOT_SLIDE mirror, SUBTYPES ↔ docs/schema.md
node ui/card/tokens.lint.js     # expect: tokens lint: ok

# 5. Renderer suite
node --test ui/card/render.test.js

# 6. Snapshot AFTER, and diff
node ui/card/render.snapshot.js . /tmp/after.txt && diff /tmp/before.txt /tmp/after.txt
```

Step 6 must be **empty** unless changing renderer output was the point — then justify every
differing block. A diff you did not expect means shared code moved: stop and find out why.

Then: verify in a real browser (fresh port; the demo pages link a bundle, so use the
`demo-css` dev loop), add demo coverage for the new token on the relevant
`ui/card/demo/*.html` page, and update the hand-written prose near the token **in the same
change**.

## What to edit

A token entry in the manifest carries: `axis`, `element`, `args` (the arg vocabulary per
class: `pos hue mode size disc face anim shape flag value variant ratio`), `argAliases`,
`bare`, `matching` (`"substring"` | `"whole"`), `writes` (the custom properties), `hosts`,
`requiresJs`, `cqPrefixes` (whether `md:`/`lg:` forms exist), `sources` (file:line), `notes`
(these feed the generated docs).

The CSS side is an attribute selector whose needle must match the manifest exactly —
`[media*="asr("]` for substring stems, `[media~="clip"]` for whole-token bare flags.

## Design rules

- **Whole vs substring matching is deliberate per token.** Bare flags (`loop`, `auto`,
  `pages`, `clip`, `stagger`) are whole-token so they cannot cross-fire with parameterised
  cousins. Parameterised stems are substring, made safe by the closing paren.
- **Never let one stem shadow another as a substring** (`open:nav` inside a substring-matched
  `nav` is the classic). The lint catches it — design around it rather than discovering it.
- **Arg vocabularies within a stem must stay disjoint** so `hl(lg)` (size), `hl(600)`
  (weight) and `hl(serif)` (font) parse unambiguously on one stem.
- **A token affecting carousel slides must mirror `NOT_SLIDE`** in `ui/card/shared.js` and
  `ui/carousel/polyfill/carousel.js` — drift is a lint error, by design.
- **Placement tokens use the one logical grid** (`ts tc te / cs cc ce / bs bc be`) resolved
  through the shared `--_dir-s`/`--_dir-e` pair in `ui/base/core.css`. Never add a
  per-family `:dir(rtl)` arm; `ui/card/demo/media.rtl.html` is the regression target.
- **CSS comments are one-line markers.** The reasoning belongs in `ui/card/docs/*.md`. The
  lint strips comments before its needle audit, so trimming prose can never break it.

## Sharp edges

- **Do not migrate `tnt` / `hov(tint)` to `@container style()`.** It was tried and reverted:
  WebKit does not evaluate a pseudo-element's style query against its originating element at
  first paint, so tinted frames rendered untinted until first hover. `media.tint.css` carries
  the guardrail comment; both arms stay.
- **Presets are validated, markup is not.** `tokens.lint.js` checks every token string in
  `data/card.presets*.json` — an unknown token there is a hard error — but hand-written HTML
  is unchecked. Adding a token does not retroactively fix pages using the old spelling.
- **Renaming a token is a repo-wide sweep**: the manifest, the CSS needle, preset JSON, demo
  HTML *and* any app CSS hooking the attribute value (`[md~="subgrid"]`-style selectors live
  outside this package too). Grep `*.css` as well as `*.html`.
