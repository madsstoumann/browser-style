/* GENERATED from data/tokens.json by tokens.build.js — do not edit.
 * ES-module mirror of the manifest so render.js can import it without JSON import attributes. */
export default {
	"version": 1,
	"attributes": {
		"media": {
			"attribute": "media",
			"tokens": {
				"asr": {
					"axis": "aspect",
					"element": null,
					"args": {
						"ratio": [
							"1/1",
							"1/2",
							"6/7",
							"3/4",
							"4/3",
							"3/2",
							"2/3",
							"16/9",
							"21/9"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-media-ar"
					],
					"realProperties": true,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"ratio"
					],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:58",
						"ui/card/media.css:34",
						"ui/card/ui-card.css:303"
					],
					"notes": "Value rules are whole-token (~=) so md:/lg: forms don't leak into the base. MIXED matching: the min-block-size:0 reset (media.css:34-35) is substring [media*=\"asr(\"] and ships both arms (NOT R-14-step-4 migratable: its subject IS <ui-media>, and a style query resolves against the subject's nearest ANCESTOR, so the self arm would have no flag holder to read), so a prefixed-only asr() also drops the 12.5rem floor. md:/lg: rules (ui-card.css:303,401) are dual-armed: host arm :is(cq-box, summary) + self arm ui-media[media~=…], inside the NAMED @container bs-card. ui-media-srcset.js:93 also reads asr(w/h) (substring) to pick the CDN srcset ratio."
				},
				"obp": {
					"axis": "position",
					"element": null,
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-media-op"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:76"
					],
					"notes": "The one logical position grid, same spelling as furniture/ovr()/scm()/plc(). Written two-axis: the block letter sets --_obp-b, the inline letter sets --_obp-i from base's --_dir-s/--_dir-e, so s/e mirror under dir=rtl with no :dir() arm of its own. object-position has no logical keywords in any engine (the css-values-4 spellings x-start/inline-start/start are unimplemented), which is why the resolver exists. The physical tl/tr/cl/cr/bl/br spellings were REMOVED in v5 — for an image-space focal point that must not mirror, set the public --ui-media-op directly (it also takes percentages: style=\"--ui-media-op: 30% 20%\"), or mirror the asset with flp(h)."
				},
				"rds": {
					"axis": "corners",
					"element": null,
					"args": {
						"size": [
							"non",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl",
							"full",
							"pill",
							"sm-sq",
							"md-sq",
							"lg-sq",
							"xl-sq"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-media-radius",
						"--ui-media-squircle-exp"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:110",
						"ui/card/media.css:119",
						"ui/card/media.css:123"
					],
					"notes": "corner-shape: superellipse() is applied by a stem-less needle [media*=\"-sq)\"] (media.css, dual arm), not by rds( itself. The dual arm is permanent: corner-shape's subject IS <ui-media>, so R-14 step 4's flag pattern cannot reach it (a container cannot restyle itself). Serves the STANDALONE frame; inside a card the host's overflow:hidden owns the corners (see the parallel --ui-card-* scale, ui-card.css:64-80). A nested frame under clip= gets --ui-media-radius:0 (media.css:50)."
				},
				"obf": {
					"axis": "fit",
					"element": null,
					"args": {
						"mode": [
							"cover",
							"contain",
							"fill",
							"none"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-media-fit"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:130"
					],
					"notes": "obf(none) is the only place `none` survives as a canonical arg (it is the CSS object-fit keyword, not the rds(non) family)."
				},
				"flp": {
					"axis": "flip",
					"element": null,
					"args": {
						"mode": [
							"h",
							"v",
							"hv"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-media-fl-x",
						"--ui-media-fl-y"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:136",
						"ui/card/media.css:28"
					],
					"notes": "Composes with hov(tilt): media.hover.css:92-97 re-applies scale(fl-x, fl-y) inside the tilt transform list so flip survives."
				},
				"shp": {
					"axis": "shape",
					"element": null,
					"args": {
						"shape": [
							"pt-d",
							"pt-u",
							"pt-l",
							"pt-r",
							"cut-r",
							"cut-l",
							"skew-r",
							"skew-l",
							"para",
							"rhomb",
							"inset",
							"hex",
							"chev-l",
							"chev-r",
							"arr-l",
							"arr-r",
							"star",
							"plus",
							"minus",
							"close",
							"bolt",
							"msg",
							"frame",
							"frame-in",
							"blinds-h",
							"blinds-v",
							"curve-d",
							"curve-u",
							"curve-r",
							"curve-l",
							"circle",
							"circ-45"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-media-shape",
						"--ui-shape-morph",
						"--_shp",
						"--_shp-full",
						"--_r4",
						"--_r5",
						"--_r5l",
						"--_r5r",
						"--_ell",
						"--_shp-clip"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:196",
						"ui/card/media.shapes.css:19",
						"ui/card/media.shapes.css:41"
					],
					"notes": "Split: the CLIP MECHANISM (background:#0000 on the frame + clip-path on the image) ships in media.css; the 32-shape LIBRARY is the OPT-IN sheet media.shapes.css, which must be linked separately. R-14 step 4 (v5): the real-property rules are now ONE flag setter + ONE @container style() block instead of two selector arms — style queries need Chromium 111+ / Safari 18+ / Firefox 128+, see media.md § \"v5 support posture\". The image clip-path is flag-driven (--_shp-clip, subject `ui-media :is(iframe, img, picture, video)` at (0,0,2)); the frame's transparent background is NOT migrated — its subject IS <ui-media>, so it keeps the two-arm form. Any custom --ui-media-shape works without the library. hov(shape)/hov(shape-rev) morph to --ui-shape-morph and win on source order (media.hover.css is imported after media.css); shape-rev swaps the pair (media.shapes.css). rhomb/hex/star/plus read --shp-* glyphs from ui/base/shapes.css."
				},
				"hov": {
					"axis": "hover",
					"element": null,
					"args": {
						"mode": [
							"zoom",
							"pan",
							"track",
							"drift",
							"tilt",
							"tilt-out",
							"tilt-in",
							"rot-r",
							"rot-l",
							"shape",
							"shape-rev",
							"gray",
							"blur",
							"bright",
							"sat",
							"dim",
							"tint"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--_hv-dur",
						"--_hv-ease",
						"--_hv-t",
						"--_f-gray",
						"--_f-blur",
						"--_f-bright",
						"--_f-sat",
						"--_hv-any",
						"--_hv-zoom",
						"--_hv-pan",
						"--_hv-track",
						"--_hv-drift",
						"--_hv-tilt",
						"--_hv-tiltx",
						"--_hv-tilt-out",
						"--_hv-tilt-in",
						"--_hv-rot-r",
						"--_hv-rot-l",
						"--_hv-shape",
						"--_hv-filter",
						"--_hv-tint"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {
						"track": "hover.js",
						"drift": "hover.js",
						"tilt": "hover.js"
					},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.hover.css:75",
						"ui/card/media.hover.css:96",
						"ui/card/media.tint.css:70",
						"ui/card/hover.js:56"
					],
					"notes": "17 values in five families (scale · cursor · 3D/rotate · clip · filter) + tint. R-14 step 4 (v5): the real-property rules are now ONE flag setter + ONE @container style() block instead of two selector arms — style queries need Chromium 111+ / Safari 18+ / Firefox 128+, see media.md § \"v5 support posture\". Each value sets an inheriting --_hv-* flag with a combinator-free `:where([media*=\"hov(…)\"])` selector that matches the host AND the <ui-media>, and one style query applies the image rules (subject `ui-media :is(iframe, img, picture, video)`, still (0,0,2) — so hov(shape) beats shp()'s own clip-path on source order, no hand-tuned selector needed). Effects whose :hover sat on the FRAME (drift, tilt overfill) keep `ui-media:hover` on the subject inside the query; the rest read :hover/:focus-within on the flag setter, so a card-placed token still fires from anywhere in the card. hov(tilt*)'s `perspective` is NOT migrated — its subject IS <ui-media> and a container cannot restyle itself, so it keeps the folded two-arm selector. Two needles are paren-less on purpose: [media*=\"hov(tilt\"] matches tilt/tilt-in/tilt-out, [media*=\"hov(shape\"] matches shape/shape-rev. hov(tint) lives in the OPT-IN media.tint.css (not bundled by ui-card.css). Filter vars are @property-registered so they interpolate. Cursor effects need --ui-media-mx/my from hover.js; all effects are gated on @media (hover: hover) and pinned under prefers-reduced-motion."
				},
				"tnt": {
					"axis": "tint",
					"element": null,
					"args": {
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--ui-media-tint-color",
						"--_tnt",
						"--_hv-tint"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.tint.css:36",
						"ui/card/media.tint.css:58",
						"ui/card/media.tint.css:66"
					],
					"notes": "OPT-IN sheet (media.tint.css) — NOT imported by ui-card.css. Bare `tnt` paints --ui-media-tint-color (default --color-accent) via ui-media::before with mix-blend-mode. R-14 step 4 was REVERTED for this token (2026-07-31): the paint is back to TWO SELECTOR ARMS, not a flag + @container style() block. WebKit does not evaluate a style query for a pseudo-element against its originating element at first paint, so `@container style(--_tnt: 1) { ui-media::before { … } }` matched nothing on load — Safari rendered the page UNTINTED and the tint appeared on the first hover, the inverse of hov(tint). Declaring --_tnt on <ui-media> itself does NOT help (verified); only dropping the query does. hov(tint)'s opacity toggle is two-arm for the same reason. --_tnt / --_hv-tint are still set (media.css's flag registry resets them across nested hosts) but nothing reads them now. `isolation: isolate` was never migrated — its subject IS <ui-media>. A nested HOST that did not ask for a tint is suppressed explicitly, since the two-arm descendant selector crosses host boundaries where the flag form did not. Knobs: --ui-media-tint-blend (default color), --ui-media-tint-opacity. tnt(slate) resolves to its OWN --ui-theme-slate-bg bundle — slate is a canonical hue, never an alias of gray. The tnt(dark)/tnt(light)/tnt(subtle) aliases were removed in v5. Nested frames suppress the second tint (media.tint.css, `ui-media ui-media::before { content: none }`)."
				},
				"scm": {
					"axis": "scrim",
					"element": null,
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"tone": [
							"shr",
							"lgt",
							"med",
							"drk",
							"sld"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--ui-media-scrim",
						"--ui-media-scrim-paint",
						"--ui-media-scrim-color",
						"--ui-media-scrim-fade",
						"--ui-media-scrim-mid-stop",
						"--ui-media-scrim-end-stop",
						"--ui-media-scrim-cc-a",
						"--ui-media-scrim-cc-b"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:257",
						"ui/card/media.css:267",
						"ui/card/media.css:281"
					],
					"notes": "Three orthogonal, freely composable axes (direction · extent · intensity). Bare `scm` paints --ui-media-scrim-paint = scrim || --ui-media-scrim-default (written by the host's ovr(), ui-card.css:156-164) || the bc gradient. The 9 gradient families --ui-media-scrim-ts…-be are pre-declared on :where(ui-media), :where([media*=\"scm\"]), :where([variant*=\"ovr(\"]) — the exact set of subjects that read them (F-12, tightened in v5; the old blanket [media]/[variant] arms are gone) — and re-baked mirrored under :dir(rtl). The ui-media::after painter (media.css:282) is UNCONDITIONAL, so the token itself sets only custom properties."
				},
				"chip": {
					"axis": "furniture",
					"element": "ui-chip",
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"mode": [
							"pale",
							"muted"
						],
						"variant": [
							"lgt",
							"out"
						],
						"size": [
							"sm",
							"lg",
							"xl",
							"2xl"
						],
						"disc": [
							"non",
							"rnd",
							"pll",
							"crc",
							"sqr"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-chip-*",
						"--_theme-base-bg",
						"--_theme-base-c",
						"--_theme-bg",
						"--_theme-c"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:170",
						"ui/chip/ui-chip.css:46",
						"ui/chip/ui-chip.css:99"
					],
					"notes": "Default area ts. Position args live in media.css (shared 9-grid rule, real inset/translate props); every other axis lives in ui/chip/ui-chip.css paired with the standalone attribute form (&[theme]/&[variant]/&[size]/&[radius]). No chip(md) — md is the default size. chip(slate) is a canonical hue with its own --ui-theme-slate-* bundle (ui-chip.css). The chip(dark)/chip(light)/chip(subtle) aliases were removed in v5."
				},
				"sticker": {
					"axis": "furniture",
					"element": "ui-sticker",
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"mode": [
							"pale",
							"muted"
						],
						"size": [
							"sm",
							"lg",
							"xl",
							"2xl",
							"3xl"
						],
						"disc": [
							"non",
							"rnd",
							"pll",
							"crc",
							"sqr"
						],
						"shape": [
							"text",
							"spl",
							"spr",
							"sh:burst",
							"sh:blob",
							"sh:spark",
							"sh:sunburst",
							"sh:heart",
							"sh:<custom>"
						],
						"flag": [
							"fit"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-sticker-*",
						"--_theme-base-bg",
						"--_theme-base-c",
						"--_theme-bg",
						"--_theme-c"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:170",
						"ui/sticker/ui-sticker.css:86",
						"ui/sticker/ui-sticker.css:231"
					],
					"notes": "Default area te. sh: is an OPEN prefix — the generic rule [media*=\"sticker(sh:\"] (ui-sticker.css:231) sets up the ::before fill, so a custom sh:<name> + --ui-sticker-clip-path needs no CSS edit (render.js:214 classifies any sh:* as axis 'shape'). spl/spr are the flat media= aliases for variant=\"speech(l|r)\" (nested parens are illegal in a media= token). sticker(fit) opts into text-fit: grow (@supports-gated) and has NO class in render.js FURNITURE_AXIS. sticker(fit) is a TYPESETTING flag (text-fit: grow per-line-all, @supports-gated, ui-sticker.css:170-176), independent of the pale/muted plate tones — hence its own `flag` arg class. sticker(slate) is a canonical hue with its own --ui-theme-slate-* bundle; the sticker(dark)/sticker(light)/sticker(subtle) aliases were removed in v5."
				},
				"save": {
					"axis": "furniture",
					"element": "ui-save",
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"size": [
							"sm",
							"lg",
							"xl"
						],
						"disc": [
							"non",
							"rnd",
							"crc",
							"sqr"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-save-c",
						"--ui-save-sz",
						"--ui-save-circle-*"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:170",
						"ui/save/ui-save.css:80",
						"ui/save/ui-save.css:115"
					],
					"notes": "Default area te; INTERACTIVE, so invalid inside a <summary> (ui-reveal front face). No pale/muted arms. save(non) is a variant (hides the disc, bare glyph) but render.js classifies `non` under axis 'disc'. save(slate) is a canonical hue with its own --ui-theme-slate-* bundle (ui-save.css). The save(dark)/save(light)/save(subtle) aliases were removed in v5. No save(pll)."
				},
				"play": {
					"axis": "furniture",
					"element": "ui-play",
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"disc": [
							"non",
							"rnd",
							"pll",
							"crc",
							"sqr"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-play-sz",
						"--ui-play-icon-sz",
						"--ui-play-bg",
						"--ui-play-c",
						"--ui-play-radius",
						"--ui-play-corner",
						"--_play-block",
						"--_play-inline",
						"--_play-justify",
						"--_play-size"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:170",
						"ui/card/media.video.css:31",
						"ui/play/ui-play.css:55",
						"ui/card/media.carousel.css:85"
					],
					"notes": "Default area cc; INTERACTIVE, invalid inside <summary>. ONE stem carries two disjoint vocabularies: position (media.css:170) and size (media.video.css:31) — folding the system's only two-stem element into one; the legacy ply(<size>) stem was removed in v5 (no alias remains, and render.js no longer normalizes it). Inside a carousel (auto/loop) the control is re-laid-out as position:sticky and play(<pos>) is re-implemented via --_play-* (media.carousel.css:71-90) for SIX cells only: ts te cs ce bs be (no tc/bc). play(md) exists only in media.video.css:32; ui-play.css:76-78 ships sm/lg/xl on `ui-play button`. play(slate) is a canonical hue with its own --ui-theme-slate-* bundle; the play(dark)/play(light)/play(subtle) aliases were removed in v5."
				},
				"beacon": {
					"axis": "furniture",
					"element": "ui-beacon",
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"mode": [
							"pale",
							"muted"
						],
						"size": [
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						],
						"face": [
							"sld",
							"tck",
							"ldr",
							"dts"
						],
						"anim": [
							"bln",
							"pls",
							"brt"
						],
						"disc": [
							"pll",
							"rnd",
							"sqr",
							"non"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-beacon-*",
						"--_theme-base-bg",
						"--_theme-base-c",
						"--_theme-bg",
						"--_theme-c"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:170",
						"ui/beacon/ui-beacon.css:85",
						"ui/beacon/ui-beacon.css:130",
						"ui/beacon/ui-beacon.css:151"
					],
					"notes": "Default area ts (shares it with chip by design). Only element with an xs size and with md declared explicitly. Two axes overlap the shared vocabulary: `pll` is a FACE here (variant=\"pill\", ui-beacon.css:130) though render.js files it under 'disc'; `non` turns the solid face's default blink OFF (animation:none, ui-beacon.css:160) though render.js also files it under 'disc'. Animations are gated on prefers-reduced-motion (ui-beacon.css:248-266). Every face incl. the tck ticker is markup-free CSS. beacon(slate) is a canonical hue with its own --ui-theme-slate-* bundle; the beacon(dark)/beacon(light)/beacon(subtle) aliases were removed in v5."
				},
				"lightbox": {
					"axis": "furniture",
					"element": "ui-lightbox",
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"size": [
							"sm",
							"lg",
							"xl"
						],
						"disc": [
							"non",
							"rnd",
							"crc",
							"sqr"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-lightbox-c",
						"--ui-lightbox-sz",
						"--ui-lightbox-circle-*",
						"--_lb-block",
						"--_lb-inline",
						"--_lb-justify",
						"--_lb-size"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {
						"carousel controls in the open lightbox": "ui/card/lightbox.js (injects /polyfill/carousel-controls.js DOM controls; without it the open carousel is swipe/keyboard/scrollbar)",
						"--lightbox-layout / [open] reflection / View Transition morph": "ui/card/lightbox.js"
					},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:171",
						"ui/card/media.carousel.css:130",
						"ui/lightbox/ui-lightbox.css:83"
					],
					"notes": "Default area bs; INTERACTIVE, so invalid inside a <summary> (ui-reveal front face). \"View gallery\" invoker for the popover lightbox: <button command=\"toggle-popover\" commandfor=\"<frame id>\"> on a <ui-media popover> frame — the open-state presentation is the open: token family (media.lightbox.css). Glyph = inline <ui-icon><svg viewBox>…</svg> from /assets/svg: library-photo (\"open gallery\", renderer default, furniture.lightbox.shape=photos) or window-maximize (\"full screen\", shape=maximize); while open the svg hides and ui-lightbox.css draws ui-icon's cross bars (close affordance). In a nav scroller the element is sticky-pinned to the scrollport and must sit BEFORE the slides (first child; six edge cells; end corners are not relocated — prefer start corners, media.carousel.css). Native scroll-control pseudos do NOT follow a popover frame into the top layer (current Chromium) — ui/card/lightbox.js injects the /polyfill/carousel-controls.js DOM controls on popover frames in every browser, and media.lightbox.css suppresses the native pseudos on those [data-ui-carousel-polyfill] frames. Open-state nav switching uses the companion media-open= ATTRIBUTE (ordinary control spellings, swapped by lightbox.js — never an open: token, control stems are substring-matched). Single-ink control: no pale/muted arms, like save/play. No lightbox(pll)."
				},
				"marquee": {
					"axis": "band",
					"element": "ui-marquee",
					"args": {
						"pos": [
							"top",
							"bot"
						],
						"hue": [
							"red",
							"orange",
							"green",
							"blue",
							"accent",
							"black",
							"white",
							"gray",
							"slate"
						],
						"mode": [
							"rpt",
							"seam",
							"fade",
							"pale",
							"muted"
						],
						"size": [
							"sm",
							"lg",
							"xl",
							"2xl"
						],
						"disc": [
							"non",
							"rnd",
							"pll",
							"crc",
							"sqr"
						],
						"value": [
							"right",
							"up",
							"down",
							"slow",
							"fast",
							"faster",
							"gap-sm",
							"gap-lg"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-marquee-*",
						"--_name",
						"--_dir",
						"--_theme-base-bg",
						"--_theme-base-c",
						"--_theme-bg",
						"--_theme-c",
						"--_mrq"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:238",
						"ui/marquee/ui-marquee.css:94",
						"ui/marquee/ui-marquee.css:108",
						"ui/marquee/ui-marquee.css:135"
					],
					"notes": "A BAND, not 9-grid furniture: full-width (inset-inline: 0), z-index 1 (BELOW the z-2 furniture), and only two placements. The position args were the first R-14-step-4 migration: one flag setter `:where([media*=\"marquee(top|bot)\"]) { --_mrq: top|bot }` (matches host AND <ui-media>) plus one @container style(--_mrq: …) block whose subject is `:where(ui-media) ui-marquee`, a CHILD of the frame. R-14 step 4 (v5): the real-property rules are now ONE flag setter + ONE @container style() block instead of two selector arms — style queries need Chromium 111+ / Safari 18+ / Firefox 128+, see media.md § \"v5 support posture\". Before the v4 self arm existed, marquee(bot) on the <ui-media> itself (the renderer's canonical placement) was a silent no-op. Every other arg resolves through ui-marquee.css's own ancestor arms (`:where([media*=\"marquee(…)\"]) &`) and has always worked from either placement. Direction/speed/gap live only in the 'value' bucket (no render.js merge class). The old marquee(loop) spelling is REMOVED (2026-07-27): it was renamed to rpt because a substring-matched marquee(loop) collided with the carousel's bare `loop` flag in the same attribute (that flag is whole-token matched on both the CSS and JS sides). seam is @supports(offset-path)+reduced-motion gated. marquee(slate) is a canonical hue with its own --ui-theme-slate-* bundle; the marquee(dark)/marquee(light)/marquee(subtle) aliases were removed in v5."
				},
				"vid": {
					"axis": "video",
					"element": null,
					"args": {
						"mode": [
							"cc",
							"pip",
							"fls"
						],
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-media-tool-fullscreen",
						"--ui-media-tool-pip",
						"--ui-media-tool-cc",
						"--ui-media-tool-bg",
						"--ui-media-tool-bg-hover",
						"--ui-media-tool-size"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {
						"cc": "video.js",
						"pip": "video.js",
						"fls": "video.js"
					},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.video.css:37",
						"ui/card/media.video.css:45",
						"ui/card/video.js:204",
						"ui/card/video.js:278"
					],
					"notes": "CSS side is token-gated on the paren form [media*=\"vid(\"] and writes ONLY custom properties (glyph data-URIs, bg, size); the buttons themselves are JS-INJECTED by video.js into a <menu class=\"ui-media-tools\"> whose styling is NOT token-gated (`:where(ui-media) .ui-media-tools`, the DSL's only two class hooks). Bare `vid` does nothing. video.js matches with the regexes /vid\\(pip\\)/ /vid\\(fls\\)/ /vid\\(cc\\)/ and requires a <video> (or provider=) to be present. PiP is feature-detected (skipped in Firefox); the injected --cc button is inert unless an authored <select class=\"ui-media-cc\"> exists."
				},
				"load": {
					"axis": "loading",
					"element": null,
					"args": {
						"mode": [
							"eager",
							"lazy"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {
						"eager": "ui-media-srcset.js",
						"lazy": "ui-media-srcset.js"
					},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-media-srcset.js:62",
						"ui/card/ui-media-srcset.js:65"
					],
					"notes": "The only media= token with NO CSS rule anywhere. Matched by the regex /load\\((eager|lazy)\\)/ against mediaStr(), i.e. own attr or the nearest ui-card/ui-reveal host only. Sets img loading/decoding/fetchpriority and video preload; load(eager) additionally gives the FIRST child fetchpriority=high. Default (no token) = lazy."
				},
				"nav": {
					"axis": "carousel",
					"element": null,
					"args": {
						"mode": [
							"mrk",
							"arw",
							"blw",
							"abv",
							"non"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--ui-media-bg",
						"--ui-carousel-*"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.carousel.css:20",
						"ui/carousel/carousel.css:9",
						"ui/carousel/carousel.css:153",
						"layout/core/base.css:305"
					],
					"notes": "THE TOKEN IS THE TRIGGER — no separate carousel element. Turns the frame into a flex scroll-snap scroller and declares the whole --ui-carousel-* default bundle. BARE-nav detection is the compound needle [media*=\"nav\"]:not([media*=\"nav(\"]) (carousel.css:84,153). Dual arm on ui-media (`ui-media:where([media*=\"nav\"], :is(ui-card, ui-reveal)[media*=\"nav\"] *)`); the lay-out[overflow] arm is a separate host that drives the LAYOUT's own scroller, never descendant frames. Slides = direct children minus the NOT_SLIDE list (media.carousel.css:32, shared.js:20). Controls are ::scroll-marker/::scroll-button, @supports-gated (Chromium). nav(non) = scroller only, NO controls: the parenthesised arg suppresses the bare-nav compound needle (so neither dots nor arrows are declared) while the plain [media*=\"nav\"] substring still enables the scroll-snap scroller — a bare swipe carousel. No dedicated CSS rule exists or is needed."
				},
				"arw": {
					"axis": "arrows",
					"element": null,
					"args": {
						"variant": [
							"arr",
							"bare",
							"sqr",
							"sft",
							"lgt",
							"drk",
							"hid",
							"rev",
							"set"
						],
						"size": [
							"sm",
							"lg",
							"xl"
						],
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"bs",
							"bc",
							"be"
						],
						"mode": [
							"blw",
							"abv"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-carousel-arrow-glyph",
						"--ui-carousel-arrow-size",
						"--ui-carousel-arrow-radius",
						"--ui-carousel-arrow-bg",
						"--ui-carousel-arrow-bg-hover",
						"--ui-carousel-arrow-color",
						"--ui-carousel-arrow-color-hover",
						"--ui-carousel-arrow-shadow",
						"--ui-carousel-arrow-hover-ring",
						"--ui-carousel-arrow-nudge",
						"--ui-carousel-arrow-disabled-opacity",
						"--ui-carousel-arrow-top",
						"--_arw-rot",
						"--_arw-scale"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/carousel/carousel.css:93",
						"ui/carousel/carousel.css:353",
						"ui/carousel/carousel.css:358",
						"ui/card/media.carousel.css:93"
					],
					"notes": "Only STYLES arrows — presence comes from nav (bare|arw|blw|abv). No arw(md) (2.25rem is the host default) and no arw(ce): arw(set)'s inline side is start via ts/cs/bs, centre via tc/cc/bc, end by default. arw(ts…be) only carries the BLOCK row for split arrows; under axis(y) the inline letter is what matters (carousel.css:465). arw(blw)/arw(abv) reserve a band via media.carousel.css:93 (frame) and layout/core/base.css:312 (lay-out). arw(rev) is @media (hover:hover)-gated."
				},
				"mrk": {
					"axis": "markers",
					"element": null,
					"args": {
						"variant": [
							"pll",
							"hyb",
							"bar",
							"tmb",
							"tml",
							"rail",
							"non",
							"lgt",
							"drk",
							"sbr",
							"lbl"
						],
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						],
						"mode": [
							"blw",
							"abv"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-carousel-marker-size",
						"--ui-carousel-marker-bg",
						"--ui-carousel-marker-active",
						"--ui-carousel-marker-inset",
						"--ui-carousel-pill-width",
						"--ui-carousel-pill-height",
						"--ui-carousel-pill-track",
						"--ui-carousel-pill-fill",
						"--ui-carousel-thumb-size",
						"--ui-carousel-bar-*",
						"--ui-carousel-band",
						"--ui-carousel-rail",
						"--ui-carousel-sbr-*",
						"--ui-carousel-label-*",
						"--ui-carousel-tml-*"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/carousel/carousel.css:35",
						"ui/carousel/carousel.css:193",
						"ui/carousel/carousel.css:263",
						"ui/card/media.carousel.css:111",
						"ui/card/media.carousel.css:150",
						"ui/carousel/carousel.css:316",
						"ui/carousel/carousel.css:422",
						"ui/carousel/polyfill/carousel.css:196"
					],
					"notes": "Only STYLES/positions the dots — presence comes from nav (bare|mrk|blw|abv); mrk(non) removes them (scroll-marker-group:none). One size scale drives dots, pills AND thumbnails. mrk(tmb) needs a per-slide --ui-carousel-thumb-url and switches the frame to box-sizing:content-box (media.carousel.css:111); mrk(rail) (axis(y) only) reserves inline space via --ui-carousel-rail (media.carousel.css:125). mrk(bar)/mrk(tmb)/mrk(lbl) declare anchor-name/anchor-scope on the scroller so ::scroll-marker-group can anchor-size() itself (a NAMED anchor is required — %, both-edge insets and the implicit anchor-size(inline) do not size the pseudo). Pill/thumb fill timers read --ui-carousel-autoplay + --ui-carousel-play-state written by carousel.js. mrk(sbr) (WIP) styles the scroller's REAL scrollbar as a full-width bottom system bar — natively draggable, zero JS; central --ui-carousel-sbr-* tokens feed both the standard (Firefox) and ::-webkit-scrollbar paths, content-box like mrk(tmb) (media.carousel.css:150). mrk(lbl) renders each slide's aria-label as a text pill via ::scroll-marker content:attr(aria-label); look via --ui-carousel-label-* custom properties, positioning reuses the 9-grid mrk() cells with height-agnostic re-anchoring (ui/carousel/carousel.css:316). Because labels are TEXT, the lbl group caps to the frame (anchor-size(--ui-carousel-labels inline)) and becomes its own horizontal scroller instead of spilling — ::scroll-marker-group is a scroll-target-group, so the current pill is scrolled into view without JS; --ui-carousel-label-group-max-inline-size / -group-scrollbar / -group-wrap are the knobs. mrk(tml) renders the markers as a TIMELINE: each node's label is the slide's data-date (content:attr(data-date); the slide's aria-label stays the accessible name), and the dot + rail are two BACKGROUND layers on the marker, because a pseudo-element has no pseudos of its own. The group runs gap:0 so adjacent rail segments abut into one continuous stroke and each opaque dot paints over its own segment — remove the gap:0 and the rail breaks into dashes. First/last nodes trim the rail to the dot via --_tml-rail-img (logical, through base's --_dir-e). Same named-anchor capping as mrk(lbl) (--ui-carousel-timeline), same height-agnostic re-anchoring, and the band is a token (--ui-carousel-tml-band) since auto-height text can't be measured. Look via --ui-carousel-tml-*; the polyfill draws the same node with a real ::before/::after pair (ui/carousel/polyfill/carousel.css). VERTICAL: axis(y) mrk(tml) mrk(rail) turns the timeline into a rail beside the media — vertical stroke through inline-start dots, data-date label beside each dot; rows are --ui-carousel-tml-row (default --ui-carousel-tml-col / 2), the inline reservation is --ui-carousel-tml-rail-size (4rem — NOT --ui-carousel-tml-rail, the stroke color), and the rail joins the band CanvasText ink rule. SIZE: mrk(tml) reads the shared size scale as ONE step — sm/md/lg/xl move --ui-carousel-tml-col + -dot-size + -font-size together (xl also thickens -line-width), and any single token still overrides its step. A themed <ui-content> slide paints its own plate, so ui-content joins the replaced elements in the band slide-radius rule (media.carousel.css:48)."
				},
				"tmb": {
					"axis": "thumbs",
					"element": null,
					"args": {
						"ratio": [
							"1/1",
							"4/3",
							"3/4",
							"16/9",
							"3/2",
							"2/3"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-carousel-thumb-ratio",
						"--ui-carousel-thumb-ratio-n"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/carousel/carousel.css:47"
					],
					"notes": "Whole-token (~=) — the only carousel token that is, matching asr()'s ratio convention. -ratio drives the thumb aspect-ratio; -ratio-n is the numeric twin the mrk(rail) width calc needs. Inert without mrk(tmb). Default 4/3 (no token needed)."
				},
				"axis": {
					"axis": "carousel",
					"element": null,
					"args": {
						"value": [
							"y"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.carousel.css:62",
						"ui/carousel/carousel.css:434",
						"ui/card/carousel.js:7"
					],
					"notes": "Only one arg exists (y); x is the unspelled default. Sets flex-direction/overflow/scroll-snap-type on the frame and re-homes the controls (up/down buttons, vertical dot column) — writes no custom properties at all. carousel.js:7 reads it with a plain .includes('axis(y)') to pick the scroll geometry axis."
				},
				"auto": {
					"axis": "carousel",
					"element": null,
					"args": {
						"value": [
							"<n>",
							"<n>s",
							"<n>ms"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--ui-carousel-autoplay",
						"--ui-carousel-play-state",
						"--ui-carousel-thumb-timer-name",
						"--_play-block",
						"--_play-inline",
						"--_play-justify",
						"--_play-size"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {
						"*": "carousel.js"
					},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.carousel.css:75",
						"ui/card/carousel.js:82",
						"ui/card/carousel.js:160"
					],
					"notes": "Matched as :is([media~=\"auto\"], [media*=\"auto(\"]) in BOTH the CSS sticky-<ui-play> rule (media.carousel.css:75-76) and carousel.js — the stem-scoped `auto(` needle is the parameterized half, the bare half is whole-token. JS parses the duration with /(?:^|\\s)auto(?:\\((\\d+(?:\\.\\d+)?)(m?s)?\\))?/, so a bare number means SECONDS. Default 5s. No-ops under prefers-reduced-motion and with <2 slides. The three --ui-carousel-* writes are inline styles set by carousel.js, not CSS. The CSS arm is deliberately NOT factored: the host arm excludes nested frames (:not(ui-media ui-media)), the self arm doesn't."
				},
				"ani": {
					"axis": "carousel",
					"element": null,
					"args": {
						"anim": [
							"rise",
							"fall",
							"lft",
							"rgt",
							"zom",
							"blr",
							"fde"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--_stg-tr",
						"--_stg-sc",
						"--_stg-fl",
						"--_stg-origin"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/base/stagger.css:82"
					],
					"notes": "CONTENT channel of the stagger engine; inert without the `stagger` flag. rise is the unspelled default. The setters are UNSCOPED (:where([media*=\"ani(rise)\"])), so the token also works on a per-slide/per-card element or any ancestor — it only writes inherited custom properties. Mirrors the generic [stagger~=…] word vocabulary 1:1."
				},
				"crd": {
					"axis": "carousel",
					"element": null,
					"args": {
						"anim": [
							"rise",
							"fall",
							"lft",
							"rgt",
							"zom",
							"blr",
							"fde"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--_stg-crd-tr",
						"--_stg-crd-sc",
						"--_stg-crd-fl"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/base/stagger.css:91"
					],
					"notes": "CARD channel — the cards inside a multi-card slide (<ui-slide> or an inner <lay-out>), independent of ani(). Same 7 effects. crd(zom) sets no --_stg-origin (ani(zom) does), so the card zoom uses the default 50% 50% origin."
				},
				"open:grid": {
					"axis": "open-state",
					"element": null,
					"args": {
						"cols": [
							"2c",
							"3c",
							"4c"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--_lb-cols"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.lightbox.css:112",
						"ui/card/media.lightbox.css:127"
					],
					"notes": "OPEN-STATE prefix family (media.lightbox.css): arms only while the <ui-media popover> frame is :popover-open, presenting the SAME children as an N-column scrollable grid instead of the default fullscreen carousel. WHOLE-token on purpose, like md:/lg: asr() — an open: spelling must never contain a substring-matched stem, which is why there is no open:nav (the [media*=\"nav\"] needle would arm the closed carousel; fullscreen carousel is simply the default open presentation of a nav frame). The colon lives in the entry NAME so the needle audit and preset lint see the literal spellings; the cqPrefixes machinery is deliberately not reused (that is the container-query axis, and it would hide substring cross-fire from the shadow lint). Runtime carousel↔grid switching (data-lightbox attr) needs ui/card/lightbox.js."
				}
			},
			"bareFlags": {
				"clip": {
					"axis": "corners",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--ui-media-radius"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.css:127",
						"ui/card/media.css:50",
						"ui/card/media.carousel.css:54"
					],
					"notes": "SELF ARM ONLY — the clip-path rule is :where(ui-media[media*=\"clip\"]) with no host arm, so media=\"clip\" on a <ui-card>/<ui-reveal> is a silent no-op (the sibling rule at media.css:50, which zeroes a nested frame's radius, DOES use a host arm). Clips to the rds() radius (falling back to --ui-card-radius) because a plain border-radius is unreliable during scroll; -sq clips as plain round. Suppressed on :focus-visible so the dashed ring is not cut off."
				},
				"loop": {
					"axis": "carousel",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_play-block",
						"--_play-inline",
						"--_play-justify",
						"--_play-size"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal",
						"lay-out[overflow]"
					],
					"requiresJs": {
						"*": "carousel.js"
					},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.carousel.css:75",
						"ui/card/carousel.js:44",
						"ui/card/carousel.js:161"
					],
					"notes": "Seamless infinite loop — carousel.js clones N leading/trailing slides ([data-clone], aria-hidden, inert) and hops on scrollend; runs before initAuto so clones exist when autoplay ticks. WHOLE-TOKEN on both sides: carousel.js needles [media~=\"loop\"] + hasToken(), and the CSS sticky-<ui-play> rule (media.carousel.css:75-76) was moved off substring matching so it no longer fires on marquee(loop). Clone markers are suppressed (carousel.css:336)."
				},
				"stagger": {
					"axis": "carousel",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--_stg-base-i",
						"--_stg-crd-i"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/base/stagger.css:171",
						"ui/base/stagger.css:176",
						"ui/base/stagger.css:181"
					],
					"notes": "Bare-only in the media= DSL (the equivalent on a <lay-out> is the separate `stagger`/`data-stagger` ATTRIBUTE, which also takes the effect words + `trigger`). Dual arm. Makes each slide a container-type: scroll-state box and holds cards/content at a from-state until @container scroll-state(snapped: inline). Two channels: cards (--_stg-crd-*) and content (--_stg-*). Whole engine is inside @media (prefers-reduced-motion: no-preference). ani()/crd() are separate stems that hang off the same engine."
				},
				"pages": {
					"axis": "carousel",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_pg"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"lay-out[overflow]",
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"layout/core/base.css:223",
						"ui/card/media.carousel.css:51",
						"ui/carousel/carousel.css:186",
						"ui/base/stagger.css:228"
					],
					"notes": "One word, one intent — 'this carousel navigates by pages, and adapts on mobile' — with the mechanism following from the markup shape. On <lay-out overflow> (flat children): math paging — snaps + emits one ::scroll-marker per PAGE of --_ci items instead of per item, via mod(sibling-index()-1, --_ci) + if(style(--_pg: 0)); the dot count auto-adapts per breakpoint because --_ci follows columns(N); degrades to per-item where sibling-index()/if() are unsupported. On a <ui-media> scroller (or its card host): the <lay-out> children are PAGE wrappers — below the layout system's md viewport breakpoint (540px) each wrapper dissolves via display:contents, so every card becomes its own full-width snap target with its own dot (grandchild markers collect into the scroller's group natively; a boxless wrapper generates none). ui-media context is CSS-only: slidesOf() still counts the wrapper as ONE slide, so auto/loop don't see through the dissolve; dot markers only (pll/hyb/tmb/lbl stay per-direct-slide). Stagger: each dissolved card becomes its own scroll-state inline-size container — ani() plays per-card, crd() is inert below md. Whole-token ([media~=\"pages\"])."
				},
				"open:furniture": {
					"axis": "open-state",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-media",
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/media.lightbox.css:101"
					],
					"notes": "OPT-OUT of the lightbox's default furniture hiding: while a frame is :popover-open, direct-child ui-chip/ui-sticker/ui-beacon/ui-marquee/ui-save are display:none unless this bare flag is present (ui-play and ui-lightbox always stay — video control and close affordance). Whole-token, open-state family — see open:grid."
				}
			}
		},
		"variant": {
			"attribute": "variant",
			"tokens": {
				"rds": {
					"axis": "corners",
					"element": null,
					"args": {
						"size": [
							"non",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl",
							"full",
							"pill",
							"sm-sq",
							"md-sq",
							"lg-sq",
							"xl-sq"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-card-radius",
						"--ui-card-squircle-exp"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:64",
						"ui/card/ui-card.css:65-71",
						"ui/card/ui-card.css:76-79",
						"ui/card/ui-card.css:80",
						"ui/reveal/ui-reveal.css:74",
						"ui/reveal/ui-reveal.css:253-255",
						"ui/reveal/ui-reveal.css:292",
						"ui/reveal/ui-reveal.css:296"
					],
					"notes": "Arg rules are whole-token (~=); the SHAPE application is a separate SUBSTRING rule `:where(ui-card[variant*=\"-sq)\"]) { corner-shape: superellipse(var(--ui-card-squircle-exp,1.8)) }` (ui/card/ui-card.css:80), mirrored on `ui-reveal[variant*=\"-sq)\"] > details` (ui/reveal/ui-reveal.css:253) and on the exp-pop placeholder (ui/reveal/ui-reveal.css:296) — that is the only real property this token sets. Radius/exponent VALUES (--radius-*, --radius-*-sq, --squircle-*) live in ui/base/tokens.css; these rules only route an arg to a namespace. --ui-card-radius is also consumed by <ui-reveal>'s `> details` border-radius (ui/reveal/ui-reveal.css:74). The same scale exists on media= and content=; the rds(none) alias was removed in v5 on all three attributes — `non` is the only spelling. variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"shd": {
					"axis": "elevation",
					"element": null,
					"args": {
						"size": [
							"non",
							"sm",
							"md",
							"lg",
							"xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-card-shadow"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:76-80"
					],
					"notes": "Card elevation. The no-token default is --shadow-xl; shd(non) removes it, for a card used as a page surface rather than a tile in a grid."
				},
				"bdr": {
					"axis": "border",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg"
						],
						"tone": [
							"lgt",
							"drk"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "substring",
					"writes": [
						"--ui-card-border-width",
						"--ui-card-border-color"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:88-90",
						"ui/card/ui-card.css:91-93",
						"ui/card/ui-card.css:94-95"
					],
					"notes": "The ENABLING rule is substring-matched (`:where([variant*=\"bdr\"])`) and sets the `border` shorthand, so any bdr(...) arg alone also switches the border on; the arg rules themselves are whole-token (~=). --ui-card-border-style has no token (author-only). NOTE on <ui-reveal>: the rule's subject is the element carrying variant=, i.e. the <ui-reveal> host, whose own box has no background or radius (those live on `> details`), so the hairline paints as a SQUARE box around the rounded card. variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"spl": {
					"axis": "split",
					"element": null,
					"args": {
						"ratio": [
							"1/1",
							"1/2",
							"2/1",
							"1/3",
							"3/1"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-card-split"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"ratio"
					],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:110-114",
						"ui/card/ui-card.css:227-231",
						"ui/card/ui-card.css:329-333"
					],
					"notes": "Inert on its own: --ui-card-split is only read by row/row-r (and md:/lg: row forms) through `--ui-card-cols: var(--ui-card-split, 1fr 1fr)`. Base declares on the HOST; the md:/lg: forms declare on the queryable descendant `:is(cq-box, summary)` inside `@container bs-card (inline-size >= 25rem / 44rem)`. <ui-accordion> implements two further ratios (3/2, 2/3, ui/accordion/ui-accordion.css:427-428) that ui-card does NOT — the split vocabulary is not shared. variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"vis": {
					"axis": "visibility",
					"element": null,
					"args": {
						"value": [
							"media",
							"content"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [],
					"realProperties": true,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"value"
					],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:117-118",
						"ui/card/ui-card.css:129-133",
						"ui/card/ui-card.css:224-225",
						"ui/card/ui-card.css:326-327",
						"ui/reveal/ui-reveal.css:132"
					],
					"notes": "Writes no custom property — pure `display: none` on the hidden primitive, plus it joins the `align-content: stretch` selector list (ui/card/ui-card.css:129-133). The base rules are host-scoped DESCENDANT selectors (`:where([variant~=\"vis(media)\"]) ui-content`), which is why they leak into a <ui-reveal>'s revealed panel and are counter-reset by `display: flex` at ui/reveal/ui-reveal.css:132 (leak-checklist item 2). variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"ovr": {
					"axis": "overlay",
					"element": null,
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-card-stack",
						"--ui-content-ov-ink",
						"--ui-content-ov-z",
						"--ui-content-heading-text-shadow",
						"--ui-content-eyebrow-text-shadow",
						"--ui-content-ov-justify",
						"--ui-content-ov-align",
						"--ui-content-ov-text",
						"--ui-media-scrim-default"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:139",
						"ui/card/ui-card.css:140-148",
						"ui/card/ui-card.css:156-164",
						"ui/card/ui-card.css:168",
						"ui/card/ui-card.css:129-133",
						"ui/card/media.css:219-255",
						"ui/reveal/ui-reveal.css:129-138"
					],
					"notes": "SUBSTRING matched (`[variant*=\"ovr(\"]` for the bridge, `[variant*=\"ovr(ts)\"]` per position) — the only card arrangement axis that is not whole-token. The six physical aliases (tl tr cl cr bl br) were REMOVED in v5 — logical ts…be is the only spelling. The centre column tc/cc/bc was always spelled identically in both vocabularies and is unaffected. obp() dropped its physical spellings in the same way (v5, later round), so no physical position vocabulary remains. The implementation was always logical (justify/align/text-align: start|center|end), so ovr(tl) already rendered top-END in rtl — the rename fixes the label, not the behaviour. Real properties: `grid-area: var(--ui-card-stack, auto)` on :is(ui-media, ui-content) (ui/card/ui-card.css:139, armed by the bare [variant] presence), `align-content: stretch` on the queryable descendant, and `color` on a plain .ui-button (ui/card/ui-card.css:168). --ui-media-scrim-default is consumed by bare `scm` on media=; the nine gradients are defined on `:where([variant*=\"ovr(\"])` (among other subjects) in media.css and mirror themselves through base's --_dir-s/--_dir-e. ovr()'s ink/placement/z leak into a reveal panel and are counter-reset at ui/reveal/ui-reveal.css:129-138 (leak-checklist items 1 + 3). variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"flp": {
					"axis": "reveal-animation",
					"element": null,
					"args": {
						"pos": [
							"top",
							"btm",
							"lft",
							"rgt"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_rvl",
						"--_face-closed",
						"--_face-open",
						"--_panel-closed",
						"--_panel-open",
						"--ui-reveal-icon-clear"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:91",
						"ui/reveal/ui-reveal.css:342-369",
						"ui/reveal/ui-reveal.css:371-416",
						"ui/reveal/ui-reveal.css:420-431",
						"ui/reveal/ui-reveal.css:438-449"
					],
					"notes": "Dispatch flag pattern: the token writes `--_rvl: flp` on `> details` (a non-inheriting @property, so a nested reveal never picks up an outer one's animation), and ALL geometry lives in one `@container bs-rvl style(--_rvl: flp)` block — each animation's tokens are enumerated exactly once. Bare `flp` = from the right; flp(rgt) is accepted by the dispatch selector but has NO geometry rule of its own (identical to bare). flp(top|btm|lft) re-point the four rotation vars on the HOST (a container cannot style itself). Real properties: transform/backface-visibility/transition on `> summary > ui-face` and on `::details-content`, z-index on the icon, plus the icc()/ico() top-corner clearance padding (ui/reveal/ui-reveal.css:394-399) and the scr fade mask (ui/reveal/ui-reveal.css:438-449). Requires <ui-face> around the front face."
				},
				"sld": {
					"axis": "reveal-animation",
					"element": null,
					"args": {
						"pos": [
							"top",
							"btm",
							"lft",
							"rgt"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_rvl"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:92",
						"ui/reveal/ui-reveal.css:452-464",
						"ui/reveal/ui-reveal.css:521-524"
					],
					"notes": "Writes `--_rvl: sld` on `> details`; geometry in `@container bs-rvl style(--_rvl: sld)`. Bare `sld` = from the right (base `translate: 100% 0`); sld(rgt) has an explicit rule that restates that default. Each direction sets `translate` directly on ::details-content — real properties, no custom property in between. Under sld (and grw) the open summary gets `pointer-events: none` unless trg(card) is set, with the icon opting back in (ui/reveal/ui-reveal.css:521-524). Requires <ui-face> around the front face."
				},
				"grw": {
					"axis": "reveal-animation",
					"element": null,
					"args": {
						"pos": [
							"ts",
							"te",
							"bs",
							"be"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_rvl",
						"--_scale-bs",
						"--_scale-be",
						"--_scale-is",
						"--_scale-ie"
					],
					"realProperties": true,
					"cqPrefixes": [
						"lg"
					],
					"cqArgs": [
						"pos"
					],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:96",
						"ui/reveal/ui-reveal.css:467-499",
						"ui/reveal/ui-reveal.css:506-515",
						"ui/reveal/ui-reveal.css:528-532"
					],
					"notes": "Grow / scale-morph. Writes `--_rvl: grw` on `> details`; ONE geometry block (`@container bs-rvl style(--_rvl: grw)`) serves both the base tokens and the lg: tier swap. Bare `grw` takes its anchored corner from ico() (the ico() corner rules write the same --_scale-* vars); grw(ts|te|bs|be) pins it explicitly and wins by source order. `lg:grw` (+ its four corner forms) re-flips the dispatch flag inside `@container bs-card (inline-size >= 44rem)` (ui/reveal/ui-reveal.css:528-532) — it is the ONLY animation with a container-tier swap (there is no lg:exp / lg:flp / lg:sld, and no md: tier at all). Renamed from scl() so one spelling means one thing across attributes; the `scl`/`lg:scl` spellings were removed in v5 — no alias remains. Requires <ui-face> around the front face."
				},
				"trg": {
					"axis": "reveal-mode",
					"element": null,
					"args": {
						"value": [
							"card"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:522",
						"ui/reveal/ui-reveal.css:540-547"
					],
					"notes": "Whole card toggles. Only `trg(card)` exists (no other arg). Real properties only: the open panel gets `pointer-events: none` with interactive descendants opting back in, and the focus ring moves to `> details:has(> summary:focus-visible)`. It also NEGATES the sld/grw `pointer-events: none` on the open summary (`:not([variant~=\"trg(card)\"])`). The renderer suppresses the <ui-icon> entirely when reveal.trigger is set (render.js:831) — a JS-side contract, not a CSS one."
				},
				"ico": {
					"axis": "reveal-icon",
					"element": "ui-icon",
					"args": {
						"pos": [
							"ts",
							"te",
							"bs",
							"be"
						],
						"tone": [
							"drk",
							"sem"
						],
						"size": [
							"sm",
							"lg"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-reveal-icon-bg",
						"--ui-reveal-icon-sz",
						"--_scale-bs",
						"--_scale-be",
						"--_scale-is",
						"--_scale-ie"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:203-211",
						"ui/reveal/ui-reveal.css:224-246",
						"ui/reveal/ui-reveal.css:394-399",
						"ui/reveal/ui-reveal.css:510-513"
					],
					"notes": "ONE WORD PER TOKEN — `ico(te) ico(sm)`, never `ico(te sm)`. Three disjoint arg classes: corner (ts te bs be — logical, rtl-safe), ink (drk = --ui-theme-black-bg plate + --ui-theme-black-c glyph; sem = --ui-reveal-icon-opacity 0.6), size (sm = --size-5, lg = --size-8). There is NO ico(md): the default size is the unset --ui-reveal-icon-sz (--size-7), so `ico(md)` is a silent no-op. Selectors use `:is()`/plain attribute forms, not `:where()`, so these sit at (0,1,x). Side effect worth knowing: the ico() CORNER rules also write the --_scale-* vars (ui/reveal/ui-reveal.css:510-513), which is how a bare `grw` inherits its morph origin from the icon position. Under flp, ico(ts)/ico(te) additionally indent the open panel's first child by --ui-reveal-icon-clear (ui/reveal/ui-reveal.css:394-399)."
				},
				"icc": {
					"axis": "reveal-icon",
					"element": "ui-icon",
					"args": {
						"pos": [
							"ts",
							"te",
							"bs",
							"be"
						],
						"tone": [
							"drk",
							"sem"
						],
						"size": [
							"sm",
							"lg"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-reveal-icon-bg",
						"--ui-reveal-icon-sz"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:214-221",
						"ui/reveal/ui-reveal.css:224-246",
						"ui/reveal/ui-reveal.css:394-399"
					],
					"notes": "Same three arg classes and the same one-word-per-token rule as ico(), but scoped to `> details[open]` — the OPEN-state icon. Unlike ico() it does NOT write the --_scale-* morph origin (only ico() corners do), so `grw` never takes its origin from icc(). It does share the flp clearance rule (ui/reveal/ui-reveal.css:394-399), where the open-state side is icc() if set, else ico()."
				}
			},
			"bareFlags": {
				"col": {
					"axis": "arrangement",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--ui-card-cols"
					],
					"realProperties": true,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:47-51",
						"ui/card/ui-card.css:214-221",
						"ui/card/ui-card.css:316-323"
					],
					"notes": "The DEFAULT arrangement — bare `col` has NO base CSS rule at all (the card's single-column grid is `--ui-card-cols: 1fr` from the cq-box rule). Only the prefixed forms exist as rules: md:col / lg:col set `--ui-card-cols: 1fr` on :is(cq-box, summary) and reset `ui-content { order: 0 }` (real property), which is what makes `col-r md:col` work. A lint asserting 'every documented token has a CSS needle' will flag the bare form. variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"col-r": {
					"axis": "arrangement",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--ui-card-cols"
					],
					"realProperties": true,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:108",
						"ui/card/ui-card.css:128",
						"ui/card/ui-card.css:214-223",
						"ui/card/ui-card.css:316-325"
					],
					"notes": "Reversed column: `ui-content { order: -1 }` (real property, host-scoped descendant selector) plus `align-content: space-between` on the queryable descendant — the only arrangement value that gets space-between (row/vis/ovr get stretch, everything else start). Prefixed forms set --ui-card-cols: 1fr and re-apply order: -1. variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"row": {
					"axis": "arrangement",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--ui-card-cols"
					],
					"realProperties": true,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:100-107",
						"ui/card/ui-card.css:129-133",
						"ui/card/ui-card.css:216-219",
						"ui/card/ui-card.css:318-321"
					],
					"notes": "`--ui-card-cols: var(--ui-card-split, 1fr 1fr)` — the only consumer of spl(). Real properties: block-size/inline-size/min-block-size on the descendant <ui-media>, and `align-content: stretch` on :is(cq-box, summary). variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"row-r": {
					"axis": "arrangement",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--ui-card-cols"
					],
					"realProperties": true,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card",
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:100-108",
						"ui/card/ui-card.css:129-133",
						"ui/card/ui-card.css:216-223",
						"ui/card/ui-card.css:318-325"
					],
					"notes": "As `row`, plus `ui-content { order: -1 }` so the text column comes first. variant= is host-only by design — it arranges the two children, so there is no self arm on <ui-media>/<ui-content>."
				},
				"exp": {
					"axis": "reveal-animation",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_rvl"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:90",
						"ui/reveal/ui-reveal.css:259-276",
						"ui/reveal/ui-reveal.css:280-327"
					],
					"notes": "Writes `--_rvl: exp`; geometry in `@container bs-rvl style(--_rvl: exp)` — block-size 0 -> auto (needs `interpolate-size: allow-keywords` on the host) with content-visibility and padding transitions. The ONLY animation that needs no <ui-face> (it animates the host, and render.js emits <ui-face> only for flp/sld/grw). No corner/direction arg, and no lg: form."
				},
				"pop": {
					"axis": "reveal-mode",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--ui-reveal-expand-m",
						"--ui-media-ar",
						"--ui-reveal-content-fs"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:274-275",
						"ui/reveal/ui-reveal.css:280-327",
						"ui/reveal/ui-reveal.css:556-558"
					],
					"notes": "Popup mode — `exp` ONLY (all rules are nested under `:where(ui-reveal[variant~=\"exp\"])`, and the transition override lives inside the exp style-query block); armed by `:has(> details[open])`. Heavy real-property token: the host becomes an in-flow placeholder (aspect-ratio, background, `container-type: normal` to release its own containment) with a fixed ::before backdrop, and the inner <details> goes `position: fixed` with the ui-reveal-pop entry animation. Animates on OPEN only (close snaps). Known limitation: a <lay-out-group> band still clips it (its own container-type: inline-size implies contain: layout); <lay-out> carries an unlayered escape hatch (ui/reveal/ui-reveal.css:556-558), the group does not."
				},
				"scr": {
					"axis": "scroll",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-reveal"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/reveal/ui-reveal.css:327-343",
						"ui/reveal/ui-reveal.css:359-372",
						"ui/reveal/ui-reveal.css:414-419"
					],
					"notes": "Reveal PANEL scroll — only active under flp / sld (panel goes `position: absolute; inset: 0` so a long flipside can't grow the card, with the shared scroll-edge-fade mask) and under grw / lg:grw (overflow-y auto, scrollbar hidden). Inert under exp. Reads --ui-reveal-content-bs / --ui-reveal-scrollbar-color; writes no custom property of its own — the fade knobs (--ui-scroll-fade-size-s/-e, --ui-scroll-fade-ramp-s/-e) all take their defaults (3rem edge, 10% ramp). The panel gets --ui-scroll-fade-mask from the engine's own `ui-reveal > details > *` rule, so ANY panel element works — a plain <div> panel is masked identically to a <ui-content> one. Gated on @supports (animation-timeline: scroll()) + prefers-reduced-motion. HOMONYM of content='s `scr` — different attribute, different target (content= scrolls the text column inside <ui-content>). Both drive the one engine in ui/base/scroll.css."
				},
				"sub": {
					"axis": "subgrid",
					"element": null,
					"args": {},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--_sub"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": false,
					"hosts": [
						"ui-card"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/ui-card.css:135-198",
						"layout/core/base.css:331-354"
					],
					"notes": "Opt-in wrapper flattening so a card's parts join the rows of a parent <lay-out>'s subgrid (F-38) — replaces the old demo-local `display: contents` hack in layout/demo-assets/wpp.css. FLAG RELAY, not a breakpoint: the layout's bare `subgrid` breakpoint token flips `--_subgrid: on` on the <lay-out> inside whichever @media the builder emitted it for; `sub` syncs to that live flag and NEVER names a breakpoint of its own, so switching the markup from lg=\"columns(3) subgrid\" to xl=\"…\" (or md=, or several) needs no card-side change. TWO HOPS because a style query resolves against the SUBJECT'S PARENT: hop 1's subject is the card, whose parent is the <lay-out>, so it can read the non-inheriting --_subgrid; hop 2's subject is <cq-box>, whose parent is the card, which has no --_subgrid of its own — so hop 1 relays into --_sub, an ordinary INHERITING custom property (not @property-registered on purpose) that <cq-box> and <ui-content> can read. Verified in Chromium: the single-hop form matches nothing. Flattens `> cq-box` and `> cq-box > ui-content` only — <ui-media> stays a box because it IS the row-1 grid item (dissolving it would drop asr()/rds()/scrim and spill its <img> + furniture across rows). A nested host resets --_sub to 0 (nearest-host-wins boundary) so a subgridded outer card can't flatten an inner one. Known consequences: while flattened <ui-content>'s box is gone, so pad()/gap() do nothing and rhythm comes from the layout's row gaps (rg(N)); and the subgrid engine's `container-type: normal` on the card suspends the card's own md:/lg: container tiers for as long as the flag is on. NOT supported on <ui-reveal> — its front face is details > summary and dissolving those destroys the disclosure surface + ::details-content animation. variant= is host-only by design — there is no self arm on <ui-media>/<ui-content>."
				}
			}
		},
		"content": {
			"attribute": "content",
			"tokens": {
				"pad": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-p"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:23-29",
						"ui/card/ui-card.css:244-250",
						"ui/card/ui-card.css:342-348",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, all sides (--ui-content-p). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"pb": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-pb"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:38-44",
						"ui/card/ui-card.css:252-258",
						"ui/card/ui-card.css:350-356",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, block axis (--ui-content-pb). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"pi": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-pi"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:46-52",
						"ui/card/ui-card.css:260-266",
						"ui/card/ui-card.css:358-364",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, inline axis (--ui-content-pi). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"pbs": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-pbs"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:54-60",
						"ui/card/ui-card.css:268-274",
						"ui/card/ui-card.css:366-372",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, block-start side (--ui-content-pbs). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"pbe": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-pbe"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:62-68",
						"ui/card/ui-card.css:276-282",
						"ui/card/ui-card.css:374-380",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, block-end side (--ui-content-pbe). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"pis": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-pis"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:70-76",
						"ui/card/ui-card.css:284-290",
						"ui/card/ui-card.css:382-388",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, inline-start side (--ui-content-pis). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"pie": {
					"axis": "padding",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-pie"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:78-84",
						"ui/card/ui-card.css:292-298",
						"ui/card/ui-card.css:390-396",
						"ui/card/content.css:149-152"
					],
					"notes": "Padding, inline-end side (--ui-content-pie). PRECEDENCE LIVES IN THE var() CHAIN, NOT THE CASCADE: the four longhands on <ui-content> resolve side -> axis -> all-sides (ui/card/content.css:149-152), so the seven stems are seven independent slots that compose in any order and from any element. A breakpoint changes the VALUE in a slot, never the slot order — `pbs(sm) lg:pad(xl)` keeps block-start at sm. Base rules are whole-token (~=) so they never substring-match the md:/lg: forms; the responsive forms ship BOTH arms — the host arm `:where([content~=\"md:…\"]) :is(cq-box, summary)` and the ui-content self arm — inside `@container bs-card (…)`. The host arm needs a cq-box/summary descendant, so ancestor placement only drives the prefixed forms on ui-card / ui-reveal / lay-out-group-with-cq-box."
				},
				"gap": {
					"axis": "spacing",
					"element": null,
					"args": {
						"size": [
							"none",
							"xs",
							"sm",
							"md",
							"lg"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-gap"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:87-91",
						"ui/card/content.css:138",
						"ui/card/ui-card.css:233-237",
						"ui/card/ui-card.css:335-339",
						"ui/reveal/ui-reveal.css:60"
					],
					"notes": "Row gap between parts (<ui-content> is a flex column; default `gap: 1em`). NARROWER value set than the padding stems: none xs sm md lg — there is no gap(xl)/gap(2xl), at base or at md:/lg:. <ui-reveal> pre-sets --ui-content-gap from --ui-reveal-row-gap (ui-reveal.css:60), so on a reveal front face gap() overrides a component default rather than the 1em fallback. Both arms on the responsive forms (host `:is(cq-box, summary)` + `ui-content` self)."
				},
				"scl": {
					"axis": "type-scale",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"mode": [
							"fix",
							"fluid"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-fs",
						"--ui-content-headline",
						"--ui-content-tx-sm",
						"--ui-content-tx-md",
						"--ui-content-tx-lg",
						"--ui-content-tx-xl",
						"--ui-content-hl-sm",
						"--ui-content-hl-md",
						"--ui-content-hl-lg",
						"--ui-content-hl-xl",
						"--ui-content-hl-2xl",
						"--ui-content-hl-3xl",
						"--ui-content-fs-sm",
						"--ui-content-fs-md",
						"--ui-content-fs-lg",
						"--ui-content-fs-xl",
						"--ui-content-fs-2xl",
						"--ui-content-headline-sm",
						"--ui-content-headline-md",
						"--ui-content-headline-lg",
						"--ui-content-headline-xl",
						"--ui-content-headline-2xl",
						"--ui-content-headline-3xl"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.typography.css:45-91",
						"ui/card/content.typography.css:114-127",
						"ui/card/content.typography.css:128-141",
						"ui/card/content.typography.css:153-208",
						"ui/card/content.typography.css:227-284",
						"ui/card/content.typography.css:285-342"
					],
					"notes": "TWO DISJOINT ARG CLASSES WITH DIFFERENT MECHANICS.\n(1) STEPS (sm md lg xl) — the master step. Each writes the ACTIVE props (--ui-content-fs, --ui-content-headline) AND re-points both relational ladders (--ui-content-tx-* body, --ui-content-hl-* headline): scl(sm) = one step down, scl(md) = identity (written explicitly so a nested scl(md) resets an inherited shift), scl(lg) = +1, scl(xl) = +2, SATURATING at the ends. That is why hl(2xl) under scl(sm) renders the xl stop, and why the group size tokens need no md:/lg: forms of their own. Ladder values inherit as unresolved token streams (clamp() is not evaluated in custom properties), so they re-resolve wherever a size token re-declares. Prefixable, both arms.\n(2) MODES (fix, fluid) — NOT prefixable, and the one documented cascade exception (analysis §2b): they re-point the STOP vars (fluid cqi clamps <-> the global static --font-size-* scale) and are written with `:is([content~=\"scl(fix)\"])` at (0,1,0) — everything else in this file is :where() at (0,0,x) — so the nearest mode wins over an ancestor's descendant re-declaration. scl(fluid) comes AFTER scl(fix) in source, so on a tie fluid wins: an explicit scl(fluid) CANNOT be re-fixed further down (a deliberate one-way door). Modes write only stop vars, so they never collide with the size rules.\nSOURCE ORDER IS LOAD-BEARING for the whole file: base scl < md:scl < lg:scl < base hl < md:hl < lg:hl, all tying at :where() specificity.\nThere is no scl(2xl): --ui-content-fs-2xl exists as ladder headroom only. It was once a HOMONYM of variant='s reveal `scl` alias; that alias was removed in v5 (reveal's animation is grw()), so this is now the system's only scl(). A manifest consumer must still key tokens per attribute, never by bare stem."
				},
				"hl": {
					"axis": "type-group",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg",
							"xl",
							"2xl",
							"3xl"
						],
						"tone": [
							"shr",
							"lgt",
							"med",
							"drk",
							"sld",
							"accent",
							"inv"
						],
						"weight": [
							"300",
							"400",
							"500",
							"600",
							"700",
							"800",
							"900"
						],
						"font": [
							"body",
							"head",
							"serif",
							"mono",
							"form"
						],
						"flag": [
							"shd"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-heading-ink",
						"--ui-content-heading-weight",
						"--ui-content-heading-text-shadow",
						"--ui-content-heading-font",
						"--ui-content-headline"
					],
					"realProperties": false,
					"cqPrefixes": [
						"md",
						"lg"
					],
					"cqArgs": [
						"size"
					],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.typography.css:463-502",
						"ui/card/content.typography.css:511-518",
						"ui/card/content.typography.css:519-526",
						"ui/card/content.css:237-247",
						"ui/card/content.css:250-256"
					],
					"notes": "Headings group — restyles headline (+ bare h2-h6) and subheadline. Four DISJOINT arg vocabularies on one stem (size / tone / weight / font / flag), so whole-token matching can never confuse them and they compose freely on the same token: `hl(lg) hl(accent) hl(700)`. Tone maps to the 5-step ink ramp (shr 30% / lgt 45% / med 65% = --ui-content-muted / drk 85% / sld = --color-text) plus accent (--color-accent) and inv (#fff, for overlays) — note the CSS var names are NOT the arg names: lgt -> --ui-content-soft, med -> --ui-content-muted. Weight maps to --font-weight-* except 800, which is a literal (there is no --font-weight-extrabold). SIZE args are RELATIONAL: they read the ladder var with the absolute stop as fallback (`var(--ui-content-hl-lg, var(--ui-content-headline-lg))`), so with no scl() present the token IS its absolute stop, and with scl() it shifts. Size rules are DUAL-DECLARED — on the token host AND on the host's OWN queryable descendant, `:where(ui-card[content~=\"…\"]) > cq-box` and `:where(ui-reveal[content~=\"…\"] > details) > summary` — because var() substitution happens where the property is declared, and only a re-declaration on cq-box/summary can pick up a responsive md:/lg:scl() ladder remap made there. The dual declaration is deliberately scoped to the host's own box (not the broad `:is(cq-box, summary)` the md:/lg: rules use) so a size token on an outer group cannot reach into nested cards (nearest-host-wins). hl(<size>) sizes the HEADLINE only (sm-3xl, two display steps beyond the scl() ramp) and must sit AFTER every scl() form in source, because both write --ui-content-headline at tying specificity — that ordering is what lets an explicit hl() beat the master step at every breakpoint. hl(<font>) writes --ui-content-heading-font; because --font-heading resolves to `inherit`, a headline follows fnt() unless hl(<font>) overrides. hl(grad) was REMOVED in v5 — gradient headlines are now the <ui-gradient-text> element (@browser.style/gradient-text) wrapping the words in the headline data, which the renderer passes through renderInline()'s tag allowlist; the card no longer owns any background-clip styling. hl(shd)/the group shadow prop is also set automatically by a host ovr() for legibility over a scrim. No md:/lg: forms for tone/weight/flag (deferred: one rule per token x tier x arm); hl(<size>) IS prefixable."
				},
				"eb": {
					"axis": "type-group",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"tone": [
							"shr",
							"lgt",
							"med",
							"drk",
							"sld",
							"accent",
							"inv"
						],
						"weight": [
							"300",
							"400",
							"500",
							"600",
							"700",
							"800",
							"900"
						],
						"flag": [
							"flat",
							"shd"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-eyebrow-ink",
						"--ui-content-eyebrow-weight",
						"--ui-content-eyebrow-transform",
						"--ui-content-eyebrow-text-shadow",
						"--ui-content-eyebrow-fs"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.typography.css:364-392",
						"ui/card/content.css:219-226"
					],
					"notes": "Eyebrow group — restyles eyebrow. Four DISJOINT arg vocabularies on one stem (size / tone / weight / flag), so whole-token matching can never confuse them and they compose freely on the same token: `eb(lg) eb(accent) eb(700)`. Tone maps to the 5-step ink ramp (shr 30% / lgt 45% / med 65% = --ui-content-muted / drk 85% / sld = --color-text) plus accent (--color-accent) and inv (#fff, for overlays) — note the CSS var names are NOT the arg names: lgt -> --ui-content-soft, med -> --ui-content-muted. Weight maps to --font-weight-* except 800, which is a literal (there is no --font-weight-extrabold). SIZE args are RELATIONAL: they read the ladder var with the absolute stop as fallback (`var(--ui-content-hl-lg, var(--ui-content-headline-lg))`), so with no scl() present the token IS its absolute stop, and with scl() it shifts. Size rules are DUAL-DECLARED — on the token host AND on the host's OWN queryable descendant, `:where(ui-card[content~=\"…\"]) > cq-box` and `:where(ui-reveal[content~=\"…\"] > details) > summary` — because var() substitution happens where the property is declared, and only a re-declaration on cq-box/summary can pick up a responsive md:/lg:scl() ladder remap made there. The dual declaration is deliberately scoped to the host's own box (not the broad `:is(cq-box, summary)` the md:/lg: rules use) so a size token on an outer group cannot reach into nested cards (nearest-host-wins). eb(flat) drops the default uppercase (--ui-content-eyebrow-transform: none). eb(<size>) writes the eyebrow part's fs hook WITH its 0.78 factor already applied. The eyebrow part is its own group representative, so the group prop and the part hook share a name (--ui-content-eyebrow-ink); the older -color hook survives as an alias. No md:/lg: forms for tone/weight/flag (deferred: one rule per token x tier x arm); group sizes need no prefixes — a responsive scl() shifts them through the ladder."
				},
				"tx": {
					"axis": "type-group",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"tone": [
							"shr",
							"lgt",
							"med",
							"drk",
							"sld",
							"accent",
							"inv"
						],
						"weight": [
							"300",
							"400",
							"500",
							"600",
							"700",
							"800",
							"900"
						],
						"flag": [
							"shd"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-body-ink",
						"--ui-content-body-weight",
						"--ui-content-body-text-shadow",
						"--ui-content-body-fs"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.typography.css:395-423",
						"ui/card/content.css:259-266"
					],
					"notes": "Body group — restyles summary, quote, list, address, timeline, price, stat. Four DISJOINT arg vocabularies on one stem (size / tone / weight / flag), so whole-token matching can never confuse them and they compose freely on the same token: `tx(lg) tx(accent) tx(700)`. Tone maps to the 5-step ink ramp (shr 30% / lgt 45% / med 65% = --ui-content-muted / drk 85% / sld = --color-text) plus accent (--color-accent) and inv (#fff, for overlays) — note the CSS var names are NOT the arg names: lgt -> --ui-content-soft, med -> --ui-content-muted. Weight maps to --font-weight-* except 800, which is a literal (there is no --font-weight-extrabold). SIZE args are RELATIONAL: they read the ladder var with the absolute stop as fallback (`var(--ui-content-hl-lg, var(--ui-content-headline-lg))`), so with no scl() present the token IS its absolute stop, and with scl() it shifts. Size rules are DUAL-DECLARED — on the token host AND on the host's OWN queryable descendant, `:where(ui-card[content~=\"…\"]) > cq-box` and `:where(ui-reveal[content~=\"…\"] > details) > summary` — because var() substitution happens where the property is declared, and only a re-declaration on cq-box/summary can pick up a responsive md:/lg:scl() ladder remap made there. The dual declaration is deliberately scoped to the host's own box (not the broad `:is(cq-box, summary)` the md:/lg: rules use) so a size token on an outer group cannot reach into nested cards (nearest-host-wins). tx(<size>) writes --ui-content-body-fs, which summary reads at x1.0 and the factor parts (price x1.35, stat x2, quote x1.1, address x0.9) multiply. No md:/lg: forms for tone/weight/flag (deferred: one rule per token x tier x arm); group sizes need no prefixes — a responsive scl() shifts them through the ladder."
				},
				"mt": {
					"axis": "type-group",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg",
							"xl"
						],
						"tone": [
							"shr",
							"lgt",
							"med",
							"drk",
							"sld",
							"accent",
							"inv"
						],
						"weight": [
							"300",
							"400",
							"500",
							"600",
							"700",
							"800",
							"900"
						],
						"flag": [
							"shd"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-meta-ink",
						"--ui-content-meta-weight",
						"--ui-content-meta-text-shadow",
						"--ui-content-meta-base"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.typography.css:426-455",
						"ui/card/content.css:270-275"
					],
					"notes": "Meta group — restyles meta, caption, byline, footer, tags, rating, options. Four DISJOINT arg vocabularies on one stem (size / tone / weight / flag), so whole-token matching can never confuse them and they compose freely on the same token: `mt(lg) mt(accent) mt(700)`. Tone maps to the 5-step ink ramp (shr 30% / lgt 45% / med 65% = --ui-content-muted / drk 85% / sld = --color-text) plus accent (--color-accent) and inv (#fff, for overlays) — note the CSS var names are NOT the arg names: lgt -> --ui-content-soft, med -> --ui-content-muted. Weight maps to --font-weight-* except 800, which is a literal (there is no --font-weight-extrabold). SIZE args are RELATIONAL: they read the ladder var with the absolute stop as fallback (`var(--ui-content-hl-lg, var(--ui-content-headline-lg))`), so with no scl() present the token IS its absolute stop, and with scl() it shifts. Size rules are DUAL-DECLARED — on the token host AND on the host's OWN queryable descendant, `:where(ui-card[content~=\"…\"]) > cq-box` and `:where(ui-reveal[content~=\"…\"] > details) > summary` — because var() substitution happens where the property is declared, and only a re-declaration on cq-box/summary can pick up a responsive md:/lg:scl() ladder remap made there. The dual declaration is deliberately scoped to the host's own box (not the broad `:is(cq-box, summary)` the md:/lg: rules use) so a size token on an outer group cannot reach into nested cards (nearest-host-wins). mt(<size>) writes --ui-content-meta-BASE, not --ui-content-meta-fs: -meta-fs stays the meta part's own literal font-size hook, while the group's parts multiply their factor (meta x0.75, byline x0.82, footer x0.78, tags x0.72, rating x0.9, options x0.9) onto -meta-base. No md:/lg: forms for tone/weight/flag (deferred: one rule per token x tier x arm); group sizes need no prefixes — a responsive scl() shifts them through the ladder."
				},
				"fnt": {
					"axis": "font",
					"element": null,
					"args": {
						"font": [
							"body",
							"head",
							"serif",
							"mono",
							"form"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-font"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.typography.css:530-534",
						"ui/card/content.css:136"
					],
					"notes": "Container font family for the WHOLE text column (`font-family: var(--ui-content-font, var(--font-body))`). Same five-value vocabulary as hl(<font>), and deliberately disjoint from hl()'s size/tone/weight/flag args so `fnt(serif) hl(body)` (and its reverse) compose. head -> --font-heading, which itself resolves to `inherit` — so fnt(head) alone is a no-op unless the page defines --font-heading."
				},
				"rds": {
					"axis": "corners",
					"element": null,
					"args": {
						"size": [
							"non",
							"sm",
							"md",
							"lg",
							"xl",
							"2xl",
							"full",
							"pill",
							"sm-sq",
							"md-sq",
							"lg-sq",
							"xl-sq"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "substring",
					"writes": [
						"--ui-content-radius",
						"--ui-content-squircle-exp"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:111-123",
						"ui/card/content.css:124-125",
						"ui/card/content.css:132"
					],
					"notes": "NEW this round (R-10b) and aimed at the STANDALONE <ui-content> — inside a card the host rounds itself and clips the inner areas via overflow: hidden, so the default 0 is inert there. SUBSTRING matched (`[content*=\"rds(sm)\"]`), unlike every other content token except scr's companion arms: safe because rds() has no md:/lg: forms to shadow and `rds(sm)` is not a substring of `rds(sm-sq)` (the closing paren separates them). Same scale as variant='s and media='s rds(); the rds(none) alias was removed in v5 on all three attributes, so `non` is the only spelling. Values come from ui/base/tokens.css. The -sq shape rule is a second substring selector on `-sq)` with both arms (`:where([content*=\"-sq)\"]) ui-content` and `:where(ui-content[content*=\"-sq)\"])`) and is this token's real property (corner-shape: superellipse)."
				},
				"plc": {
					"axis": "placement",
					"element": null,
					"args": {
						"pos": [
							"ts",
							"tc",
							"te",
							"cs",
							"cc",
							"ce",
							"bs",
							"bc",
							"be"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-place-block",
						"--ui-content-place-inline"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:100"
					],
					"notes": "3x3 placement of the content rows inside the column's box — the same nine logical cells as the media-furniture grid, but via flex alignment, NOT absolute positioning: block letter -> justify-content (start|center|end; visible only when the column is taller than its rows, e.g. a row card beside asr(1/1) media), inline letter -> align-items. Sits UNDER the ovr() slots (--ui-content-ov-align/-justify win in overlay mode). The old combined ctr/end bare flags are REMOVED — ctr ≈ plc(tc) tal(ctr), end ≈ plc(te) tal(end). Does not touch text-align — that's tal()."
				},
				"wid": {
					"axis": "measure",
					"element": null,
					"args": {
						"size": [
							"sm",
							"md",
							"lg",
							"xl",
							"2xl"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-max"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:120"
					],
					"notes": "Text measure — caps each content row's max-inline-size: sm 35ch, md 50ch, lg 65ch, xl 80ch, 2xl 100% (no cap). The no-token default is the prose measure --width-prose (65ch), applied to ui-content's direct children so plc()'s inline letter can still place the capped rows. scr(x) rows are exempt (they must overflow). No xs step — the type ladders start at sm; only the spacing scale has xs. ch values stay un-tokenized by design."
				},
				"tal": {
					"axis": "alignment",
					"element": null,
					"args": {
						"value": [
							"start",
							"ctr",
							"end"
						]
					},
					"argAliases": {},
					"bare": false,
					"matching": "whole",
					"writes": [
						"--ui-content-text-align"
					],
					"realProperties": false,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:128"
					],
					"notes": "Explicit text-align: start (the no-token default), ctr, end. Sits UNDER the ovr() slot like plc() — content= inherits freely, so a group-level tal(ctr) must not override a nested overlay card's cell-derived text alignment (the removed ctr/end flags had the same rank)."
				},
				"scr": {
					"axis": "scroll",
					"element": null,
					"args": {
						"value": [
							"x",
							"y"
						]
					},
					"argAliases": {},
					"bare": true,
					"matching": "whole",
					"writes": [
						"--ui-scroll-fade-dir",
						"--ui-scroll-fade-start",
						"--ui-scroll-fade-end"
					],
					"realProperties": true,
					"cqPrefixes": [],
					"cqArgs": [],
					"selfArm": true,
					"hosts": [
						"ui-content",
						"ui-card",
						"ui-reveal",
						"lay-out-group",
						"any-ancestor"
					],
					"requiresJs": {},
					"deprecated": false,
					"canonical": null,
					"sources": [
						"ui/card/content.css:143-149",
						"ui/card/content.css:151-164",
						"ui/card/content.css:165-183",
						"ui/card/content.css:461-465",
						"ui/base/scroll.css"
					],
					"notes": "Scrollable text column with a masked fade edge. Bare `scr` == `scr(y)` (vertical, back-compat default) sets max-block-size / overflow-y / overscroll-behavior / scrollbar-width; `scr(x)` is a horizontal row — it flips --ui-scroll-fade-dir to `to var(--_dir-e)` (the shared direction resolver in ui/base/core.css, so the fade mirrors under dir=rtl), sets flex-flow: row nowrap + white-space: nowrap and forces `flex: 0 0 auto` on the children (they must not shrink or they would reflow instead of overflowing), with an extra flex-wrap: nowrap override for [data-part=\"tags\"] placed AFTER the tags rule so it wins at equal specificity. Whole-token (~=) so scr, scr(x) and scr(y) stay distinct. TWO ARMS everywhere (ancestor arm `:where([content~=\"scr\"]) ui-content` + self arm `:where(ui-content[content~=\"scr\"])`) because the effect is real properties on the <ui-content> box. The animation / mask half is gated on @supports (animation-timeline: scroll()) and prefers-reduced-motion, and is two arms again there because the axis is a compile-time literal — `scroll(self block)` for scr/scr(y), `scroll(self inline)` for scr(x); a var() is not allowed inside scroll(). The @property registrations, the ui-scroll-fade-s / ui-scroll-fade-e keyframes and --ui-scroll-fade-mask are the shared engine in ui/base/scroll.css (also driven by reveal's variant=scr and lay-out overflow=fade*). Every knob is registered inherits:false, so the 3rem edge / 10% ramp defaults are per-scroller and an outer scroller can never leak its own into a nested one — set --ui-scroll-fade-size-s/-e or -ramp-s/-e ON the <ui-content> itself, not on an ancestor. HOMONYM of variant='s reveal `scr`."
				}
			},
			"bareFlags": {}
		}
	}
};
