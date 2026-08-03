# Unify `ui/card` furniture placement on one logical grid

## Context

The card system claims "one position grid" (`ui/card/AGENTS.md` §7), but the
implementation has drifted three ways:

1. **`obp()` ships two spellings for the same nine cells** — physical
   `tl tr cl cr bl br` and logical `ts te cs ce bs be` (`tc`/`cc`/`bc` are shared).
   `tl` vs `ts` differ by one letter and mean the same thing. A usage census shows
   the physical set carries *all* the weight (113 hits for `obp(cc)`, a canonical
   preset, 9 demo cards) and the logical set has **zero** usage outside its own
   13 CSS rules and one prose line.

2. **Four families invent their own direction words** instead of using the grid:
   `marquee(top|bot)`, `flp(top|btm|lft|rgt)`, `sld(top|btm|lft|rgt)`. Counting
   raw CSS too, the system currently has 6 spellings for "block-end" and 4 for
   "inline-start".

3. **`mrk()` and `arw()` lie about being logical.** They accept the logical cells
   but are implemented with `left`/`right` + `anchor(left|right)` and
   `::scroll-button(left|right)` (`ui/base/carousel.css:467-531`, `:740-832`,
   `:887-899`). So on an RTL page `chip(ts)` pins top-**right** while `mrk(ts)`
   pins top-**left**, and the arrows' `Previous`/`Next` labels are swapped.
   `polyfill/carousel.css:622` already ports these to `inset-inline` — the
   polyfill is RTL-correct and the native path is not.

**Outcome:** one vocabulary, spelled the same everywhere, that behaves the way it
is spelled — plus one openly-physical exception (`obp()`) that is physical for a
real reason and documented as such.

### The model

Cell = `<block><inline>`, block ∈ `t c b` (block-start / centre / block-end),
inline ∈ `s c e` (inline-start / centre / inline-end):

```
ts  tc  te
cs  cc  ce
bs  bc  be
```

Families use **subsets** of this one grid, never their own words:

