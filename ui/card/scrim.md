Material Design (Google) — defines "scrim" explicitly as a solid-to-transparent gradient behind text. Its signature spec is a long gradient with the midpoint biased ~3/10 toward the dark end (avoids a hard edge), plus an opacity on the dark end. → This is exactly the size axis I added (the mid-stop bias) + intensity.

Apple HIG — the outlier: no "scrim." Uses materials + vibrancy (blur layer + discrete vibrancy levels: default→secondary→tertiary→quaternary). No directional gradient. → Confirmed intensity should be stepped levels, which is why we went with sheer/lgt/med/drk/solid rather than a free number.

Tailwind / DaisyUI / Radix / shadcn — none ship a scrim primitive; you compose it: direction (bg-gradient-to-t), stop positions (from-0% via-30% to-100% = extent), opacity (from-black/80). DaisyUI's Hero overlay is just a flat bg-black/…. → Validated the three-token, composable approach.

CSS practice (Larsen / CSS-Tricks "easing gradients") — the notable refinement: a 2-stop gradient bands visibly; multi-stop easing gradients blend invisibly. → I flagged this as an optional future 4th axis (falloff smoothness), out of scope here.

The consistent takeaway across all sources was three independent axes — direction · extent/size · intensity/opacity — which is precisely what scm() now exposes. Full source list is in the plan's context section.