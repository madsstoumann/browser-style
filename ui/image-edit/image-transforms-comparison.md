# Common Image Transformation Methods

This document lists common image transformation methods available in both Cloudflare Images and the Sharp image processing library.

## Common Methods

| Method | Description |
|--------|-------------|
| background | Set background color when resizing with padding or compositing |
| blur | Apply a blur effect to the image |
| brightness | Adjust image brightness |
| contrast | Adjust image contrast |
| fit | Control how image is resized to specified dimensions (cover, contain, fill, etc.) |
| format | Convert image to a different format (like JPEG, PNG, WebP) |
| gamma | Apply gamma correction |
| gravity/position | Control positioning of image during resize or composition |
| height | Set image height for resizing |
| metadata | Handle image metadata |
| quality | Set compression quality |
| rotate | Rotate the image by a specified angle |
| saturation | Adjust color saturation |
| sharpen | Sharpen the image |
| trim | Trim borders or whitespace |
| width | Set image width for resizing |

## Cloudflare-specific Methods

- anim - Control animated image behavior
- border - Add borders to images
- compression - Specify compression algorithm
- dpr - Set device pixel ratio for responsive images
- onerror - Specify fallback behavior on error

## Sharp-specific Methods

- composite - Composite images together with various blend modes
- extend - Add pixels to edges of image
- extract - Extract specific region of image
- grayscale/greyscale - Convert to black and white
- negate - Invert colors
- pipelineColorspace - Set working colorspace for the processing pipeline
- tint - Apply color tinting to image
- toColorspace - Set output colorspace

## Implementation Details

### Fit Property

Both libraries support similar fit options:
- cover - Resize while preserving aspect ratio and crop if needed (default in Sharp)
- contain - Resize while preserving aspect ratio with padding if needed
- fill - Stretch image to fit dimensions
- inside/inside (Sharp) - Resize within dimensions
- outside (Sharp) - Resize to cover dimensions

### Gravity/Position

Both libraries support positioning using directional terms:
- Sharp: center/centre, north, northeast, east, southeast, south, southwest, west, northwest
- Sharp also supports entropy-based and attention-based smart cropping

## Notes

This comparison is based on the Cloudflare Images API and Sharp image processing library. Implementation details may vary between platforms.
