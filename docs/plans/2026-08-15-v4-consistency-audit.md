# v4 consistency audit — `/layout`, `ui/card`, `ui/base` + the `components.md` satellites

> **Report only. Nothing in this audit changed any code.** Every finding carries a
> `file:line` and a one-command check. Scope is the v4 surface: `/layout`, `ui/card`,
> `ui/base`, and the packages listed in [`ui/card/components.md`](../../ui/card/components.md).
> Out of scope by instruction: every non-v4 folder.
>
> Audited 2026-08-15. Verified against the tree at `68a19cc`.

## How to read this

The system is **solid**. The two consumption modes — standalone (`<ui-chip theme="pale green" size="lg">`)
and furniture (`media="chip(green) chip(xl)"`) — are implemented consistently in the places
that matter most: **all nine hues are present in both modes in all seven furniture families**,
the 3×3 logical position grid has no surviving physical alias, and every one of the 18
documented token categories exists in `ui/base/tokens.css` with the exact documented
spelling. What follows is the residue.

Findings are ranked by what they cost you, not by how many there are:

| § | Tier | Count | What it means |
|---|---|---|---|
| [A](#a-bugs) | **Bugs** | 4 | Behaviour is wrong today |
| [B](#b-wiring-gaps) | **Wiring gaps** | 3 | Consumed but not declared |
| [C](#c-two-owners-one-value) | **Duplicated ownership** | 2 | Two sources of truth for one value |
| [D](#d-mode-asymmetry) | **Mode asymmetry** | 4 | Standalone and furniture disagree |
| [E](#e-naming) | **Naming** | 4 | Convention stated, not followed |
| [F](#f-docs-that-are-wrong-about-the-code) | **Docs wrong about code** | 5 | Including two auto-loaded into every session |

**Two claims were dropped in verification** rather than reported: a supposed `--_g`
collision between `ui/card/media.css` and `ui/beacon` (`media.css` contains no `--_g`), and
a supposed double-parse of the icon package in `dist/demo.css` (esbuild dedupes the
`@import`; the built bundle is clean). The architectural violation behind the second is
real and is [B3](#b3).

---

## A. Bugs

### A1 — `--_theme-bs` is the one theme variable that leaks

`ui/base/theme.css:5-17` registers **thirteen** `--_theme-*` properties with
`inherits: false`. `--_theme-bs` — written at `:105-107`, read at `:88` — is **not among
them**, so it inherits.

**Symptom:** `theme="red border(dashed)"` on a container gives a dashed border to every
descendant that reads `--_theme-bs`, not just the themed element. `ui/base/theme.md`
explicitly relies on the opposite ("an un-themed child does not pick up an ancestor's
theme").

```sh
grep -n "@property --_theme" ui/base/theme.css   # 13 lines, no -bs
grep -n -- "--_theme-bs" ui/base/theme.css       # written :105-107, read :88
```

**Fix:** one line — register it beside its siblings.

### A2 — `ui/rating` declares three unprefixed inheriting globals

`ui/rating/ui-rating.css:9-11` (and again `:20-22`) declare `--min`, `--max`, `--value`.
Not `--ui-rating-*`, not `--_*`. They inherit into every descendant and will collide with
any other component or page author using the three most obvious names in CSS.

```sh
grep -n "^\s*--\(min\|max\|value\):" ui/rating/ui-rating.css
```

**Fix:** rename to `--ui-rating-min/-max/-value`, or `--_*` if they are internal.

### A3 — unnamespaced `@keyframes`

| File | Keyframe | Verdict |
|---|---|---|
| `ui/progress/ui-progress.css:66` | `progress` | unnamespaced |
| `ui/progress/ui-progress.css:67` | `progress-rtl` | unnamespaced |
| `ui/gradient-text/ui-gradient-text.css:16` | `move-bg` | unnamespaced |
| `ui/gradient-text/ui-gradient-text.css:68-69` | `ui-slide-bg`, `ui-breathe-bg` | correct |
| `ui/base/scroll.css:20,24` | `ui-scroll-fade-s/-e` | correct |

`@keyframes` is document-global and last-declared wins. A page defining `@keyframes progress`
silently takes over the indeterminate bar. `ui/gradient-text` uses **both conventions in one
file**, which is the tell that this is drift rather than a decision.

### A4 — two accordion variant words are unreachable from a preset

`ui/accordion/ui-accordion.css` implements **eight** variant words; `ui/card/tokens.lint.js:218`
declares **six**. `breakout` and `hide-summary` ship in the CSS, are documented in
`ui/accordion/readme.md`, and a preset using them fails the lint with "not in the accordion
variant vocabulary — dead in the browser" — for words that are very much alive.

```sh
grep -oE 'variant~="[a-z-]+"' ui/accordion/ui-accordion.css | sort -u   # 8
grep -n "accordion: new Set" ui/card/tokens.lint.js                     # 6
```

**Fix, and the durable one:** `PART_VARIANTS` is a hand-typed literal, while its
neighbours `lintSlideLists` and `lintSubtypes` *parse* their counterpart files. Make
`PART_VARIANTS` parse the component sheets too and this class of drift cannot recur — the
"KEEP IN SYNC" comment above it is currently enforced by nothing.

---

## B. Wiring gaps

### B1 — two packages in `components.md` are not packages

`ui/highlight/` and `ui/button-group/` contain **no `package.json`**. Both are listed under
a column headed **Package** in `ui/card/components.md`; both are emitted by the renderer
(`render.js:283` emits `<high-light>`, `:1126` emits `.ui-button-group`).

With no manifest they are in no npm workspace (root `package.json` globs `ui/*` and npm
skips manifest-less directories), so they are never versioned by `version-all`, never
published, and cannot appear in `ui/card`'s `peerDependencies` — where every other emitted
sub-component does appear.

```sh
ls ui/highlight ui/button-group          # index.html, readme.md, *.css — no package.json
grep -c "highlight\|button-group" ui/card/package.json   # 0
```

### B2 — `<ui-badge>` is emitted, peer-declared, and styled nowhere

`render.js:755` emits `<ui-badge>` inside `<ui-chip>` whenever `furniture.chip.badge` is
set. `@browser.style/badge` **is** a declared peer of `ui/card`. But `ui/badge` appears in
neither `components.md` nor `demo/demo.css` — so the badge renders unstyled on every demo
page.

Nobody has noticed because **zero data instances set `chip.badge`**, which makes this a
demo-coverage hole as well as a bundling one.

```sh
grep -n "ui-badge" ui/card/render.js            # :755
grep -c "badge" ui/card/components.md ui/card/demo/demo.css   # 0, 0
grep -rc '"badge"' ui/card/data/*.json | grep -v ':0'          # (no output)
```

### B3 — the bundle gate does not check what `AGENTS.md` says it checks {#b3}

`ui/card/AGENTS.md` states: *"No package may `@import` another package's CSS"*, and credits
`scripts/css-bundle.js` with failing the build otherwise — naming the historical
`ui-reveal.css` → `../card/ui-card.css` import as what the gate exists to prevent.
`ui/reveal/ui-reveal.css:3` complies and says so.

Two things are true and neither matches that description:

1. **`ui/accordion/ui-accordion.css:15` does `@import '../icon/index.css';`** — a live
   violation of the rule.
2. **The gate cannot see it.** `scripts/css-bundle.js:60` computes
   `relative(root, resolve(root, input)).startsWith('..')` — it only rejects inputs
   resolving *outside the repo root*. A cross-package import inside the repo passes, so
   the gate would not have caught the `ui-reveal` case either.

The built bundle is fine (esbuild dedupes), so the cost is not a fat bundle — it is that a
`<link>` consumer of `@browser.style/accordion` alone silently pulls in the icon package,
breaking the peer-exclusive-bundle promise, with a guard that reads as if it were covered.

---

## C. Two owners, one value

### C1 — `play` sizes are declared twice, with different coverage

| Source | Subject | Sizes |
|---|---|---|
| `ui/play/ui-play.css:88-90` | `… ui-play) button` | `sm` `lg` `xl` |
| `ui/card/media.video.css:23-26` | `:where([media*="play(…)"])` | `sm` **`md`** `lg` `xl` |

Same values, two sheets, and `md` exists only in the card. So `media="play(md)"` works but
`<ui-play size="md">` does nothing.

This is the **only** such case. A mechanical cross-check of every non-position furniture
token in the manifest against its own package's sheet returns exactly one result:

```sh
# every furniture token whose own package has no matching rule
node -e '…'   # → play(md) — in ui/card only
```

(The nine position cells per family are card-owned *by design* — `ui/card/media.css:144-152`
positions all six overlay families — and `sticker(sh:<custom>)` is covered by the prefix
rule at `ui/sticker/ui-sticker.css:200`. Neither is a finding.)

### C2 — `ui/icon` is in the furniture table but is not furniture

`components.md` lists `ui/icon` among the components the card system drives, but there is
**no `icon(…)` token in the manifest and no `[media*="icon("]` selector anywhere in the
repo**. `ui-icon` implements no hue, no position cell, no `theme=`, no radius axis. It is
only ever a *child* of `ui-save`/`ui-play`/`ui-lightbox`, or the target of reveal's
`variant="ico(…)"` — which is a *reveal* token, not an icon one.

Not a bug; a table that implies an axis that does not exist.

---

## D. Mode asymmetry

This is the category the two-mode design is most exposed to, and the one with the most
findings. **The hue matrix itself is clean** — all nine hues in both modes in all seven
real furniture families, and `AGENTS.md` conv. #8's claim that `save`/`play`/`lightbox`
implement no `pale`/`muted` still holds exactly. The asymmetry is in the modifiers and the
words.

### D1 — `muted` computes a different ink in the two modes

| Mode | Rule | Ink |
|---|---|---|
| standalone | `ui/base/theme.css:42-45` | **faded** — `color-mix(… var(--_theme-pale-c), transparent 50%)` |
| furniture | `ui/chip/ui-chip.css:46` (+ sticker `:82`, beacon `:73`, marquee `:109`) | **opaque** — `--_theme-c: var(--_theme-base-c)` |

`<ui-chip theme="red muted">` and `media="chip(red) chip(muted)"` are documented as the
same modifier and render with different label opacity.

### D2 — `pale muted` composes standalone, silently drops `pale` as furniture

Standalone chains `base → pale → tone → bg` (`theme.css:30` documents the chain), so
`theme="red pale muted"` is a muted *pale*. The furniture arms both write `--_theme-bg`
directly at identical zero specificity (`ui-chip.css:45` and `:46`), so
`chip(pale) chip(muted)` resolves to whichever is later in source — `muted` — and `pale`
is dropped with no signal.

### D3 — variant words are spelled differently per mode; sizes and corners are not

Size and corner words are **identical** in both modes across every family. Variant words
are not, and no rule states which should be which:

| Family | Standalone | Furniture |
|---|---|---|
| chip | `variant="light"` / `"outline"` | `chip(lgt)` / `chip(out)` |
| beacon | `variant="pill\|solid\|ticker\|loader\|dots"` | `beacon(pll\|sld\|tck\|ldr\|dts)` |
| beacon | `animation="blink\|pulse\|breathe\|none"` | `beacon(bln\|pls\|brt\|non)` |
| marquee | `variant="loop"` | `marquee(rpt)` |
| sticker | `variant="speech(l)"` / `"speech(r)"` | `sticker(spl)` / `sticker(spr)` |

Note the last row of the beacon pair: the standalone spelling is `none`, the furniture
spelling is `non` — the abbreviation is applied inconsistently even within one axis.

### D4 — one word, several meanings

- **`non`** is a *radius* value (chip `:77`, sticker `:101`, marquee `:129`), a *variant*
  meaning "hide the disc" (save `:109`, lightbox `:113`), and an *animation* value meaning
  "stop" (beacon `:133`, `:240`).
- **`pll`** on a beacon is the pill **face** as furniture (`ui-beacon.css:103`) and the pill
  **radius** standalone (`:255`) — with no furniture twin for the radius, because the token
  name is already taken. The sheet's own comment at `:251` says *"`pll`/`non`/`crc` are
  deliberately not members"* of the corner axis, **four lines before `:255` declares `pll`
  as one**. The manifest files `pll` under beacon's `disc` args, a third reading.

### D5 — size ladders diverge between families

| Family | `sm` | `lg` | `xl` | `2xl` |
|---|---|---|---|---|
| chip (`:71-74`) | 0.625 | 1 | 1.15 | 1.4 |
| beacon (`:93-97`) | 0.625 | 1 | 1.15 | 1.4 |
| **marquee** (`:123-126`) | **0.75** | **1.15** | **1.4** | **1.75** |
| save / lightbox | 0.8 | 1.6 | 2.2 | — |

chip and beacon agree exactly (beacon adds `xs` and `md` at either end, which is fine).
**Marquee is the same ladder shifted one step**, so `lg` on a marquee equals `xl` on a chip.
`save`/`lightbox` share a third scale; `play` and `sticker` each run their own.

---

## E. Naming

The stated rule (`docs/design-system-agent.md`): `--ui-{component}-{property}`, **full
readable names**, never abbreviations, no PascalCase in new code.

### E1 — abbreviated public tokens

| Package | Tokens |
|---|---|
| sticker | `--ui-sticker-fs`, `-fs-scale`, `-p`, `-sz`, `-c`, `-lead-c` |
| play | `--ui-play-sz`, `-icon-sz`, `-bdf`, `-trsdu`, `-c` |
| save / lightbox | `--ui-save-sz`, `--ui-lightbox-sz`, `-circle-pad`, `-c*` |
| chip / beacon / marquee | `--ui-chip-c`, `--ui-beacon-c`, `--ui-marquee-c` |
| progress / timeline | `--ui-progress-bs`, `-bg`, `--ui-timeline-time-fs` |

**The sharp edge is `-sz` vs `-size`:** beacon, marquee and icon spell it out
(`--ui-beacon-font-size`, `--ui-marquee-item-size`, `--ui-icon-size`); sticker, play, save
and lightbox do not. `ui/sticker/ui-sticker.css:10` (`-fs`) sits one line from `:9`
(`-font-family`) — two conventions, adjacent.

### E2 — two words for one property

`background` vs `bg` and `color` vs `ink` are both live: `--ui-avatar-background` /
`--ui-progress-bg` / `--ui-accordion-bg`; `--ui-avatar-color` / `--ui-accordion-color` /
`--ui-timeline-time-ink`.

### E3 — `--_o` does two jobs in one sheet

`ui/sticker/ui-sticker.css:163-168` uses `--_o` as the drop-shadow offset; `:269-270`
reuses it as the text-outline width. The later declaration wins for any element matching
both, which is reachable markup (`variant="text"` plus an `off()` shadow).

Compare `ui/beacon/ui-beacon.css:6-9`, which namespaces its privates as `--_bcn-*` with an
explicit rationale. Nothing else follows that.

### E4 — PascalCase referenced in live code, and one dangling name

The rule says the PascalCase aliases exist for backward compatibility and are *"never used
in new code."* They are referenced from `ui/base/utility.css` (~19 sites),
`ui/base/webcomponents.css`, and `ui/button-group`.

Worse, `ui/gradient-text/ui-gradient-text.css:27` and `:63` read **`--GradientText`, which
is defined nowhere in the repo**:

```sh
grep -rn -- "--GradientText\s*:" ui/ docs/    # no output
grep -n -- "--GradientText" ui/gradient-text/ui-gradient-text.css   # :27, :63
```

The component still works (it falls through to the literal default), but its documented
theming hook does not exist.

---

## F. Docs that are wrong about the code

These matter more than their size suggests: **`docs/design-system-agent.md` is auto-loaded
into every session** via the root `CLAUDE.md`, so an error in it propagates into work
rather than sitting on a page.

### F1 — the PascalCase aliases are not where the doc says

`docs/design-system-agent.md:67`: *"`core.css` still contains PascalCase aliases … Do NOT
remove the aliases from `core.css`."*

```sh
grep -c "^\s*--[A-Z]" ui/base/core.css      # 0
grep -c "^\s*--[A-Z]" ui/base/tokens.css    # 20
```

They are in `tokens.css`. `core.css` has none.

### F2 — the Base Package Files table is missing four live files

`ui/base/index.css` imports **14** stylesheets. The doc's table lists 10 of them. Missing:
**`theme.css`** (the entire `theme=` axis, on which every furniture hue depends),
**`tint.css`**, **`scroll.css`**, **`stagger.css`**.

### F3 — the token table omits `--size-*`

`ui/base/tokens.css` defines 15 `--size-N` steps, and `ui/avatar` and `ui/rating` are built
on them. The doc's 18-category table has no row for it, so an agent working from the table
would conclude the scale does not exist. (Also absent: `--stagger-*`, the `--ui-theme-*`
bundles, `--radius-*-sq`/`--squircle-*`.)

### F4 — every generated manifest source reference is stale

`ui/card/data/tokens.json` records a `sources` line reference per token. A mechanical check
of all of them against real file lengths finds **20+ out-of-range**, e.g.
`ui/card/media.css:238` in a 228-line file, `ui/card/ui-card.css:374-380` in a 369-line
file, `ui/chip/ui-chip.css:99` in a 91-line file. The manifest's claim to be anchored to
source is not currently checkable.

**Fix:** either drop line numbers from `sources` (file-level refs do not rot), or add a
range check to `tokens.lint.js` — it already parses these files.

### F5 — `open-items.md` item 7 is wrong, and it is mine

The entry I added in `1007936` frames `data-variant=` as v3 version drift. **It is not.** A
bare `variant=` is invalid HTML on a built-in element, so `data-variant` on `<fieldset>`,
`<progress>`, `<ol>`, `<li>` and bare `variant` on `<ui-*>` is a **conformance rule** — one
the repo already follows everywhere, and which `ui/card/docs/schema.md` already documents
for `ui/timeline`'s `data-theme` on `<li>`.

What survives from that entry: the v4-word (`variant="loop seam fade"`) vs v4-token
(`variant="col lg:row lg:spl(1/1)"`) difference, and the fact that `render.js` hard-codes
which attribute each `parts` key writes.

---

## G. "v5" — a version that does not exist

There is no v5. `/layout` and `ui/card` are v4. Yet **109 sites across 17 files** refer to
a system "v5":

```sh
grep -rn "\bv5\b" --include=*.md --include=*.css --include=*.js ui/card ui/base layout docs | wc -l   # 109
```

Spread: `ui/card/data/tokens.json` and its two generated outputs, `ui/card/readme.md`,
`AGENTS.md`, eight files under `ui/card/docs/`, `docs/session-start.md`,
`docs/plans/open-items.md`, and `render.js`.

**Three different things are being called v5, and only one is legitimate:**

1. **Per-package semver** — `ui/marquee@5.1.0`, `ui/accordion@5.0.0`, `@version 5.0.0`
   headers. Legitimate and independent of the system version. **Leave alone.**
2. **A real cleanup batch** — "removed in v5", "the v5 alias batch", "promoted to canonical
   in v5". These describe work that happened; the batch just needs a name that is not a
   version number.
3. **System-version prose** — "v5 support posture", "the system's v5 vocabulary". Simply
   wrong.

**The operational catch:** `ui/card/data/tokens.json` is the hand-edited manifest, and
`tokens.build.js` copies its `notes` verbatim into `tokens.data.js` **and** `docs/tokens.md`.
Roughly half the 109 sites are those two generated files. A rewrite must therefore start at
`tokens.json` and regenerate — editing the generated copies would be reverted by the next
`node ui/card/tokens.build.js`.

**Recommended:** rewrite categories 2 and 3 to v4, leaving category 1 untouched. Scoped and
ready to apply; it is a mechanical pass plus one `tokens.build.js` run.

---

## Recommended order

1. **[A1](#a1--_theme-bs-is-the-one-theme-variable-that-leaks)** — one line, fixes a real
   leak.
2. **[A4](#a4--two-accordion-variant-words-are-unreachable-from-a-preset)** — unblocks two
   shipped features, and making `PART_VARIANTS` parse the CSS closes the class permanently.
3. **[A2](#a2--uirating-declares-three-unprefixed-inheriting-globals)** /
   **[A3](#a3--unnamespaced-keyframes)** — collision hazards on any real page.
4. **[F1](#f1--the-pascalcase-aliases-are-not-where-the-doc-says)–[F3](#f3--the-token-table-omits---size-)** —
   cheap, and they are wrong in the file every session reads first.
5. **[B1](#b1--two-packages-in-componentsmd-are-not-packages)** /
   **[B2](#b2--ui-badge-is-emitted-peer-declared-and-styled-nowhere)** — packaging truth.
6. **[G](#g-v5--a-version-that-does-not-exist)** — mechanical, but do it in one pass from
   `tokens.json`, not file by file.
7. **[C](#c-two-owners-one-value)/[D](#d-mode-asymmetry)/[E](#e-naming)** — each needs a
   decision (which spelling wins), so they are worth batching into one deliberate
   vocabulary pass rather than fixing piecemeal.
