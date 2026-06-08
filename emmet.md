# Custom Property Naming Reference

Based on [Emmet](https://docs.emmet.io/cheat-sheet/) abbreviations, extended with modern CSS properties from [MDN data](https://github.com/mdn/data/blob/main/css/properties.json). Entries marked **★** are custom additions (not standard Emmet).

## Two columns, one convention

Each table has a **Token** column and an **Abbr** column:

| Column | Purpose | Source |
|--------|---------|--------|
| **Token** | Recommended name for component custom properties | Design-system conventions (Tailwind v4, Open Props) + `tokens.css` |
| **Abbr** | Emmet abbreviation — terse alternative for power users | [Emmet cheat sheet](https://docs.emmet.io/cheat-sheet/) |

**Token names are the default.** Use them unless you have a strong reason to prefer the Emmet abbreviation.

### Where Token names come from

1. **Global tokens in `tokens.css`** — where a global token exists, the component token mirrors its prefix: `radius`, `shadow`, `tracking`, `duration`, `ease`, `font-size`, `font-weight`, `line-height`, `opacity`, `blur`
2. **Tailwind CSS v4 theme namespaces** — for properties without a global token: `aspect`, `basis`, `grow`, `shrink`, `origin`, `delay`, `accent`, `caret`, `decoration`, `indent`, `underline-offset`, `whitespace`, `touch`
3. **Universal shorthand** — widely recognized across all systems: `bg`, `c`, `d`, `m`, `p`, `w`, `h`, `z`, `pos`, `gap`
4. **Full CSS name** — when no shorter convention exists (most border, grid, and animation properties)

## Naming Pattern

```
--ui-{component}-{token}
--ui-{component}-{sub-element}-{token}
```

Only the **property suffix** is abbreviated. Sub-element names stay readable.

```css
/* Token form (recommended) */
--ui-reveal-icon-sz: 2rem;
--ui-reveal-content-p: 1rem;
--ui-card-radius: var(--radius-md);
--ui-toast-duration: var(--duration-fast);

/* Never abbreviate sub-element names */
--ui-reveal-ic-sz: 2rem;  /* wrong */
```

## Layout & Position

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `b` | `b` | bottom |
| `clear` | `cl` | clear |
| `d` | `d` | display |
| `float` | `fl` | float |
| `inset` | `ins` | inset |
| `inset-block` | `ib` | inset-block |
| `inset-block-end` | `ibe` | inset-block-end |
| `inset-block-start` | `ibs` | inset-block-start |
| `inset-inline` | `ii` | inset-inline |
| `inset-inline-end` | `iie` | inset-inline-end |
| `inset-inline-start` | `iis` | inset-inline-start |
| `interpolate-size` | `ipsz` | interpolate-size ★ |
| `isolation` | `iso` | isolation |
| `l` | `l` | left |
| `overlay` | `ovl` | overlay ★ |
| `pos` | `pos` | position |
| `r` | `r` | right |
| `t` | `t` | top |
| `visibility` | `v` | visibility |
| `z` | `z` | z-index |

## Anchor Positioning

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `anchor-name` | `an` | anchor-name ★ |
| `anchor-scope` | `asc` | anchor-scope ★ |
| `position-anchor` | `posa` | position-anchor ★ |
| `position-area` | `posar` | position-area ★ |
| `position-try` | `post` | position-try ★ |
| `position-try-fallbacks` | `postf` | position-try-fallbacks ★ |
| `position-try-order` | `posto` | position-try-order ★ |
| `position-visibility` | `posv` | position-visibility ★ |

## Sizing

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `aspect` | `ar` | aspect-ratio |
| `block-size` | `bs` | block-size |
| `box-sizing` | `bxsz` | box-sizing |
| `field-sizing` | `fdsz` | field-sizing ★ |
| `h` | `h` | height |
| `inline-size` | `is` | inline-size |
| `max-bs` | `maxbs` | max-block-size ★ |
| `max-h` | `mah` | max-height |
| `max-is` | `maxis` | max-inline-size ★ |
| `max-w` | `maw` | max-width |
| `min-bs` | `minbs` | min-block-size ★ |
| `min-h` | `mih` | min-height |
| `min-is` | `minis` | min-inline-size ★ |
| `min-w` | `miw` | min-width |
| `object-fit` | `of` | object-fit |
| `object-position` | `op` | object-position |
| `object-view-box` | `ovb` | object-view-box ★ |
| `resize` | `rsz` | resize |
| `sz` | `sz` | size (width = height) ★ |
| `w` | `w` | width |

## Spacing — Margin

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `m` | `m` | margin |
| `margin-block` | `mab` | margin-block |
| `margin-block-end` | `mbe` | margin-block-end |
| `margin-block-start` | `mbs` | margin-block-start |
| `mb` | `mb` | margin-bottom |
| `margin-inline` | `mi` | margin-inline |
| `margin-inline-end` | `mie` | margin-inline-end |
| `margin-inline-start` | `mis` | margin-inline-start |
| `ml` | `ml` | margin-left |
| `mr` | `mr` | margin-right |
| `mt` | `mt` | margin-top |
| `margin-trim` | `mat` | margin-trim |

## Spacing — Padding

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `p` | `p` | padding |
| `padding-block` | `pab` | padding-block |
| `padding-block-end` | `pbe` | padding-block-end |
| `padding-block-start` | `pbs` | padding-block-start |
| `pb` | `pb` | padding-bottom |
| `padding-inline` | `pi` | padding-inline |
| `padding-inline-end` | `pie` | padding-inline-end |
| `padding-inline-start` | `pis` | padding-inline-start |
| `pl` | `pl` | padding-left |
| `pr` | `pr` | padding-right |
| `pt` | `pt` | padding-top |

## Spacing — Gap

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `column-gap` | `cg` | column-gap ★ |
| `gap` | `gap` | gap |
| `row-gap` | `rg` | row-gap |

## Border — Physical

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `border` | `bd` | border |
| `border-bottom` | `bdb` | border-bottom |
| `border-bottom-color` | `bdbc` | border-bottom-color |
| `radius-bl` | `bdblrs` | border-bottom-left-radius |
| `radius-br` | `bdbrrs` | border-bottom-right-radius |
| `border-bottom-style` | `bdbs` | border-bottom-style |
| `border-bottom-width` | `bdbw` | border-bottom-width |
| `border-collapse` | `bdcl` | border-collapse |
| `border-color` | `bdc` | border-color |
| `border-left` | `bdl` | border-left |
| `border-left-color` | `bdlc` | border-left-color |
| `border-left-style` | `bdls` | border-left-style |
| `border-left-width` | `bdlw` | border-left-width |
| `radius` | `bdrs` | border-radius |
| `border-right` | `bdr` | border-right |
| `border-right-color` | `bdrc` | border-right-color |
| `border-right-style` | `bdrst` | border-right-style |
| `border-right-width` | `bdrw` | border-right-width |
| `border-shape` | `bdsh` | border-shape ★ |
| `border-spacing` | `bdsp` | border-spacing |
| `border-style` | `bds` | border-style |
| `border-top` | `bdt` | border-top |
| `border-top-color` | `bdtc` | border-top-color |
| `radius-tl` | `bdtlrs` | border-top-left-radius |
| `radius-tr` | `bdtrrs` | border-top-right-radius |
| `border-top-style` | `bdts` | border-top-style |
| `border-top-width` | `bdtw` | border-top-width |
| `border-width` | `bdw` | border-width |
| `box-decoration-break` | `bodb` | box-decoration-break |

## Border — Logical (Block)

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `border-block` | `bb` | border-block |
| `border-block-color` | `bbc` | border-block-color |
| `border-block-end` | `bbe` | border-block-end |
| `border-block-end-color` | `bbec` | border-block-end-color |
| `border-block-end-style` | `bbes` | border-block-end-style |
| `border-block-end-width` | `bbew` | border-block-end-width |
| `border-block-start` | `bbs` | border-block-start |
| `border-block-start-color` | `bbsc` | border-block-start-color |
| `border-block-start-style` | `bbss` | border-block-start-style |
| `border-block-start-width` | `bbsw` | border-block-start-width |
| `border-block-style` | `bbst` | border-block-style |
| `border-block-width` | `bbw` | border-block-width |

## Border — Logical (Inline)

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `border-inline` | `bi` | border-inline |
| `border-inline-color` | `bic` | border-inline-color |
| `border-inline-end` | `bie` | border-inline-end |
| `border-inline-end-color` | `biec` | border-inline-end-color |
| `border-inline-end-style` | `bies` | border-inline-end-style |
| `border-inline-end-width` | `biew` | border-inline-end-width |
| `border-inline-start` | `bis` | border-inline-start |
| `border-inline-start-color` | `bisc` | border-inline-start-color |
| `border-inline-start-style` | `biss` | border-inline-start-style |
| `border-inline-start-width` | `bisw` | border-inline-start-width |
| `border-inline-style` | `bist` | border-inline-style |
| `border-inline-width` | `biw` | border-inline-width |

## Border — Logical Radius

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `radius-ee` | `beer` | border-end-end-radius |
| `radius-es` | `besr` | border-end-start-radius |
| `radius-se` | `bser` | border-start-end-radius |
| `radius-ss` | `bssr` | border-start-start-radius |

## Border — Image

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `border-image` | `bdi` | border-image |
| `border-image-outset` | `bdio` | border-image-outset |
| `border-image-repeat` | `bdir` | border-image-repeat |
| `border-image-slice` | `bdis` | border-image-slice |
| `border-image-source` | `bdisrc` | border-image-source |
| `border-image-width` | `bdiw` | border-image-width |

## Corner Shape

CSS Borders Level 5. Uses `cr` prefix. ★

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `corner-block-end` | `crbesh` | corner-block-end-shape |
| `corner-block-start` | `crbssh` | corner-block-start-shape |
| `corner-bl` | `crblsh` | corner-bottom-left-shape |
| `corner-br` | `crbrsh` | corner-bottom-right-shape |
| `corner-bottom` | `crbsh` | corner-bottom-shape |
| `corner-ee` | `creesh` | corner-end-end-shape |
| `corner-es` | `cressh` | corner-end-start-shape |
| `corner-inline-end` | `criesh` | corner-inline-end-shape |
| `corner-inline-start` | `crissh` | corner-inline-start-shape |
| `corner-left` | `crlsh` | corner-left-shape |
| `corner-right` | `crrsh` | corner-right-shape |
| `corner-shape` | `crsh` | corner-shape |
| `corner-se` | `crsesh` | corner-start-end-shape |
| `corner-ss` | `crsssh` | corner-start-start-shape |
| `corner-tl` | `crtlsh` | corner-top-left-shape |
| `corner-tr` | `crtrsh` | corner-top-right-shape |
| `corner-top` | `crtsh` | corner-top-shape |

## Background

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `bg` | `bg` | background |
| `bg-attachment` | `bga` | background-attachment |
| `bg-blend` | `bbm` | background-blend-mode |
| `bg-clip` | `bgcp` | background-clip |
| `bg` | `bgc` | background-color |
| `bg-image` | `bgi` | background-image |
| `bg-origin` | `bgo` | background-origin |
| `bg-pos` | `bgp` | background-position |
| `bg-pos-x` | `bgpx` | background-position-x |
| `bg-pos-y` | `bgpy` | background-position-y |
| `bg-repeat` | `bgr` | background-repeat |
| `bg-size` | `bgsz` | background-size |

## Typography

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `direction` | `dir` | direction |
| `font` | `f` | font |
| `font-family` | `ff` | font-family |
| `font-feature-settings` | `ffs` | font-feature-settings |
| `font-kerning` | `fk` | font-kerning |
| `font-optical-sizing` | `fos` | font-optical-sizing |
| `font-palette` | `fp` | font-palette ★ |
| `font-size` | `fsz` | font-size |
| `font-size-adjust` | `fsza` | font-size-adjust |
| `font-stretch` | `fst` | font-stretch |
| `font-style` | `fs` | font-style |
| `font-synthesis` | `fsy` | font-synthesis |
| `font-synthesis-position` | `fsyp` | font-synthesis-position |
| `font-synthesis-small-caps` | `fsysc` | font-synthesis-small-caps |
| `font-synthesis-style` | `fsys` | font-synthesis-style |
| `font-synthesis-weight` | `fsyw` | font-synthesis-weight |
| `font-variant` | `fv` | font-variant |
| `font-variant-caps` | `fvc` | font-variant-caps |
| `font-variant-east-asian` | `fvea` | font-variant-east-asian |
| `font-variant-emoji` | `fve` | font-variant-emoji |
| `font-variant-ligatures` | `fvl` | font-variant-ligatures |
| `font-variant-numeric` | `fvn` | font-variant-numeric |
| `font-variant-position` | `fvp` | font-variant-position |
| `font-variation-settings` | `fvs` | font-variation-settings |
| `font-weight` | `fw` | font-weight |
| `font-width` | `fwi` | font-width |
| `hyphenate-limit-chars` | `hlc` | hyphenate-limit-chars ★ |
| `hyphens` | `hyp` | hyphens |
| `initial-letter` | `il` | initial-letter |
| `initial-letter-align` | `ila` | initial-letter-align |
| `tracking` | `lts` | letter-spacing |
| `line-clamp` | `lc` | line-clamp |
| `line-height` | `lh` | line-height |
| `text-align` | `ta` | text-align |
| `text-align-last` | `tal` | text-align-last |
| `text-autospace` | `tas` | text-autospace ★ |
| `text-box` | `txb` | text-box ★ |
| `text-box-edge` | `txbe` | text-box-edge ★ |
| `text-box-trim` | `txbt` | text-box-trim ★ |
| `decoration` | `td` | text-decoration |
| `text-decoration-color` | `tdc` | text-decoration-color |
| `text-decoration-inset` | `tdi` | text-decoration-inset ★ |
| `text-decoration-line` | `tdl` | text-decoration-line |
| `text-decoration-skip-ink` | `tdsi` | text-decoration-skip-ink |
| `text-decoration-style` | `tds` | text-decoration-style |
| `text-decoration-thickness` | `tdt` | text-decoration-thickness |
| `text-emphasis` | `te` | text-emphasis |
| `text-emphasis-color` | `tec` | text-emphasis-color |
| `text-emphasis-position` | `tep` | text-emphasis-position |
| `text-emphasis-style` | `tes` | text-emphasis-style |
| `indent` | `ti` | text-indent |
| `text-justify` | `tj` | text-justify |
| `text-orientation` | `to` | text-orientation |
| `text-overflow` | `tov` | text-overflow |
| `text-rendering` | `tr` | text-rendering |
| `text-shadow` | `tsh` | text-shadow |
| `text-size-adjust` | `tsa` | text-size-adjust |
| `text-spacing-trim` | `tst` | text-spacing-trim ★ |
| `text-transform` | `tt` | text-transform |
| `underline-offset` | `tuo` | text-underline-offset |
| `text-underline-position` | `tup` | text-underline-position |
| `text-wrap` | `tw` | text-wrap ★ |
| `text-wrap-mode` | `twm` | text-wrap-mode ★ |
| `text-wrap-style` | `tws` | text-wrap-style ★ |
| `whitespace` | `whs` | white-space |
| `white-space-collapse` | `whsc` | white-space-collapse ★ |
| `word-break` | `wob` | word-break |
| `word-spacing` | `wos` | word-spacing |
| `overflow-wrap` | `wow` | word-wrap / overflow-wrap |
| `writing-mode` | `wm` | writing-mode |

## Color & Opacity

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `accent` | `acc` | accent-color |
| `caret-animation` | `cara` | caret-animation ★ |
| `caret` | `cc` | caret-color |
| `caret-shape` | `carsh` | caret-shape ★ |
| `c` | `c` | color |
| `color-scheme` | `cs` | color-scheme |
| `dynamic-range-limit` | `drl` | dynamic-range-limit ★ |
| `forced-color-adjust` | `fca` | forced-color-adjust |
| `opacity` | `opa` | opacity |
| `print-color-adjust` | `pca` | print-color-adjust |

## Effects

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `backdrop` | `bf` | backdrop-filter |
| `shadow` | `sh` | box-shadow ★ |
| `clip-path` | `clp` | clip-path |
| `filter` | `fil` | filter |
| `mix-blend-mode` | `mbm` | mix-blend-mode |
| `paint-order` | `pao` | paint-order ★ |
| `text-shadow` | `tsh` | text-shadow |

## Mask

Uses `mk` prefix to avoid conflicts with margin (`m*`) properties. ★

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `mask` | `mk` | mask |
| `mask-border` | `mkb` | mask-border |
| `mask-border-mode` | `mkbm` | mask-border-mode |
| `mask-border-outset` | `mkbo` | mask-border-outset |
| `mask-border-repeat` | `mkbr` | mask-border-repeat |
| `mask-border-slice` | `mkbs` | mask-border-slice |
| `mask-border-source` | `mkbsrc` | mask-border-source |
| `mask-border-width` | `mkbw` | mask-border-width |
| `mask-clip` | `mkc` | mask-clip |
| `mask-composite` | `mkco` | mask-composite |
| `mask-image` | `mki` | mask-image |
| `mask-mode` | `mkm` | mask-mode |
| `mask-origin` | `mko` | mask-origin |
| `mask-position` | `mkp` | mask-position |
| `mask-repeat` | `mkr` | mask-repeat |
| `mask-size` | `mksz` | mask-size |
| `mask-type` | `mkt` | mask-type |

## Shape

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `shape-image-threshold` | `sit` | shape-image-threshold |
| `shape-margin` | `shm` | shape-margin ★ |
| `shape-outside` | `so` | shape-outside |

## Transform

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `backface-visibility` | `bfv` | backface-visibility |
| `perspective` | `per` | perspective |
| `perspective-origin` | `po` | perspective-origin |
| `rotate` | `rot` | rotate |
| `scale` | `sca` | scale |
| `transform` | `trf` | transform |
| `transform-box` | `tb` | transform-box |
| `origin` | `trfo` | transform-origin |
| `transform-style` | `trfs` | transform-style |
| `translate` | `tra` | translate |

## Offset / Motion Path

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `offset` | `off` | offset ★ |
| `offset-anchor` | `offa` | offset-anchor ★ |
| `offset-distance` | `offd` | offset-distance ★ |
| `offset-path` | `offp` | offset-path ★ |
| `offset-position` | `offpos` | offset-position ★ |
| `offset-rotate` | `offr` | offset-rotate ★ |

## Transition & Animation

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `animation` | `anim` | animation |
| `animation-composition` | `animco` | animation-composition ★ |
| `animation-delay` | `animdel` | animation-delay |
| `animation-direction` | `animdir` | animation-direction |
| `animation-duration` | `animdur` | animation-duration |
| `animation-fill-mode` | `animfm` | animation-fill-mode |
| `animation-iteration-count` | `animic` | animation-iteration-count |
| `animation-name` | `animn` | animation-name |
| `animation-play-state` | `animps` | animation-play-state |
| `animation-range` | `animr` | animation-range ★ |
| `animation-range-end` | `animre` | animation-range-end ★ |
| `animation-range-start` | `animrs` | animation-range-start ★ |
| `animation-timeline` | `animtl` | animation-timeline ★ |
| `animation-timing-function` | `animtf` | animation-timing-function |
| `animation-trigger` | `animtr` | animation-trigger ★ |
| `duration` | `dur` | duration ★ |
| `ease` | `ease` | timing-function ★ |
| `transition` | `trs` | transition |
| `transition-behavior` | `trsb` | transition-behavior ★ |
| `delay` | `trsde` | transition-delay |
| `transition-property` | `trsp` | transition-property |

## Scroll & View Timeline

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `scroll-timeline` | `stl` | scroll-timeline ★ |
| `scroll-timeline-axis` | `stla` | scroll-timeline-axis ★ |
| `scroll-timeline-name` | `stln` | scroll-timeline-name ★ |
| `timeline-scope` | `tlsc` | timeline-scope ★ |
| `view-timeline` | `vtl` | view-timeline ★ |
| `view-timeline-axis` | `vtla` | view-timeline-axis ★ |
| `view-timeline-inset` | `vtli` | view-timeline-inset ★ |
| `view-timeline-name` | `vtln` | view-timeline-name ★ |

## View Transitions

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `view-transition-class` | `vtc` | view-transition-class ★ |
| `view-transition-name` | `vtn` | view-transition-name ★ |
| `view-transition-scope` | `vts` | view-transition-scope ★ |

## Flexbox & Alignment

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `align-content` | `ac` | align-content |
| `align-items` | `ai` | align-items |
| `align-self` | `as` | align-self |
| `flex` | `fx` | flex |
| `basis` | `fxb` | flex-basis |
| `flex-direction` | `fxd` | flex-direction |
| `flex-flow` | `fxf` | flex-flow |
| `grow` | `fxg` | flex-grow |
| `shrink` | `fxsh` | flex-shrink |
| `flex-wrap` | `fxw` | flex-wrap |
| `justify-content` | `jc` | justify-content |
| `justify-items` | `ji` | justify-items |
| `justify-self` | `js` | justify-self |
| `order` | `ord` | order |
| `place-content` | `pc` | place-content |
| `place-items` | `pli` | place-items ★ |
| `place-self` | `pls` | place-self ★ |

## Grid

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `grid` | `gd` | grid |
| `grid-area` | `ga` | grid-area |
| `grid-auto-columns` | `gac` | grid-auto-columns |
| `grid-auto-flow` | `gaf` | grid-auto-flow |
| `grid-auto-rows` | `gar` | grid-auto-rows |
| `grid-column` | `gc` | grid-column |
| `grid-column-end` | `gce` | grid-column-end |
| `grid-column-start` | `gcs` | grid-column-start |
| `grid-row` | `gr` | grid-row |
| `grid-row-end` | `gre` | grid-row-end |
| `grid-row-start` | `grs` | grid-row-start |
| `grid-template` | `gt` | grid-template |
| `grid-template-areas` | `gta` | grid-template-areas |
| `grid-template-columns` | `gtc` | grid-template-columns |
| `grid-template-rows` | `gtr` | grid-template-rows |
| `reading-flow` | `rfl` | reading-flow ★ |

## Overflow & Scroll

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `overflow` | `ov` | overflow |
| `overflow-block` | `ovb` | overflow-block |
| `overflow-clip-margin` | `ovcm` | overflow-clip-margin ★ |
| `overflow-inline` | `ovi` | overflow-inline |
| `overflow-wrap` | `ow` | overflow-wrap |
| `overflow-x` | `ovx` | overflow-x |
| `overflow-y` | `ovy` | overflow-y |
| `overscroll-behavior` | `ob` | overscroll-behavior |
| `overscroll-behavior-block` | `obb` | overscroll-behavior-block |
| `overscroll-behavior-inline` | `obi` | overscroll-behavior-inline |
| `scroll-behavior` | `sb` | scroll-behavior |
| `scroll-margin` | `sm` | scroll-margin |
| `scroll-margin-block` | `smb` | scroll-margin-block |
| `scroll-margin-block-end` | `smbe` | scroll-margin-block-end |
| `scroll-margin-block-start` | `smbs` | scroll-margin-block-start |
| `scroll-margin-inline` | `smi` | scroll-margin-inline |
| `scroll-margin-inline-end` | `smie` | scroll-margin-inline-end |
| `scroll-margin-inline-start` | `smis` | scroll-margin-inline-start |
| `scroll-marker-group` | `smg` | scroll-marker-group ★ |
| `scroll-padding` | `sp` | scroll-padding |
| `scroll-padding-block` | `spb` | scroll-padding-block |
| `scroll-padding-block-end` | `spbe` | scroll-padding-block-end |
| `scroll-padding-block-start` | `spbs` | scroll-padding-block-start |
| `scroll-padding-inline` | `spi` | scroll-padding-inline |
| `scroll-padding-inline-end` | `spie` | scroll-padding-inline-end |
| `scroll-padding-inline-start` | `spis` | scroll-padding-inline-start |
| `scroll-snap-align` | `ssa` | scroll-snap-align |
| `scroll-snap-stop` | `sss` | scroll-snap-stop |
| `scroll-snap-type` | `sst` | scroll-snap-type |
| `scrollbar-color` | `sc` | scrollbar-color |
| `scrollbar-gutter` | `sg` | scrollbar-gutter |
| `scrollbar-width` | `sw` | scrollbar-width |

## Container

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `container` | `ctr` | container ★ |
| `container-name` | `cn` | container-name ★ |
| `container-type` | `ct` | container-type ★ |

## Contain & Intrinsic Sizing

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `contain` | `con` | contain |
| `contain-intrinsic-block-size` | `cibs` | contain-intrinsic-block-size ★ |
| `contain-intrinsic-height` | `cish` | contain-intrinsic-height ★ |
| `contain-intrinsic-inline-size` | `ciis` | contain-intrinsic-inline-size ★ |
| `contain-intrinsic-size` | `cis` | contain-intrinsic-size ★ |
| `contain-intrinsic-width` | `cisw` | contain-intrinsic-width ★ |
| `content-visibility` | `cv` | content-visibility |

## Interaction

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `appearance` | `ap` | appearance |
| `content` | `cnt` | content |
| `counter-increment` | `coi` | counter-increment |
| `counter-reset` | `cor` | counter-reset |
| `counter-set` | `cos` | counter-set ★ |
| `cursor` | `cur` | cursor |
| `interactivity` | `ia` | interactivity ★ |
| `pointer-events` | `pe` | pointer-events |
| `quotes` | `q` | quotes |
| `touch` | `toa` | touch-action |
| `user-select` | `us` | user-select |
| `will-change` | `wc` | will-change |
| `zoom` | `zom` | zoom |

## Outline

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `outline` | `ol` | outline |
| `outline-color` | `olc` | outline-color |
| `outline-offset` | `olo` | outline-offset |
| `outline-style` | `ols` | outline-style |
| `outline-width` | `olw` | outline-width |

## List & Table

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `caption-side` | `cps` | caption-side |
| `empty-cells` | `ec` | empty-cells |
| `list-style` | `lis` | list-style |
| `list-style-image` | `lisi` | list-style-image |
| `list-style-position` | `lisp` | list-style-position |
| `list-style-type` | `list` | list-style-type |
| `table-layout` | `tbl` | table-layout |

## Columns

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `column-count` | `colmc` | column-count |
| `column-rule` | `colmr` | column-rule |
| `column-rule-color` | `colmrc` | column-rule-color |
| `column-rule-style` | `colmrs` | column-rule-style |
| `column-rule-width` | `colmrw` | column-rule-width |
| `column-width` | `colmw` | column-width |
| `columns` | `colm` | columns |

## SVG

Uses `stk` prefix for stroke properties. ★

| Token | Abbr | Property |
| ----- | ---- | -------- |
| `dominant-baseline` | `dbl` | dominant-baseline ★ |
| `fill` | `fill` | fill |
| `fill-opacity` | `filo` | fill-opacity ★ |
| `fill-rule` | `filr` | fill-rule ★ |
| `marker` | `mkr` | marker |
| `marker-end` | `mkre` | marker-end ★ |
| `marker-mid` | `mkrm` | marker-mid ★ |
| `marker-start` | `mkrs` | marker-start ★ |
| `stop-color` | `stpc` | stop-color ★ |
| `stop-opacity` | `stpo` | stop-opacity ★ |
| `stroke` | `stk` | stroke ★ |
| `stroke-color` | `stkc` | stroke-color ★ |
| `stroke-dasharray` | `stkda` | stroke-dasharray ★ |
| `stroke-dashoffset` | `stkdo` | stroke-dashoffset ★ |
| `stroke-linecap` | `stklc` | stroke-linecap ★ |
| `stroke-linejoin` | `stklj` | stroke-linejoin ★ |
| `stroke-miterlimit` | `stkml` | stroke-miterlimit ★ |
| `stroke-opacity` | `stko` | stroke-opacity ★ |
| `stroke-width` | `stkw` | stroke-width ★ |
| `text-anchor` | `tanc` | text-anchor ★ |

## Custom Additions ★

Summary of all non-standard entries. Examples use Token form (recommended).

| Token | Abbr | Meaning | Example (Token form) |
| ----- | ---- | ------- | -------------------- |
| `animation-composition` | `animco` | animation-composition | `--ui-anim-animation-composition` |
| `animation-timeline` | `animtl` | animation-timeline | `--ui-scroll-animation-timeline` |
| `column-gap` | `cg` | column-gap | `--ui-grid-column-gap` |
| `contain-intrinsic-*` | `cis*` | contain-intrinsic-* | `--ui-lazy-contain-intrinsic-size` |
| `container-name` | `cn` | container-name | `--ui-card-container-name` |
| `corner-*` | `cr*sh` | corner-*-shape | `--ui-card-corner-shape` |
| `container-type` | `ct` | container-type | `--ui-card-container-type` |
| `container` | `ctr` | container (shorthand) | `--ui-card-container` |
| `duration` | `dur` | transition/animation duration | `--ui-toast-duration` |
| `ease` | `ease` | timing-function | `--ui-drawer-ease` |
| `field-sizing` | `fdsz` | field-sizing | `--ui-input-field-sizing` |
| `interpolate-size` | `ipsz` | interpolate-size | `--ui-expand-interpolate-size` |
| `mask-*` | `mk*` | mask-* (`mk` avoids margin `m*` clash) | `--ui-hero-mask-image` |
| `max-bs` | `maxbs` | max-block-size | `--ui-panel-max-bs` |
| `max-is` | `maxis` | max-inline-size | `--ui-dialog-max-is` |
| `min-bs` | `minbs` | min-block-size | `--ui-row-min-bs` |
| `min-is` | `minis` | min-inline-size | `--ui-sidebar-min-is` |
| `offset-*` | `off*` | offset / motion path | `--ui-path-offset-distance` |
| `overlay` | `ovl` | overlay | `--ui-popover-overlay` |
| `paint-order` | `pao` | paint-order | `--ui-text-paint-order` |
| `place-items` | `pli` | place-items | `--ui-grid-place-items` |
| `place-self` | `pls` | place-self | `--ui-cell-place-self` |
| `reading-flow` | `rfl` | reading-flow | `--ui-grid-reading-flow` |
| `shadow` | `sh` | box-shadow | `--ui-card-shadow` |
| `scroll-timeline-*` | `stl*` | scroll-timeline-* | `--ui-parallax-scroll-timeline-name` |
| `stroke-*` | `stk*` | stroke-* (`stk` avoids scroll `s*` clash) | `--ui-chart-stroke-width` |
| `sz` | `sz` | size (width = height) | `--ui-icon-sz` |
| `text-box-*` | `txb*` | text-box-* | `--ui-heading-text-box` |
| `text-wrap-*` | `tw*` | text-wrap-* | `--ui-prose-text-wrap-mode` |
| `transition-behavior` | `trsb` | transition-behavior | `--ui-modal-transition-behavior` |
| `view-timeline-*` | `vtl*` | view-timeline-* | `--ui-scroll-view-timeline-name` |
| `view-transition-name` | `vtn` | view-transition-name | `--ui-card-view-transition-name` |
