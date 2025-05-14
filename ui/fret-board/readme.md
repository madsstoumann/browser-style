# FretBoard

**FretBoard** is a custom HTML element (`<fret-board>`) designed to visually represent musical instrument chord diagrams, such as those for guitar, ukulele, banjo, or mandolin. It dynamically renders a fretboard grid based on specified attributes for the number of strings and frets. Individual notes are represented by slotted `<string-note>` custom elements, which can indicate fret position, finger used, open strings, muted strings, and barre chords.

The component is accessible, with the interactive chord name providing a localized `aria-label`. Detailed, localized fingering information is available in an expandable panel. It utilizes `adoptedStyleSheets` for efficient styling across multiple instances.

## How to Use

1.  **Include the JavaScript file**:
    Make sure `index.js` (or the compiled version) is included in your HTML page as a module.
    ```html
    <script type="module" src="path/to/fret-board/index.js"></script>
    ```

2.  **Use the `<fret-board>` element**:
    Add the `<fret-board>` tag to your HTML. You can customize its appearance and behavior using attributes.

    **Basic Example (G Major Chord):**
    ```html
    <fret-board frets="4" strings="6" chord="G Major">
        <string-note string="6" fret="3" finger="2"></string-note>
        <string-note string="5" fret="2" finger="1"></string-note>
        <string-note string="4" open></string-note>
        <string-note string="3" open></string-note>
        <string-note string="2" open></string-note>
        <string-note string="1" fret="3" finger="3"></string-note>
    </fret-board>
    ```

    **With Fret Numbers (starting at fret 7):**
    ```html
    <fret-board frets="4" strings="6" chord="Cmaj9">
        <string-note string="6" mute></string-note>
        <string-note string="5" fret="3" finger="2"></string-note>
        <string-note string="4" fret="2" finger="1"></string-note>
        <string-note string="3" fret="4" finger="4"></string-note>
        <string-note string="2" fret="3" finger="3"></string-note>
        <string-note string="1" open></string-note>
        <ol><li value="7"></li></ol> <!-- Indicates fret numbers start at 7 -->
    </fret-board>
    ```

    **Left-Handed Version:**
    ```html
    <fret-board frets="4" strings="6" chord="G Major" left-handed>
        <!-- string-note elements as above -->
    </fret-board>
    ```

    **Language Setting (French):**
    ```html
    <fret-board frets="4" strings="6" chord="G Major" lang="fr">
        <!-- string-note elements as above -->
    </fret-board>
    ```

### `<fret-board>` Attributes:

*   `frets`: (Optional) Number of frets to display. Default: `4`.
*   `strings`: (Optional) Number of strings to display. Default: `6`.
*   `chord`: (Optional) Name of the chord (e.g., "G Major"). Used for display and ARIA label.
*   `left-handed`: (Optional) Boolean attribute. If present, displays the fretboard in a mirrored (left-handed) orientation.
*   `lang`: (Optional) Language code (e.g., "en", "fr", "da") for the ARIA label. Defaults to browser/document language or "en".

### `<string-note>` Attributes (slotted inside `<fret-board>`):

*   `string`: The string number (e.g., "6" for the thickest E string on a guitar).
*   `fret`: The fret number for a fretted note.
*   `finger`: (Optional) The finger number to use (e.g., "1", "2", "3", "4").
*   `barre`: (Optional) For barre chords. The value indicates how many strings the barre covers, starting from the `string` attribute and moving towards higher-pitched strings. E.g., `barre="6"` on `string="6"` means a barre across all 6 strings.
*   `open`: (Optional) Boolean attribute. Indicates an open string.
*   `mute`: (Optional) Boolean attribute. Indicates a muted string.

## CSS Custom Properties

The `<fret-board>` component and its slotted `<string-note>` elements can be styled using the following CSS custom properties:

