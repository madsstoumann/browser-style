
# Video Scrub Component

A web component for scrubbing through video content with crossfade transitions.

## Features
- Crossfade between video sources
- Scrub through video timeline using attributes
- Customizable via CSS variables
- No dependencies

## Usage

### Basic Example
```html
<script src="./index.js"></script>
<video-scrub src="video.mp4" poster="poster.jpg" min="0" max="100" value="50" crossfade="1000"></video-scrub>
```

### Attributes
| Attribute      | Description                                 |
| -------------- | ------------------------------------------- |
| `src`          | Video source URL                            |
| `poster`       | Poster image URL                            |
| `min`          | Minimum scrub value (default: 0)            |
| `max`          | Maximum scrub value (default: 100)          |
| `value`        | Current scrub value                         |
| `crossfade`    | Crossfade duration in ms (default: 1000)    |
| `crossorigin`  | Cross-origin setting (default: anonymous)   |
| `preload`      | Preload setting (default: metadata)         |

### CSS Custom Properties
| Property                   | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `--video-scrub-mask`       | Mask for the host element                        |
| `--video-scrub-mask-start` | Start position for mask (default: 50%)           |
| `--video-scrub-mask-end`   | End position for mask (default: 80%)             |
| `--video-scrub-aspect-ratio` | Aspect ratio for video element                  |
| `--video-scrub-h`          | Height of video element                          |
| `--video-scrub-object-fit` | Object-fit for video element (default: cover)    |
| `--video-scrub-w`          | Width of video element (default: 100%)           |
| `--video-scrub-overlay`    | Overlay gradient for host's ::after pseudo       |

### API
You can set/get attributes via JavaScript:
```js
document.querySelector('video-scrub').value = 75;
document.querySelector('video-scrub').src = 'newvideo.mp4';
```

