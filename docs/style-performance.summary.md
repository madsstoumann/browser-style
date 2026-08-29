# Style performance, in plain language

> The short, jargon-free version of [`style-performance.md`](style-performance.md) —
> what we asked, what we measured, what we changed, and a glossary for the terms the
> full report leans on. Numbers rounded; every one of them comes from the full
> report's traces.

## What we asked

browser.style styles pages with tokens on attributes — `media="asr(16/9) nav"`,
`content="lg:hl(3xl)"`, `lg="grid(3a)"` — instead of long class lists. That is
exactly the kind of CSS that performance folklore warns about: lots of attribute
selectors, deep inheritance, `:has()`. So: **is the system actually slow? Should any
of it be redesigned? And would Tailwind — the compiled utility-class approach — be
faster?**

## What we did

We drove a real Chrome through the heaviest demo page (`schema.html`: about 3,000
elements, one 442 KB stylesheet with about 3,150 rules), recorded exactly where the
browser spent its styling time, and repeated every measurement five times, keeping
the middle result. Then we ran controlled experiments: flip one token on one card
and time it; delete groups of rules and time again; rewrite the system's selectors
into Tailwind-style flat classes on the same page and compare.

## What we found

1. **Loading the page is fine.** All the styling work on first load takes about a
   tenth of a second on the stress page, and reading the whole 442 KB stylesheet
   takes 6 milliseconds. The browser is smart about big stylesheets: it files rules
   in an index (see *bucketing* below) so having thousands of rules doesn't mean
   checking thousands of rules.

2. **Changing one token was expensive — 36 ms — but not for the reason you'd
   guess.** Flipping one token on one card made the browser re-check ~530 elements.
   The culprit wasn't the token system at all: it was a handful of `:has()` rules
   that mentioned the `media` attribute *inside* their condition. The browser keeps
   a list of attribute names used inside `:has()` conditions, and any change to such
   an attribute — anywhere on the page — triggers a page-wide re-check. Deleting
   those few rules dropped the cost from 36 ms to 2 ms with everything else intact.

3. **The system's most unusual feature is its cheapest.** `content=` works by
   passing CSS variables down the tree, and changing it costs 2 ms — the best
   mutation number of all the token types. The design instinct behind it is
   validated, not indicted.

4. **Tailwind's approach measures faster, and it wouldn't matter.** Rewriting all
   the token selectors as flat classes halved the cost of a full-page restyle
   (38 → 18 ms) — but full-page restyles only happen at load and on window resize,
   which are already cheap. The one scary number (the 36 ms flip) was the `:has()`
   issue, which would cost a Tailwind page exactly the same. And Tailwind cannot
   express what the system actually does: one token on a card driving a coordinated
   set of children, with inheritance stopping at card boundaries. A port would keep
   the component CSS and add Tailwind on top — all cost, no benefit.

## What we changed (done, on this branch)

The `:has()` rules that mentioned token attributes were reworked so they no longer
do — without adding any runtime JavaScript, keeping the system's CSS-first
contract: the page *renderer* now writes the lightbox ratio token where CSS
inheritance can reach it (verified working with JavaScript switched off), one
cover-card rule now simply requires its token on the card (documented), and one
video rule dropped a redundant condition. A new automated check (lint) fails the
build if anyone reintroduces the pattern.

**Result, re-measured: flipping a token now costs 2 ms instead of 36 ms.** Opening
the fullscreen lightbox improved modestly (452 → 420 ms); its remaining cost is a
different, known mechanism, tracked separately.

## The verdict

**Keep the token system.** It measured sound everywhere it was suspected, its
distinctive inheritance design is the cheapest part, and the one real cost was a
removable coupling — now removed and guarded by a lint. Don't migrate to
Tailwind: the measured benefit is negligible where it exists, and the system's
core semantics don't survive the translation.

## Glossary

- **Style recalculation ("recalc")** — the browser working out, for each affected
  element, which CSS rules apply and what the final styles are. This happens on
  load and again after anything changes. It's separate from *layout* (working out
  sizes and positions) and *paint* (drawing pixels).
- **Selector matching** — checking whether one CSS rule applies to one element.
  Style recalculation is millions of these little checks.
- **Bucketing** — the browser's index for rules. Rules are filed by the last part
  of their selector (a class name, a tag, an attribute name) like folders in a
  filing cabinet, and an element only pulls the folders that could possibly apply
  to it. This is why 1,000 `[media*=…]` rules cost nothing to elements that have
  no `media` attribute.
- **Fast-reject** — a cheap pre-check that says "this rule can't possibly match
  here" before doing the full, expensive check — like glancing at the envelope
  before reading the letter. The layout rules pass this 98% of the time, which is
  a sign the system is browser-friendly, not a problem.
- **Invalidation** — after something changes, the browser's answer to "who needs
  re-checking?" Good invalidation re-checks 7 elements; bad invalidation
  re-checks 500 of them. The whole `:has()` finding is an invalidation story.
- **`:has()`** — a CSS condition about an element's *contents* ("a card that
  contains a cover link"). Powerful, but expensive to keep up to date: a change
  deep inside means re-checking from above, and the browser is deliberately
  cautious about when to re-check — which is how a few rules taxed the whole page.
- **Custom-property inheritance** — CSS variables (`--ui-content-headline`) flow
  down from parent to child automatically. `content=` tokens work by setting
  variables high up and letting components read them below — cheap, because the
  browser tracks exactly who reads what.
- **Median (of 5 runs)** — run the measurement five times, keep the middle value.
  One run can be unlucky; the middle of five is stable.

*Full data, method, and the reproducible measurement harness:
[`style-performance.md`](style-performance.md).*
