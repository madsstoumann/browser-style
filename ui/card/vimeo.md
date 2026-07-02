# Vimeo + `<ui-media>`

How to source **posters**, **playable video**, and a **"gif-like" preview loop** from the
Vimeo API, and feed them into a `provider="vimeo"` frame. Companion module: `vimeo.js`.

> **Security.** Everything that hits the API needs a Vimeo **access token** — a
> **server-side secret** (e.g. `VIMEO_ACCESS_TOKEN` in `.env`). Never expose it to the
> browser. Progressive/HLS links are **signed and expire (~24h)**, so resolve them at
> **render time on the server** and inject fresh URLs into the markup. `normalizeVimeo()`
> and `loopSegment()` are pure/client-safe; only `fetchVimeo()` touches the token.

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
a 1–2s window (`loopSegment()` or a `#t=start,end` media fragment). Smaller, smoother, and
higher quality than a GIF — and it reuses the native-video path. See the "preview loop"
example in [media.html](./media.html).

---

## Using `vimeo.js`

```js
import { fetchVimeo, normalizeVimeo, pickRendition, toUiMediaAttrs, loopSegment } from '@browser.style/card/vimeo.js';

// --- server (has the token) ---
const v = await fetchVimeo(id, process.env.VIMEO_ACCESS_TOKEN);
// v → { id, name, duration, width, height, poster, posters[], src, renditions[], hls, hlsExpires }
const { src, poster } = toUiMediaAttrs(v, { maxHeight: 1080 });
// emit: <ui-media provider="vimeo" src="${src}" poster="${poster}" loop muted> … </ui-media>

const preview = pickRendition(v, 360).link;   // lightweight rendition for a gif-like loop

// --- client (no token) ---
loopSegment(document.querySelector('#preview video'), 0, 2);   // 2s looping preview
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

## Caveats

- **Expiry:** progressive/HLS links die (~24h). Fetch per request; never hardcode in
  committed HTML (any Vimeo `src`/`poster` in the demos is a snapshot and will 404 later —
  regenerate with `fetchVimeo`).
- **Ownership:** `files`/`play` are populated only for videos on the token's account. Public
  videos you don't own give you posters (and the iframe `provider="vimeo" video="ID"` path),
  but not progressive files.
- **Privacy:** don't publish private client footage. Check `privacy.view === 'anybody'` and
  `privacy.embed === 'public'` before surfacing a video outside its origin.
