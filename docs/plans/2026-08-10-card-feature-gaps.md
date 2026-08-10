# Card feature gaps — legacy systems vs v4 (plan, not implementation)

> Feature-level diff of both legacy card systems (`content/card/src` — 26 BaseCard
> classes; `content/card/demo` — single-class prototype) against `ui/card` v4.
> Schema/microdata parity is DONE (see `2026-08-05-card-schema-coverage.md` and
> PR #37, which closed the first feature batch: `links[]`, limitations ✗-list,
> priority chip, amenities, verify action, @handle, visible valid-until, qa
> ui-quote answers). This document is the remaining *feature* backlog with a
> recommendation per item — nothing here is committed work.

Legend: **adopt** (fits CSS-first, cheap) · **adapt** (fits with a different
mechanism than legacy used) · **on-demand** (small, wait for a consumer) ·
**reject** (deliberate non-goal, with reason).

## A. Interactive (JS = progressive enhancement only)

| # | Feature | Legacy behaviour | v4 today | Recommendation |
|---|---------|------------------|----------|----------------|
| A1 | **Poll live voting** | radio/checkbox form, POST to `poll.endpoint`, `VoteAction`, `allowMultiple`, `showResults: afterVote\|always`, live endpoint demo (`api/polls/poll-1.json`) | static result bars (radios render but are inert) | **adapt** — best candidate for a new optional module (`poll.js`, same pattern as `video.js`): form submit → fetch endpoint → re-render bars; CSS-only fallback stays the static results. Details additions: `endpoint`, `allowMultiple`, `showResults` |
| A2 | Booking slot picker | `availableSlots[]{date,times[]}` buttons + `booking-slot-selected` event | not rendered | **on-demand** — slot buttons could render CSS-only (chips/buttons) with a tiny event dispatch; but a booking flow is app territory, the card should stop at "emit the chosen slot" |
| A3 | Review "helpful" vote | `helpfulVotes` count + click affordance | not rendered | **reject** — voting is app state; engagement counters already display counts. If ever wanted, it rides A1's module pattern |
| A4 | Announcement dismiss | `isDismissible` flag (legacy never wired the button either) | not rendered | **reject** — dismissal is page/app state, not card content. A consumer can wrap the card in its own dismiss UI |

## B. Data visualization (CSS-only feasible — strongest candidates)

| # | Feature | Legacy | v4 today | Recommendation |
|---|---------|--------|----------|----------------|
| B1 | **Statistic sparkline** | `chartData[]` → CSS bar row (main package rendered it; demo shipped the CSS unused) | trend arrow + percentage only | **adopt** — pure-CSS bar row (grid of `<i>`/`<span>` heights or one `<progress>` per bar), no JS, no new component. Details addition: `chartData[]` |
| B2 | **Statistic target progress** | `targetValue` → progress bar | not rendered | **adopt** — `<progress max value>` styled by the existing `ui/progress` package (already a peer for poll/comparison). Details additions: `targetValue`, `targetDisplay` |
| B3 | Comparison criteria matrix | feature × item table, winner highlighting, auto pros/cons (main package only) | flat name/price/score list — documented non-goal ("wrong density at card widths", docs/card.md) | **adapt (optional)** — keep the list as the base arm; a `lg:` container-tier arm *could* show the matrix once the card is ≥44rem. Only worth it if a consumer actually places comparison cards that wide |

## C. Media / embeds

| # | Feature | Legacy | v4 today | Recommendation |
|---|---------|--------|----------|----------------|
| C1 | Business map embed | templated OSM iframe from `geo` + `mapProvider` bbox | "Open in Maps" link (deliberate) | **reject as default** (third-party iframe = perf + consent weight); the link is the right default. If a visual is wanted: a static map *image* as a normal `media[]` item — zero new machinery |
| C2 | Software screenshots[] | dedicated field, never a gallery | — | **non-gap** — v4 `media[]` with >1 item IS a carousel; screenshots are just media items. Document the pattern in docs/card.md, no code |
| C3 | Gallery downloadOptions[] | list of download links | — | **non-gap since PR #37** — the envelope `links[]` part covers it (`{url, text: "Download JPEG"}`) |

## D. Editorial details (small renderer/prose additions, wait for need)

| # | Feature | Legacy | Recommendation |
|---|---------|--------|----------------|
| D1 | Course `learningOutcomes[]`, `courseWorkload`, instructor title/experience | rendered as ✓ list + meta | **on-demand** — `listPart()` + one meta row; also emits `teaches`/`courseWorkload` microdata (SEO win) |
| D2 | Event ticket tiers `offers[]{name,price,currency}` | data existed, price never rendered | **on-demand** — price part per tier + `offers` → Offer scopes; already flagged as an SEO restoration in the 2026-08-05 analysis |
| D3 | Location `rating` | ★ stars (no microdata) | **on-demand** — `ratingPart()` exists; one line + details prose |
| D4 | Contact `department`, per-method availability dot | meta + green dot | **on-demand** — meta row + `ui-chip`/`ui-beacon` for availability |
| D5 | Review `itemReviewed` price/image | hidden Offer + image | **on-demand** — part of the same SEO-restoration batch as D2 |

## E. Engine-level (cross-cutting — decide deliberately)

| # | Feature | Legacy | v4 today | Recommendation |
|---|---------|--------|----------|----------------|
| E1 | **Renderer chrome i18n** | poll had `labels{}` overrides | ~20 hardcoded English strings ("Serves", "Director:", "votes", "Valid until", "Verify credential", …) | **adopt (design first)** — single exported `STRINGS` table in render.js, overridable via a `renderCard` option; UCF already carries `meta.locale`. The one gap that blocks non-English sites |
| E2 | Headline tag control (`headlineTag: h2\|h3`) | per-item data field | hardcoded `h3` (`strong` in overlays) | **adapt** — heading level is a *placement* concern, not content: if adopted, put it on the **preset** (`headlineTag`), never back into the content model |
| E3 | Furniture on media-less cards | ribbon/sticker silently lost without media (legacy bug) | same structural limit — furniture lives in `<ui-media>` | **reject** — `vis(content)` cards have tags-chips, theme and the announcement-style chip row in the text column; overlay furniture without a frame has nowhere honest to sit |
| E4 | `eyebrow(outside)` placement | eyebrow above the card frame | not a v4 token | **reject** unless a design asks — trivially a `content=` token later |
| E5 | `useSchema` toggle | settings flag to strip microdata | always-on | **reject** — always-on microdata is the system's point |

## Suggested order (if/when picked up)

1. **E1 i18n strings** — unblocks localized consumers, pure refactor, zero visual change (snapshot-identical for en-US).
2. **B1 + B2 statistic viz** — CSS-only, high demo value.
3. **A1 poll voting module** — first new JS module; sets the pattern A2 would reuse.
4. **D-batch** — fold into the SEO-restoration pass already listed in the 2026-08-05 plan (event offers, review aggregateRating, recipe rating/totalTime, profile sameAs).

Everything else: on-demand or rejected above. Gates for any pickup: SSR snapshot
before/after, tokens build+lint ×2, browser check on schema.html + render.html,
docs in the same commit.
