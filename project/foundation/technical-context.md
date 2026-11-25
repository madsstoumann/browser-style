---
name: technical-context
description: "Constraints, hosting, existing systems and the reasons behind the technical choices"
metadata:
  type: project
  version: "0.2.0"
  status: draft
  audience: people-and-agents
  owner: tech-lead
  contributors: []
  depends_on: [product-context, boundaries]
  open: [hosting, systems, unknowns]
  changelog: memory/changelog/technical-context.md
  updated: 2026-11-25
---

# Technical context

What the code cannot say for itself. The stack, the components and the integrations are generated from the repo; they are not repeated here.

## Starting point

- The v4 line is on the `v4` branch. 57 of about 194 folders under `ui/` are v4 packages.
- The rest are v3 components waiting for conversion. They are input to a conversion, never a pattern to copy.
- Pre-v4 code that still sits on disk is listed under Legacy in `AGENTS.md`.

Draft from the repo, not yet confirmed by a person. Source: `AGENTS.md` (Component categories, Legacy).

## Hosting and environments

- The `v4` branch deploys by itself to Cloudflare Pages on every push; the preview is v4.browser.style.
- The homepage is browser.style.
- Packages are published to the public npm registry under `@browser.style/*`.

Still to answer: who owns the Cloudflare and npm accounts, and whether there are other environments.

Draft from the repo, not yet confirmed by a person. Source: `docs/v4.md` (gate 8), `AGENTS.md`, `_headers`.

## Existing systems

## Choices and their reasons

- CSS-first, JavaScript only as progressive enhancement: the browser baseline makes native features load-bearing.
- Light DOM, no Shadow DOM: so page CSS and frameworks reach the elements.
- Behaviour chosen by token strings on attributes, not class combinations.
- Zero-specificity selectors (`:where()`): so consumers override without specificity wars.
- One bundle per package, loaded in dependency order: so requests run in parallel.
- Monorepo with npm workspaces and independent versions.

Draft from the repo, not yet confirmed by a person. Source: `AGENTS.md` (Architecture principles, The v4 systems).

## Constraints

- Browsers: Chrome 150+ and Safari 26.5+. Firefox is not a support target. No fallback for a feature both engines support.
- The two engines differ in three places that already have handling (typed `attr()`, scroll markers, masonry); both arms must keep working.
- Performance: the CPU/GPU policy in `docs/performance.md`; component and demo pages stay within rating A, at most 531 KB transfer.
- Pushing `v4` costs a deploy, and the version and publish scripts publish to the public registry: neither runs unprompted.

Draft from the repo, not yet confirmed by a person. Source: `AGENTS.md` (Browser support baseline), `docs/sustainability.md`, `docs/v4.md` (gate 8).

## Unknowns

The live backlog is `docs/plans/open-items.md`. It is not repeated here.

Still to answer: which of those items could change the plan, and who can find out.

Draft from the repo, not yet confirmed by a person. Source: `docs/v4.md` (Read first, 2).
