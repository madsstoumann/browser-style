---
version: alpha
name: Browser Style
description: "Direction and tokens for every surface of Browser Style"
omitted:
  - section: colors
    reason: "Defined in code (ui/base/tokens.css); to be generated"
  - section: typography
    reason: "Defined in code (ui/base/tokens.css); to be generated"
  - section: spacing
    reason: "Defined in code (ui/base/tokens.css); to be generated"
  - section: rounded
    reason: "Defined in code (ui/base/tokens.css); to be generated"
  - section: motion
    reason: "Defined in code (ui/base/tokens.css); to be generated"
  - section: components
    reason: "Component guidance lives in components/, one file each"
metadata:
  type: project
  version: "0.2.0"
  status: draft
  audience: people-and-agents
  owner: designer
  contributors: [frontend]
  depends_on: [experience, boundaries]
  open: [design-colors, design-type]
  changelog: memory/changelog/design.md
  updated: 2026-11-25
---

## Overview

Tokens originate in code: `ui/base/tokens.css` is the source of truth, with colours generated from `ui/base/palette.json`. The token reference that already exists is the `DESIGN.md` at the repo root; this file does not repeat it.

The look is neutral by design: no strong brand colour, an achromatic base with one muted blue accent, light and dark handled by `light-dark()`. Components should feel like natural extensions of the browser's own UI, with consistent spacing, type and subtle depth.

Draft from the repo, not yet confirmed by a person. Source: root `DESIGN.md` (Overview, Token source of truth).

## Colors

## Typography

## Layout

## Do's and Don'ts