| subset | cells | used by |
|---|---|---|
| full 9 | all | `scm` `chip` `sticker` `save` `play` `beacon` `lightbox` `ovr` `plc` `mrk` |
| 8 (no `ce`) | — `ce` | `arw` (inline-end is `arw(set)`'s default — deliberate, documented) |
| 6 edges+corners | `ts te cs ce bs be` | sticky `play`/`lightbox` in a scroller |
| 4 corners | `ts te bs be` | `grw` `ico` `icc` |
| 4 sides | `tc bc cs ce` | `flp` `sld` **(new)** |
| 2 block sides | `tc bc` | `marquee` **(new)** |

"A side" is the edge-centre cell of that side. That is what removes
`top/btm/lft/rgt` without inventing anything.

**Answer to the `object-fit` / `object-position` question:**
`obf(cover|contain|fill|none)` are the CSS keywords for `object-fit` verbatim —
not positions, leave alone. `object-position` *is* a position, but a position in
the **image's own coordinate space**, not in layout flow: a portrait's face does
not move when the page reads right-to-left, so mirroring the crop on document
direction is wrong. CSS `<position>` has no logical keywords at all — the
`:dir(rtl)` arms were the only way to fake them. So `obp()` stays **physical-only**
and becomes the system's one deliberately-physical family.

Bands (`nav|mrk|arw (blw|abv)`) stay as they are: they place a strip *outside* the
frame on the block axis only, a different axis from an in-frame cell, and they
have ~400 usages. Document the distinction; do not rename.

---

## Change 1 — `obp()` → physical only

Delete the six logical spellings and all six `:dir(rtl)` arms.

- `ui/card/media.css:82-106` — drop lines 93-106 (13 rules + the "logical
  spellings" and "rtl" comments); rewrite the header comment at `:82-83` to state
  that `obp()` is the system's only physical vocabulary and why (focal point lives
  in image space).
- `ui/card/data/tokens.json`, `obp` entry (~`:53-96`) — `args.pos` becomes
  `tl tc tr cl cc cr bl bc br`; rewrite `notes` (it currently documents the
  two-vocabulary design); fix the stale `sources` (claims `media.css:77,87,96`,
  actual is `media.css:84-92`).
- `ui/card/media.md:241` — the one prose line naming `obp(ts)`.

Zero demo/preset churn: nothing uses the logical spellings.

## Change 2 — normalize `marquee` / `flp` / `sld` onto grid cells

Hard rename, no aliases.

| old | new |
|---|---|
| `marquee(top)` | `marquee(tc)` |
| `marquee(bot)` | `marquee(bc)` |
| `flp(top\|btm\|lft\|rgt)` | `flp(tc\|bc\|cs\|ce)` |
| `sld(top\|btm\|lft\|rgt)` | `sld(tc\|bc\|cs\|ce)` |

**CSS**
- `ui/card/media.css:185-188` — rename needles; rename the `--_mrq` flag values to
  `tc`/`bc` to match (internal flag, listed in the boundary registry at `:15`,
  values are free).
- `ui/reveal/ui-reveal.css:46-47` (dispatch), `:303-331` (flip rotations),
  `:410-423` (slide translates) — rename needles.
- `flp(rgt)` currently has **no geometry rule** (it silently equals bare `flp`).
  Add the explicit `flp(ce)` rule so no declared arg is unimplemented.
- **RTL arms for the new inline cells** (this is the point of the rename):
  `sld(cs|ce)` uses `translate: ±100% 0` and `flp(cs|ce)` uses `rotateY(±180deg)`
  — both physical. Add `:dir(rtl)` arms (or drive the sign through a
  `--_sld-x` / `--_flp-y` var flipped in one `:dir(rtl)` rule) so the logical
  spelling is honest.

**Renderer** — one line. `ui/card/render.js:266`:
```js
const FRM_TOKEN = { top: 'top', bottom: 'btm', left: 'lft', right: 'rgt' };
//              → { top: 'tc',  bottom: 'bc',  left: 'cs',  right: 'ce'  };
```
Preset JSON and `cms/baseline/models/card-preset.schema.json` keep their friendly
editor words (`"left"`, `"top"`) — only the map changes. `RVL_DIRECTED`
(`render.js:269-272`) is derived from the manifest's `args.pos`, so it follows
automatically.

**Call sites to migrate** (grep `marquee(bot)`, `flp(`, `sld(` — small):
`ui/card/media.furniture.html:142,152` · `ui/reveal/index.html:790,812,834,856,883,899,916`
· `ui/card/data/card.presets.demo.json` · `ui/card/card.md:225` ·
`ui/card/media.md`, `ui/card/readme.md`, `ui/reveal/plan.md`,
`ui/reveal/readme.md`, `layout/AGENTS.md`, `docs/design-system-agent.md`.

`tokens.lint.js` check 5 validates both preset collections, so a missed preset
token fails the build. Demo `.html` and `data/demo/*.json` are **outside** the
lint's net — grep them by hand.

**Note, out of scope:** `marquee`'s `value` args (`right up down`) are the
marquee's own *scroll* direction inside `ui/marquee`, a different axis from band
placement, and already carry an RTL arm (`ui/marquee/ui-marquee.css:69-70`).
Leave them.

## Change 3 — make `mrk()` / `arw()` actually logical

**Gate this on browser verification first** (see Verification): confirm Chromium
and Safari support logical `anchor(start|end)` and logical
`::scroll-button(inline-start|inline-end|block-start|block-end)`. If either fails,
fall back to keeping the physical properties and adding `:dir(rtl)` arms — the
observable behaviour is the same, the byte cost is higher.

In `ui/base/carousel.css`:
- `:467-483` — `::scroll-button(left|right)` → `::scroll-button(inline-start|inline-end)`,
  `::scroll-button(up|down)` → `block-start|block-end`; this also fixes the
  swapped `content: "" / "Previous"` labels in RTL. `left:`/`right:` +
  `anchor(left|right)` → `inset-inline-start:`/`inset-inline-end:` + `anchor(start|end)`.
- `:494-531` — `arw(set)` cluster: same substitution (four blocks).
- `:605-660` — `axis(y)` verticals: check whether the block-axis buttons need the
  same treatment.
- `:740-790` — `mrk()` 9-cell placement: `left`/`right` + `anchor(left|right)`
  → `inset-inline-*` + `anchor(start|end)`. `justify-self: start|end` already on
  these rules is correct and stops being contradicted.
- `:791-832` — in-band dot alignment; `:887-899` — `mrk(bar)` edge pinning.
- `:703-738` — `mrk(rail)`: its explicit `:dir(rtl)` arm at `:733-738` becomes
  **removable** once the base rule is logical.

`polyfill/carousel.css:622` is the working reference for the target form.
`polyfill/carousel-controls.js` is unaffected — it builds `data-nav="prev|next"`
buttons and measures DOM rects, never the pseudo keywords.

## Change 4 — manifest + regeneration

Hand-edit `ui/card/data/tokens.json` only: `obp.args.pos`, `marquee.args.pos`,
`flp.args.pos`, `sld.args.pos`, and the `notes` on each (the notes are what feed
the generated tables and are currently the only place the two-vocabulary design is
explained). Then:

```
node ui/card/tokens.build.js   # run twice — second run must be a no-op
node ui/card/tokens.lint.js
```

Regenerated, never hand-edited: `ui/card/data/tokens.data.js`, `ui/card/tokens.md`,
and the 16 `<!-- tokens:… -->` marker blocks in `ui/card/*.md` + `ui/reveal/readme.md`.

**Known lint gap (accept, don't fix now):** `tokens.lint.js` checks CSS-needle →
manifest but not the reverse, so a manifest arg with no implementing CSS rule is
silent — that is how `flp(rgt)` acquired a declared value with no geometry rule.
Change 2 fixes the one instance; the class of bug remains.

## Change 5 — docs

Same commit, per the working discipline:
- `ui/card/AGENTS.md` §7 — restate as "one grid, families use subsets"; add the
  subset table; keep `obp()` called out as the only physical vocabulary, now with
  the image-space rationale.
- `docs/session-start.md` "One position grid" bullet — same.
- `ui/card/media.md` (§ furniture, § marquee), `ui/card/carousel.md`,
  `ui/card/media.carousel.md`, `ui/reveal/readme.md`, `layout/AGENTS.md:268`.
- `ui/card/media.furniture.html:27` — the intro already names the 9-code grid
  correctly; update the `marquee(top)`/`marquee(bot)` prose at `:130,139` and the
  live tokens at `:142,152`.

---

## Verification

1. **Browser gate for Change 3, before writing it.** Serve the repo
   (`python3 -m http.server`) and drive Chromium via playwright-core with
   `executablePath: '/opt/pw-browsers/chromium'` (never `playwright install`).
   Probe `CSS.supports` and, more importantly, a live `::scroll-button(inline-start)`
   + `anchor(start)` frame — feature-detect on real computed geometry, not on
   `CSS.supports` of a custom property (a custom property parses anything).
2. **Tokens:** `node ui/card/tokens.build.js` twice (idempotent) then
   `node ui/card/tokens.lint.js` — must be clean.
3. **SSR snapshot:** `node ui/card/render.snapshot.js . /tmp/before.txt` **before**
   any edit, re-run after, `cmp`. Output **will** differ for reveal presets whose
   `reveal.from` is set — that is Change 2's `FRM_TOKEN` and is the only
   justified diff. Everything else must be byte-identical.
4. **Visual, LTR:** `ui/card/media.furniture.html` (all 9 cells, block 1 at
   `:30-40`, plus the marquee blocks), `ui/card/media.carousel.html`,
   `ui/card/media.html` (the `obp()` grid at `:95-103`), `ui/reveal/index.html`
   (flip/slide demos). Check console errors on each.
5. **Visual, RTL — the actual regression target.** Only one RTL card demo exists
   today (`ui/card/media.carousel.html:630`, the `mrk(rail)` frame). Add an RTL
   block covering `mrk(ts)`, `arw(set)`, `chip(ts)` and `sld(cs)` side by side, and
   assert in Chromium that a logical-`s` cell resolves to the **right** edge under
   `dir="rtl"` and the left edge under `dir="ltr"` — that single assertion is what
   proves Change 3 landed.
6. Compare computed styles on both sides of the `md:`/`lg:` container tiers for
   anything touched.

## Not in scope (offered, declined — record so it isn't re-litigated)

- Collapsing mechanical repetition: scrim two-axis (−~2.4 KB, would delete the
  9-rule RTL gradient re-bake at `media.css:225-233`), the 54-selector furniture
  block at `media.css:170-179` → the `--_play-*` var-indirection shape already at
  `media.carousel.css:104-109`, `obp` two-axis (−576 B).
- A CSS build step. There is none today: ~21% of the 247 KB of card CSS is
  comments + indentation shipped verbatim, ~52 KB — larger than every selector
  rewrite above combined. Gzip already erases most repetition wins (the furniture
  block is 2,965 B raw → 424 B gzip), so byte-level work here is a minifier
  problem, not a selector problem.
- Tightening `tokens.lint.js` with a manifest → CSS reverse check and a
  `posVocab` field per family.
