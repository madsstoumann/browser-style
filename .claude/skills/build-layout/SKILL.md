---
name: build-layout
description: Use when layout CSS needs rebuilding after editing layout.config.json or layouts/*.json, when layout/dist/layout.css looks stale, when trimming shipped layout CSS down to only the layouts a project actually uses, or when setting up a project-local layout.config.json.
argument-hint: "[folder to scan for usage] [--local <dir>]"
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, AskUserQuestion
---

# Building layout CSS

Two modes. Decide first: **rebuild** (config or layout JSON changed) or **prune** (ship only
what a project uses).

Full option reference lives in `layout/AGENTS.md` §§ *Custom Configuration*,
*Configuration Options*, *Build Commands*, *LayoutBuilder Class* — read it rather than
guessing flags.

## Mode A — rebuild

All commands run from `layout/`:

| Command | Produces | Run it when |
|---|---|---|
| `npm run build` | `dist/layout.css` + `dist/layout.min.css` | config or `core/*.css` changed |
| `npm run build:maps` | `layouts-map.js` (srcset data) | a layout's `srcset`, or a breakpoint width, changed |
| `npm run build:demo` | `dist/*.html` (per-family pages, `overflow.html`, `icons.html`, `index.html`) + icons | a layout was added/renamed |
| `npm run build:icons` | `dist/icons/*.svg` (wipes the dir first) | an `icon` rect array changed |
| `npm run build:all` | all of the above, in order | after adding a layout — the safe default |

Config resolution (`layout/build.js`): `--config <path>` → `layout.config.json` in the
current directory → the package default. The output path follows the config's location, so
running from a project directory writes that project's `dist/layout.css`.

## Mode B — prune to actual usage

Goal: a `layout.config.json` that generates only the tokens a project's markup uses.

1. **Collect usage.** Find every layout element and read all six breakpoint attributes,
   including values built in JS template literals:

   ```bash
   grep -rhoE '<lay-out(-group)?[^>]*' <folder> --include='*.html' --include='*.js' \
     | grep -oE '\b(xs|sm|md|lg|xl|xxl)="[^"]*"' | sort -u
   ```

2. **Tokenize** each attribute value into: layout tokens `prefix(id)`, spacing tokens
   `p|pi|pb|pbs|pbe|mbs|mbe|cg|rg(N)`, `items(…)`, bare `subgrid`. Also collect standalone
   attributes that need engine CSS (`bleed`, `overflow`, `gap-decorations`, `width`).

3. **Draft the minimal config.** Per breakpoint, use the object form for sparse usage
   (`{ "grid": ["grid(3a)"] }`) and a bare family string only when most of a family's
   variants are used. **The object key is the JSON filename** — `asymmetrical`, `autofit`,
   `ratios` — not the token prefix.

4. **Trim spacing** to the breakpoints and steps actually used, via `spacing.breakpoints`
   and `spacing.tokens` (or a per-breakpoint `spacing` override; `[]` disables).

5. **Ask where it lands.** `AskUserQuestion`: rewrite the global
   `layout/layout.config.json` (affects everything the repo ships) or add a project-local
   `layout.config.json` (affects only that project's build). Include the size delta.

6. **Rebuild and verify** — always verify, the build reports success either way:

   ```bash
   grep -c 'lay-out {' <out>/layout.css                 # the engine is present (see trap below)
   grep -c '\[lg\*="grid(3a)"\]' <out>/layout.css        # every collected token, one by one
   ls -l <out>/layout.css                                # size delta vs before
   ```

## Sharp edges

- **A project-local config with no sibling `core/` builds engine-less CSS.** `coreDir`
  defaults to `dirname(configPath) + '/core'`; if it is missing the builder only logs
  `⚠ CSS file not found` and still "succeeds" — you get selector rules with no `lay-out`
  base rule, so nothing lays out. Either keep the config next to the package `core/`, or
  call `buildLayout({ configPath, coreDir })` programmatically with an explicit `coreDir`.
  **Grep the output for the engine before believing a local build.**
- **`build:maps` needs a width for every breakpoint** — it reads `min ?? srcsetMin`. The
  mobile-first base has no `min`, so it must declare `srcsetMin` (shipped: `"240px"`) or
  the srcset map is wrong. `srcsetConfig` (flat) and `layoutConfig` (nested) are different
  shapes — do not conflate them.
- **Never prune away the base breakpoint or `stack`.** The min-less base emits the
  un-media-queried rules everything else overrides. `stack` matches by the substring
  `stack(`, so *any* `stack(anything)` in the markup needs the family present at that
  breakpoint.
- **Removing a breakpoint removes its cascade layer.** `@layer layout.xs, layout.sm, …` is
  generated from the config's key order, so layer order follows config order — keep the
  keys ascending.
- `config.include` is absent from the shipped config but still honoured by
  `src/builder.js`; treat it as deprecated, not removed.
