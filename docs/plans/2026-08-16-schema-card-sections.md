# Grouping `demo/schema.html` into logical sections

> **Ideas only. No code changed by this document.** Written 2026-08-16 against `v4` at
> `1c3d9aa`, with every count and measurement taken from that revision.
> The question: if the 57 cards on the schema reference page were grouped into sections,
> what should the sections be?
>
> The grid spec is **parked** — the page stays `md="columns(2) items(start)"`. The
> three-column / page-width discussion that came up alongside this is recorded in
> [§ The grid](#the-grid--parked) so it need not be re-derived, but nothing was decided.

## Context

`demo/schema.html` is **one `<lay-out md="columns(2) items(start)">` holding all 57 cards**, in
accretive order: the original card types first, the model v1.3 additions next, the
[markup-first types](../../ui/card/docs/schema.md) appended at the end as they were written. It
reads as a changelog. A developer arriving with "how do I mark up a podcast?" has to scan the
whole grid.

## First: 57 cards, 59 items — both numbers are right

They measure different things, and conflating them is the trap
[`ui/card/docs/schema.md`](../../ui/card/docs/schema.md) opens with. **59** is the count of
top-level microdata items — what a structured-data validator reports. **57** is the count of
*cards*. The two non-cards need no section, and neither is a `WebPage`:

- **`WebSite`** (`demo/schema.html:81`) — a `<div … hidden>` sitting **before** `<lay-out>`
  opens at `:103`. Outside the grid entirely; it never was a cell.
- **`EmployerAggregateRating`** (`:421`) — a top-level *item* but a nested *element*, inside the
  JobPosting card as `data-part="rating"`. It travels with the job card wherever that goes.

The page *does* carry four `WebPage` **subtypes** — FAQPage, QAPage, MedicalWebPage,
RealEstateListing — but those are cards, and they are the subject of a callout below.

Reproduce either number:

```sh
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const html = readFileSync('ui/card/demo/schema.html', 'utf8');
console.log((html.match(/<ui-(card|reveal)(?![^>]*itemprop=)[^>]*itemtype=/g) || []).length)"  # → 57
```

…or in a browser console on the page: `document.querySelectorAll('[itemscope]:not([itemprop])').length` → **59**.

## There is already a taxonomy — and why it can't be used as-is

Every UCF instance carries `meta.folder` (`ui/card/data/*.json`): `Cards/Media`,
`Cards/Commerce`, `Cards/Editorial`… **22 folders for 57 cards**, and the distribution is
unusable as sections: **Media 12, Commerce 12, and eleven singletons** (Careers, Guides, Health,
Generic, News, Operations, Property, Reference, Business, Events, Support…).

It is a CMS filing tree — optimised for "where does this content live" — not a reading order.
The right starting signal at the wrong granularity. The proposal below merges the singletons and
splits the two giants.

```sh
for f in ui/card/data/*.json; do
  python3 -c "import json,sys;print(json.load(open('$f')).get('meta',{}).get('folder','—'))" 2>/dev/null
done | sort | uniq -c | sort -rn
```

## Recommended: 10 sections, by what the thing *is*

| § | Section | Cards |
|---|---|---|
| 1 | **Editorial & journalism** (5) | CreativeWork · Article · NewsArticle · Quotation · ClaimReview |
| 2 | **Commerce & offers** (9) | Product · ProductGroup · Review · Review *(testimonial)* · ItemList *(comparison)* · Offer *(membership)* · MemberProgram · Reservation · SoftwareApplication |
| 3 | **Screen** (4) | Movie · TVSeries · TVEpisode · VideoObject |
| 4 | **Audio** (4) | PodcastSeries · PodcastEpisode · MusicGroup · MusicAlbum |
| 5 | **Page & picture** (4) | Book · ComicSeries · ComicIssue · ImageGallery |
| 6 | **Learning & reference** (7) | Course · Quiz ×3 · HowTo · EducationalOccupationalCredential · DefinedTermSet |
| 7 | **People, work & history** (6) | Person *(profile)* · Person *(artist)* · Organization · JobPosting · EventSeries ×2 |
| 8 | **Places, venues & property** (7) | CafeOrCoffeeShop · Menu · Recipe · Place ×2 · RealEstateListing · Event |
| 9 | **Community & support** (6) | Question *(poll)* · FAQPage · QAPage · ContactPoint · SocialMediaPosting · DiscussionForumPosting |
| 10 | **Data, health & operations** (5) | Observation · Dataset · MedicalWebPage · SpecialAnnouncement · Service |

5 + 9 + 4 + 4 + 4 + 7 + 6 + 7 + 6 + 5 = **57**, every card placed exactly once.

**Why the Media dozen splits three ways.** Twelve cards is too long a section and the natural
seam is the *medium* — screen, audio, page. Each arm lands on four cards, and each arm carries a
container/part pair, so the sections teach the same lesson three times in three vocabularies.

## Two things this grouping hides — call them out, don't section by them

1. **Four cards are `WebPage` subtypes, not what they look like.** FAQPage, QAPage,
   MedicalWebPage and RealEstateListing are pages *about* a thing. That is why
   RealEstateListing hangs the home off `mainEntity`, and why MedicalWebPage's
   `specialty` / `reviewedBy` / `lastReviewed` are WebPage properties it merely inherits. A
   domain grouping scatters them across §8, §9 and §10 and a reader never notices they are one
   shape. Worth a cross-reference note, not a section of its own.
2. **Container/part is the page's most repeated pattern** — ProductGroup↔Product,
   PodcastSeries↔Episode, TVSeries↔Episode, MusicGroup↔Album, ComicSeries↔Issue,
   Organization↔JobPosting, CafeOrCoffeeShop↔Menu, Person(artist)↔ComicSeries. Sectioning puts
   each pair side by side for the first time; the pattern deserves naming once.

## Three inconsistencies the exercise surfaced

All verified against the current page, all cheap to fix, none fixed here:

- **Podcast is ordered backwards.** Every other pair on the page runs container-then-part
  (TVSeries→TVEpisode, MusicGroup→MusicAlbum, ComicSeries→ComicIssue). Podcast runs
  Episode→Series.
- **Two linking conventions for one relationship.** `ComicIssue` and `MusicAlbum` link to their
  sibling card with a real crawlable `<a itemprop="url">`. `TVEpisode` and `PodcastEpisode` emit
  `partOfSeries` as a **hidden, name-only scope** with no url — even though the sibling card is
  on the same page.
- **`Person` appears twice, 38 cards apart** — profile at 21, comic artist at 59. §7 is the
  first arrangement in which the two Person shapes can be compared.

## The grid — parked

The page stays `md="columns(2) items(start)"`. Recorded so it need not be re-measured:

**The two page-container tokens**, generated into `:root` from `layout/layout.config.json` →
`layoutContainer`:

| Token | Value | Config source | Applied as |
|---|---|---|---|
| `--layout-bleed-mw` | `1024px` | `maxWidth: 1024` | `body:has(lay-out) { margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw)/2) }` |
| `--layout-mi` | `1rem` | `margin: "1rem"` | the same rule — it is a **margin**, not padding; `lay-out` itself computes `padding-inline: 0` |

**"Inline inset = column gap" is already true.** `--layout-mi` is `1rem` = **16px**; the measured
`column-gap` is **16px** (`--layout-colmg: 1` × `--layout-space-unit: 1rem`). Row-gap matches.

**If three columns is ever revisited**, three findings decide it:

- Cells go **504px → 331px**, viewport-independent above ~1080px because of the 1024 cap. 331px
  is **below the card engine's first container tier** (`md:` = 25rem = 400px). Nothing breaks
  today — the page writes *zero* `md:`/`lg:` tokens, and `ui-card.css`'s only size-based
  `@container` rules (25rem / 44rem) fire exclusively for those tokens, the other two being
  `style()` queries for the unused `variant~="sub"`. But the page would then sit permanently
  under tier one, so any `md:` token added to a card later would silently never arm here.
- **The ProductGroup collage cannot adapt.** Its nested
  `<lay-out xs="cg(3xs) rg(3xs)" md="columns(2)">` uses *viewport* breakpoints (md = 540px), not
  container tiers, so it would stay two columns inside a 331px cell — roughly 160px tiles.
- **`items(start)` is load-bearing and repeats per breakpoint.** Measured first-six card heights
  with it: `676 · 576 · 509 · 523 · 747 · 681` (natural height). Without it `align-items` falls
  back to `normal` and cards **stretch to the tallest in their row**:
  `676 · 676 · 523 · 523 · 747 · 747`.

## The one structural cost of sectioning

Every card headline is an `<h2>` under a single `<lay-out>`. Real sections need `<h2>` for the
section heading and card headlines demoted to `<h3>` — a renderer/preset concern (`textTag`),
not just markup. Mechanically each section is one `<lay-out>`; `lay-out-group` exists and joins
the `bs-card` container namespace, so the cards' `md:`/`lg:` container queries keep working —
worth confirming before committing to it.

## If the sections are ever built

1. Agree the sections, then the heading levels.
2. Reorder `ui/card/demo/schema.html`.
3. Mirror the order in `ui/card/data/index.json` so `demo/render.html` matches.
4. Re-run `node ui/card/schema.compare.js`. **Id-keyed pairs are order-independent; bare-key
   pairs are not** — the regex matches the first card of a type *without* an `id`, so the
   `Review` / `EventSeries` / `Place` / `Quiz` / `Observation` duplicates need re-checking.
5. Decide whether `meta.folder` should be rewritten to match, making the sections the CMS tree
   too.

## Unrelated finding, worth its own issue

`ui/card/demo.layout.css` sets `--layout-space-unit: var(--spacing-lg, 1.5rem)` for page-level
lay-outs — *"match the old `.grid` rhythm"* — but that shim is **not present in
`dist/demo.min.css`**, and `demo/schema.html` links only the bundle. The effective unit is the
system default `1rem`, so page gaps are 16px where the shim intends 24px. Not part of this.
