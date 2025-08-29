# Layout Modifiers

Complete list of layout modifiers for the content card component.

## Layout Types
- `stack` - Stack content over media
- `columns(` - Side-by-side layout
- `rows(` - Vertical layout
- `flip` - Reverse order of elements

## Position Alignment
- `po-tl` - Top left
- `po-tc` - Top center  
- `po-tr` - Top right
- `po-cl` - Center left
- `po-cc` - Center center
- `po-cr` - Center right
- `po-bl` - Bottom left
- `po-bc` - Bottom center
- `po-br` - Bottom right

## Text Alignment
- `ta-l` - Left align text
- `ta-c` - Center align text
- `ta-r` - Right align text

## Aspect Ratios
- `ar1x1` - Square (1:1)
- `ar4x3` - Standard (4:3)
- `ar3x4` - Portrait (3:4)
- `ar16x9` - Widescreen (16:9)
- `ar9x16` - Vertical video (9:16)
- `ar3x2` - Classic photo (3:2)
- `ar2x3` - Portrait photo (2:3)
- `ar5x4` - Large format (5:4)
- `ar4x5` - Portrait large (4:5)
- `ar21x9` - Ultrawide (21:9)
- `ar9x21` - Vertical ultrawide (9:21)

## Padding (All Sides)
- `pa0` - No padding
- `pa0.5` - 0.5 space units
- `pa1` - 1 space unit
- `pa1.5` - 1.5 space units
- `pa2` - 2 space units
- `pa2.5` - 2.5 space units
- `pa3` - 3 space units

## Padding Inline (Left + Right)
- `pi0` - No inline padding
- `pi0.5` - 0.5 space units
- `pi1` - 1 space unit
- `pi1.5` - 1.5 space units
- `pi2` - 2 space units
- `pi2.5` - 2.5 space units
- `pi3` - 3 space units

## Padding Block (Top + Bottom)
- `pb0` - No block padding
- `pb0.5` - 0.5 space units
- `pb1` - 1 space unit
- `pb1.5` - 1.5 space units
- `pb2` - 2 space units
- `pb2.5` - 2.5 space units
- `pb3` - 3 space units

## Row Gap
- `rg0` - No gap
- `rg0.5` - 0.5 content units
- `rg1` - 1 content unit
- `rg1.5` - 1.5 content units
- `rg2` - 2 content units
- `rg2.5` - 2.5 content units
- `rg3` - 3 content units

## Width
- `w25` - 25% width
- `w33` - 33.333% width
- `w50` - 50% width
- `w66` - 66.666% width
- `w75` - 75% width
- `w100` - 100% width
- `wfc` - Fit content width
- `wmc` - Min content width

## Themes
- `thd` - Dark theme
- `thl` - Light theme

## Visual Effects
- `ov1` - Enable media overlay

## Usage Example
```html
<content-card layout="stack(po-bc ta-c pa1 ar3x4 ov1)">
  <!-- content -->
</content-card>
```