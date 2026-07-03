# Vimeo + `<ui-media>`

How to source **posters**, **playable video**, **subtitles**, and a **"gif-like" preview
loop** from the Vimeo API, and feed them into a `provider="vimeo"` frame. The helpers below
are **reference sketches** to implement server-side — there is no shipped `vimeo.js`.

> **Security.** Everything that hits the API needs a Vimeo **access token** — a
> **server-side secret** (e.g. `VIMEO_ACCESS_TOKEN` in `.env`). Never expose it to the
> browser. Progressive/HLS/VTT links are **signed and expire (~24h)**, so resolve them at
> **render time on the server** and inject fresh URLs into the markup — only the fetch
> touches the token; the normalize/shape step is pure.

---

## What the API gives you

One request returns everything a frame needs:

```
GET https://api.vimeo.com/videos/{id}
    ?fields=name,duration,width,height,pictures.sizes,play.progressive,play.hls,files
Authorization: Bearer <token>
```

### Poster / thumbnail — trivial, no generation

`pictures.sizes[]` — JPEGs from `100×75` up to `1920×1080`, each `{ width, height, link }`,
plus `pictures.base_link`. Use the largest as the poster.

```jsonc
"pictures": {
  "base_link": "https://i.vimeocdn.com/video/<id>-<hash>-d",
  "sizes": [ /* … */ { "width": 1920, "height": 1080, "link": "https://i.vimeocdn.com/video/<id>-<hash>-d_1920x1080?…" } ]
}
```

*(No-token fallback: `https://vumbnail.com/{id}.jpg` — a third-party mirror, lower quality
and no signing. The API poster is crisper and uses the correct crop.)*

### Playable video (native `<video>`, no iframe) — needs a **Pro/Business** account

`play.progressive[]` (or the legacy `files[]`) — MP4 renditions **1080p → 240p**, each with a
`.link` that streams with byte-range (`206 video/mp4`). `play.hls.link` is the HLS manifest
(carries `link_expiration_time`). These are **owner-only** — you get files for videos on your
own account, not arbitrary public ones.

```jsonc
"play": {
  "progressive": [
    { "width": 1920, "height": 1080, "link": "https://player.vimeo.com/progressive_redirect/playback/{id}/rendition/1080p/file.mp4?…" },
    /* 720p, 540p, 360p */ { "width": 426, "height": 240, "link": "…/rendition/240p/file.mp4?…" }
  ],
  "hls": { "link": "https://player.vimeo.com/play/…/hls.m3u8?…", "link_expiration_time": "2026-07-03T11:07:08+00:00" }
}
```

This is exactly the `provider="vimeo" src="…mp4"` path `ui-media` already supports — the
facade swaps the poster for a real `<video>` the `<ui-play>` control keeps toggling.

### Animated preview / GIF — **not** an easy lookup

The API *has* the concept (`animated_thumbset` field; `animated-thumbnail` /
`animated-thumbset` response types), but they are **not auto-generated**: the field comes
back `[]` and there is no ready GET for them — they must be **created per video** (with
`upload`/`edit` scopes). Don't rely on it for on-the-fly previews.

**Do this instead:** a **muted `autoplay loop` of the 240p rendition**, optionally clamped to
a 1–2s window with a `#t=start,end` media fragment. Smaller, smoother, and higher quality than
a GIF — and it reuses the native-video path.

### Animated poster — `preview="…"` on a facade

A `provider="vimeo"` frame accepts a **`preview`** attribute: a small gif-like loop clip.
Instead of a static `<img>` poster, `index.js` injects a **muted autoplay-loop
`<video data-preview>`** as the poster; the still `poster=` (if any) shows until the loop
paints. Pressing play swaps in the real player and drops the preview.

```html
<ui-media provider="vimeo"
          src="…1080p.mp4"                 <!-- full clip (server-resolved, fresh) -->
          preview="…240p-2s.mp4"           <!-- animated poster (the gif-like loop) -->
          poster="…thumb.jpg" loop muted>
  <ui-play><button …><ui-icon type="play-pause"></ui-icon></button></ui-play>
</ui-media>
```

See the "animated poster" cards in [vimeo.html](./vimeo.html).

---

## Reference sketch (implement server-side)

Illustrative only — there is no shipped `vimeo.js`; write these on your server:

```js
// server (has the token)
const v = normalizeVimeo(await fetchVimeo(id, process.env.VIMEO_ACCESS_TOKEN));
// v → { id, name, duration, width, height, poster, posters[], src, renditions[], hls, hlsExpires }
// emit: <ui-media provider="vimeo" src="${v.src}" poster="${v.poster}" loop muted> … </ui-media>

const preview = pickRendition(v, 360);   // lightweight rendition for a #t=0,2 preview loop
const tracks  = await fetchTextTracks(id, token);   // [{ kind, srclang, label, src }] → <track>
```

`normalizeVimeo(raw)` is the pure core — feed it a saved/mocked API object (see the shape
above) to test or to simulate the response without a live call.

### Normalized shape

| Field | From | Notes |
|-------|------|-------|
| `poster` / `posters[]` | `pictures.sizes` | largest last; `poster` = largest |
| `src` / `renditions[]` | `play.progressive` → `files[]` | ascending by height; `src` = highest |
| `hls` / `hlsExpires` | `play.hls` | manifest + expiry timestamp |
| `id name duration width height` | top-level | — |

---

## Subtitles / captions

`GET https://api.vimeo.com/videos/{id}/texttracks` returns each track as
`{ type: "subtitles"|"captions", language, name, active, link }`, where `link` is a **WebVTT**
file — exactly what a native `<track>` needs. Map `type`→`kind`, `language`→`srclang`,
`name`→`label`:

```html
<video …>
  <source src="…1080p.mp4">
  <track kind="subtitles" srclang="da" label="Dansk"   src="…{id}.da.vtt" default>
  <track kind="captions"  srclang="en" label="English" src="…{id}.en.vtt">
</video>
```

- The `<ui-media>` **CC switcher** (`vid(cc)` + a `<select class="ui-media-cc">`) flips
  `textTrack.mode` — a **native-`<video>` only** feature. An **iframe embed** can't expose its
  tracks to us (cross-origin), but the Vimeo player already shows its own captions UI, so no
  switcher is needed there. See the "With subtitles" + "Autumn" cards in
  [vimeo.html](./vimeo.html), and media.md § Video layer for the CSS/JS.
- **CORS:** `<track>` enforces CORS. Vimeo's `captions.cloud.vimeo.com` VTT links are signed
  and may not send permissive `Access-Control-Allow-Origin` → **proxy the VTT through your own
  origin** (same-origin, no `crossorigin` attr, no expiry in the HTML). The token stays server-side.
- **Quality:** `language` ending `-x-autogen` is machine-transcribed (often wrong, esp. across
  languages). Prefer human tracks; treat autogen as best-effort.

## SSR flow

Building a page server-side with API access, per video:

1. **One API call** for durable metadata — `pictures.sizes` (poster), `play.progressive[]`
   (MP4 renditions), `/texttracks` (VTT). `normalizeVimeo()` shapes it.
2. **Emit markup** pointing at those URLs: native `<video src poster><track>` (own account +
   Pro) or an `<iframe src="player.vimeo.com/video/{id}">` embed (any public/unlisted video).

**URL lifetimes — the one gotcha:**

| URL | Lifetime | Strategy |
|-----|----------|----------|
| `player.vimeo.com/video/{id}` (iframe) | **stable** (add `?h=hash` for unlisted) | hardcode freely; captions come free from the player |
| `play.progressive[].link` (MP4) | **signed, ~24h** | resolve at render time, or proxy `/{id}` → fresh signed URL |
| `texttracks[].link` (VTT) | **signed, ~24h** | proxy `/{id}/{lang}` (also fixes CORS) |
| `pictures.sizes[].link` (poster) | long-lived CDN | cache; still safest to re-resolve |

So: cache the **durable metadata** (id, languages, poster hash); resolve **signed media/VTT
URLs on demand** (per request, or a cache shorter than the TTL). Prefer iframe embeds when you
don't need a chrome-less native player — nothing to sign, captions included.

## Caveats

- **Expiry:** progressive/HLS/VTT links die (~24h). Fetch per request; never hardcode in
  committed HTML (any Vimeo `src`/`poster`/VTT in the demos is a snapshot and will 404 later —
  regenerate with `fetchVimeo`). The committed `vimeo-data/` clips + VTTs are gitignored snapshots.
- **Ownership:** `files`/`play` are populated only for videos on the token's account. Public
  videos you don't own give you posters (and the iframe `provider="vimeo" video="ID"` path),
  but not progressive files.
- **Privacy:** don't publish private client footage. Check `privacy.view === 'anybody'` and
  `privacy.embed === 'public'` before surfacing a video outside its origin.
