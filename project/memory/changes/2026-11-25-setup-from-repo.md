---
name: 2026-11-25-setup-from-repo
description: "Project files set up and pre-filled from what the repo already says"
metadata:
  type: change
  date: 2026-11-25
  status: applied
  asked_by: tech-lead
  bumps: [product-context:minor, boundaries:minor, technical-context:minor, design:minor]
  decision: none
  supersedes:
---

## Asked

A simulated run of `/project:new` on this repo, size medium, with nobody answering. Seven questions were filled from the repo's own docs as drafts: what, compliance, starting-point, choices, tech-constraints, design-source and design-direction. No role has confirmed them.

## Why

To see how the setup behaves on a repo that already has an `AGENTS.md`, a `DESIGN.md` and its own skills.

## Deltas

- product-context: ADDED What it is
- boundaries: ADDED Compliance (accessibility and sustainability; privacy and licence not stated)
- technical-context: ADDED Starting point, Choices and their reasons, Constraints; partial text under Hosting and Unknowns, both still open
- design: ADDED Overview, pointing at `ui/base/tokens.css` and the root `DESIGN.md`; token sections stay omitted, colours and type parked until they can be generated from the CSS

## Decision

## Hooks

None proposed.
