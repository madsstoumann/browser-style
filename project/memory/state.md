---
name: state
description: "Where Browser Style is: phase, size, blockers and the interview's open questions"
metadata:
  type: project
  generated: true
  phase: context
  size: medium
  updated: 2026-11-25
---

# State

Kept by the project skills. A question's status is `open`, `answered`, `skipped` (someone else should answer; say who in the note) or `parked` (talk cannot settle it; say what would).

## Blockers

## Questions

| id | file | role | status | question | note |
|---|---|---|---|---|---|
| what | product-context | pm | answered | In two sentences: what are we building, and what does it replace or add to? | draft from the repo, to confirm |
| who | product-context | pm | open | Who uses it, and who pays for it? Name each group once. | |
| why-now | product-context | pm | open | What made this a project now, and what happens if it slips? | |
| goals | product-context | pm | open | Which two or three outcomes make this a success, and how will each be measured? | |
| roles | product-context | pm | open | Who fills each role (pm, experience-lead, designer, tech-lead, qa, client contact), and who decides when two of them disagree? | |
| deadline | product-context | pm | open | Which dates are fixed, and what is fixed about budget or team? | |
| audiences | experience | experience-lead | open | For each group of users: what are they trying to get done, and where are they when they do it? | |
| experience-goal | experience | experience-lead | open | What should a person be able to do, or feel, after using it that they cannot today? | |
| principles | experience | experience-lead | open | Which three to six principles settle a design argument here? Each as a choice: this over that. | |
| not | experience | experience-lead | open | What will people expect this to be that it is deliberately not? | |
| must | boundaries | pm | open | What must be true at launch whatever else is cut? | |
| must-not | boundaries | pm | open | What must it never do, say or decide on a person's behalf? | |
| compliance | boundaries | pm | answered | Which laws, standards or contracts apply: privacy, accessibility (which level), sector rules, the client's own policies? | draft from the repo, to confirm |
| out-of-scope | boundaries | pm | open | What has someone asked for that is not in this project? | |
| exceptions | boundaries | pm | open | Who can allow an exception to a boundary, and where is that recorded? | |
| starting-point | technical-context | tech-lead | answered | Is there existing code, content or data this starts from? Where is it, and what state is it in? | draft from the repo, to confirm |
| hosting | technical-context | tech-lead | open | Where will it run, who owns that account, and which environments are needed? | repo shows where; missing: who owns the accounts |
| systems | technical-context | tech-lead | open | Which systems must it talk to (CMS, commerce, identity, data sources), and who owns each? | |
| choices | technical-context | tech-lead | answered | Which technical choices are already made, and what was the reason for each? | draft from the repo, to confirm |
| tech-constraints | technical-context | tech-lead | answered | What limits the build: browsers and devices, performance, security review, the client's IT rules? | draft from the repo, to confirm |
| unknowns | technical-context | tech-lead | open | What do we not know yet that could change the plan, and who can find out? | repo points to docs/plans/open-items.md; missing: which items could change the plan |
| design-source | design | designer | answered | Where do design tokens originate: this DESIGN.md, a design tool's variables, or existing code? The other forms are generated from that one. | draft from the repo, to confirm |
| design-direction | design | designer | answered | In a few sentences: the look and feel, and the brand material it starts from. | draft from the repo, to confirm |
| design-colors | design | designer | parked | The colour roles (primary, secondary, neutral, surface, error) and their values, if they exist yet. | tokens live in ui/base/tokens.css; needs a generator from CSS to DESIGN.md tokens |
| design-type | design | designer | parked | The typefaces and the type levels, if they exist yet. | tokens live in ui/base/tokens.css; needs a generator from CSS to DESIGN.md tokens |
| agent-rules | agents | tech-lead | open | What would an agent get wrong in this repo without being told? Only non-standard practices; one line each. | root AGENTS.md already holds the rules, mixed with a 14 KB overview; not edited in this run |