| Property                             | Default Value                                       | Description                                                                                                | Scope         |
| ------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| `--fret-board-bg`                    | `light-dark(#EEE, #333)`                            | Background color of the fretboard.                                                                         | `fret-board`  |
| `--fret-board-fret-c`                | `light-dark(#000, #FFF)`                            | Color of the fret lines.                                                                                   | `fret-board`  |
| `--fret-board-fret-w`                | `clamp(0.0625rem, 0.03125rem + 0.5cqi, 0.5rem)`     | Width (thickness) of the fret lines.                                                                       | `fret-board`  |
| `--fret-board-string-c`              | `light-dark(#0008, #FFF8)`                          | Color of the string lines.                                                                                 | `fret-board`  |
| `--fret-board-string-w`              | `clamp(0.0625rem, 0.03125rem + 0.5cqi, 0.125rem)`    | Width (thickness) of the string lines.                                                                     | `fret-board`  |
| `--fret-board-bdrs`                  | `.5rem`                                             | Border radius of the fretboard.                                                                            | `fret-board`  |
| `--fret-board-ff`                    | `inherit`                                           | Font family used within the component (e.g., for chord name, fret numbers).                                | `fret-board`  |
| `--fret-board-top-row-h`             | `12%`                                               | Height of the area above the first fret (typically for open/muted string indicators).                      | `fret-board`  |
| `--fret-board-bottom-row-h`          | `15%`                                               | Height of the area below the last fret (typically for the chord name).                                     | `fret-board`  |
| `--fret-board-fret-bg`               | `#0000` (transparent)                               | Background color of the fret/string grid area (behind the lines).                                          | `fret-board`  |
| `--fred-board-fret-bbsw`             | `1.5cqi`                                            | Box shadow spread for the "nut" (the thick line at the top of the frets, if fret 0 is displayed).          | `fret-board`  |
| `--fret-board-chord-c`               | `light-dark(#222, #FFF)`                            | Color of the chord name text.                                                                              | `fret-board`  |
| `--fret-board-chord-fs`              | `7.5cqi`                                            | Font size of the chord name text.                                                                          | `fret-board`  |
| `--fret-board-chord-fw`              | `500`                                               | Font weight of the chord name text.                                                                        | `fret-board`  |
| `--fret-board-fret-number-fs`        | `5cqi`                                              | Font size for slotted fret numbers (in `<ol>`).                                                            | `fret-board`  |
| `--fret-board-fret-number-fw`        | `400`                                               | Font weight for slotted fret numbers.                                                                      | `fret-board`  |
| `--fret-board-chord-info-bg`         | `light-dark(#444, #FFF)`                            | Background color of the chord info panel (revealed by clicking the chord name).                            | `fret-board`  |
| `--fret-board-chord-info-bdrs`       | `.5rem`                                             | Border radius of the chord info panel.                                                                     | `fret-board`  |
| `--fret-board-chord-info-c`          | `light-dark(#FFF, #444)`                            | Text color of the chord info panel.                                                                        | `fret-board`  |
| `--string-note-h`                    | `12cqi`                                             | Height (and width, for aspect-ratio 1) of a standard `string-note` dot.                                    | `string-note` |
| `--string-note-open-mute-h`          | `5cqi`                                              | Height and width of `string-note` indicators for open or muted strings.                                    | `string-note` |
| `--string-note-bg`                   | `currentColor`                                      | Background color of a standard `string-note` dot.                                                          | `string-note` |
| `--string-note-c`                    | `light-dark(#FFF, #222)`                            | Text color for the finger number inside a `string-note` dot.                                               | `string-note` |
| `--string-note-fs`                   | `7cqi`                                              | Font size for the finger number inside a `string-note` dot.                                                | `string-note` |
| `--string-note-fw`                   | `500`                                               | Font weight for the finger number inside a `string-note` dot.                                              | `string-note` |
| `--string-note-barre-o`              | `.6`                                                | Opacity of a `string-note` when it represents a barre.                                                     | `string-note` |
| `--string-note-mute-open-c`          | `light-dark(#222, #FFF)`                            | Color of the `string-note` when it represents a muted or open string.                                      | `string-note` |

## Accessibility

*   The `<summary part="chord-name">` element (displaying the chord name) within the component's shadow DOM has a localized `aria-label` (e.g., "Chord: G Major" or "Accord: G Majeur"), making the interactive chord name accessible.
*   When the chord name (`<summary>`) is activated, it reveals a panel (`<span part="chord-info">`) containing a detailed, localized description of the fingering, barre chords, open strings, and muted strings.
*   Slotted `<string-note>` elements are marked with `aria-hidden="true"` as their information is conveyed through the interactive chord name and its associated detail panel.

## Internationalization (i18n)

The text for the chord name's accessible label (`aria-label` on the `<summary>`) and the detailed fingering information (content of the `<span part="chord-info">` panel) are translated based on the effective language. Supported languages currently include:
*   English (en) - Default
*   Chinese (Simplified, zh)
*   Spanish (es)
*   Arabic (ar)
*   French (fr)
*   Danish (da)

The language is determined in the following order of preference:
1.  `lang` attribute on the `<fret-board>` element itself.
2.  `lang` attribute on the `<html>` element.
3.  Browser's preferred language (`navigator.language`).
4.  Default language ('en').

A global `i18n.setLang('langCode')` function is available if you need to programmatically suggest a language change for all components after initial load, though components primarily rely on their own or document's `lang` attribute.