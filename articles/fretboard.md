In my last article, I looked into the new, improved `attr()` method in CSS. I was [over the moon](https://dev.to/madsstoumann/phases-of-the-moon-in-css-2lbo) (pun intended). This time, I’ll continue looking into the `attr()` method, showing how we can make easily readable components — at least for guitarists — like this:

```html
<fret-board frets="4" strings="6" chord="C Major">
  <string-note string="6" mute></string-note>
  <string-note string="5" fret="3" finger="3"></string-note>
  <string-note string="4" fret="2" finger="2"></string-note>
  <string-note string="3" open></string-note>
  <string-note string="2" fret="1" finger="1"></string-note>
  <string-note string="1" open></string-note>
</fret-board>
```

... become this — with **no JavaScript at all**:

![fret-board component showing a C Major chord](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dcirbfeg46hdw9zjbd1s.png)

Let’s get started!

### Basic grid

First, we need a basic grid. How many cells and rows depend on the `frets` and `strings` attributes we defined in the HTML — so let’s grab those as `<number>` and set two custom properties:

```css
--_frets: attr(frets type(<number>), 4);
--_strings: attr(strings type(<number>), 6);
```

In CSS, we’ll _double_ the number of strings, so we can place notes **on** the strings — one grid-unit to the left of the string itself. We also want top and bottom rows for chord-name and open/mute indicators, so our grid looks like this:

```css
fret-board {
  grid-template-columns: repeat(calc(var(--_strings) * 2), 1fr);
  grid-template-rows:
    var(--fret-board-top-row-h, 12%)
    repeat(calc(var(--_frets)), 1fr)
    var(--fret-board-bottom-row-h, 15%);
}
```

We now have:

![Basic grid](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pslixbxqtedf57wthf7v.png)

### Frets and strings

The frets and strings are added to a pseudo-element as two linear gradients:

```css
fret-board {
  --fret-board-fret-c: light-dark(#000, #FFF);
  --fret-board-fret-w: clamp(0.0625rem, 0.03125rem + 0.5cqi, 0.5rem);
  --fret-board-string-c: light-dark(#0008, #FFF8);
  --fret-board-string-w: clamp(0.0625rem, 0.03125rem + 0.5cqi, 0.125rem);

  background-image:
    /* Vertical strings */
    linear-gradient(
      90deg, 
      var(--fret-board-string-c) var(--fret-board-string-w), 
      transparent 0 var(--fret-board-string-w)
    ),
    /* Horizontal frets */
    linear-gradient(
      180deg,  
      var(--fret-board-fret-c) var(--fret-board-fret-w), 
      transparent 0 var(--fret-board-fret-w)
    );

  background-position: 
    0 var(--fret-board-fret-w), 
    0 0;

  background-repeat: 
    repeat-x, 
    repeat-y;

  background-size:
    /* Width and height for strings */
    calc(100% / (var(--_strings) - 1) - (var(--fret-board-string-w) / var(--_strings))) 
      calc(100% - (2 * var(--fret-board-fret-w))),
    /* Width and height for frets */
    100% 
      calc(100% / var(--_frets) - (var(--fret-board-fret-w) / var(--_frets)));
}
```

OK, that was a handful — but we basically created horizontal lines for frets from top to bottom, and vertical lines for the strings running across the board.

![Added frets and strings](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/spnq1k7e3zwnfdb233lz.png)

### Adding notes and fingers

Let’s add some notes — but first, let’s grab those attributes:

```css
--barre: attr(barre type(<number>), 1);
--fret:  attr(fret type(<number>), 0);
--string:  attr(string type(<number>), 0);
```

We’ll get to `--barre` soon, but for now, we place the note using this formula:

```css
string-note {
  grid-column: calc((var(--_strings) * 2) - (var(--string) * 2 - 1)) / span calc(var(--barre) * 2);  
  grid-row: calc(var(--fret) + 1);
}
```

Let’s break this down:

1. **Grid Column Positioning:**
   - `(var(--_strings) * 2)` - This starts at the rightmost side of our grid
   - `(var(--string) * 2 - 1)` - This calculates how far to move from the right
   - For example, with 6 strings:
     - String 1 (highest) goes at position `12 - (1*2-1) = 11`
     - String 6 (lowest) goes at position `12 - (6*2-1) = 1`

2. **Span Calculation:**
   - `span calc(var(--barre) * 2)` - For regular notes, spans 2 columns
   - For barre chords, spans more columns depending on how many strings are covered

3. **Grid Row Formula:**
   - `calc(var(--fret) + 1)` - The `+1` accounts for the header row
   - Open strings (fret = 0) go in row 1, first fret in row 2, etc.

This gets us:

![Notes and fingers](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nx41fcdtotvr2vhpyd9z.png)

#### Displaying finger numbers

For good tablature, we need to show which finger to use for each note. We get this from the `finger` attribute in our HTML and display it using a pseudo-element:

```css
string-note::after {
  color: var(--string-note-c, light-dark(#FFF, #222));
  content: attr(finger);
  font-size: var(--string-note-fs, 7cqi);
  font-weight: var(--string-note-fw, 500);
  text-box: cap alphabetic;
}
```

> **Note:** `text-box: cap alphabetic` is a modern CSS feature that centers text perfectly by removing extra leading (space above the text) and aligning the text box to the cap height and baseline. The `light-dark()` function automatically adjusts text color for light or dark mode.

#### Muted and open strings

Guitar chords often involve strings that aren’t pressed down but are either played open or muted (not played):

```html
<string-note string="6" mute></string-note>    <!-- Muted string -->
<string-note string="3" open></string-note>    <!-- Open string -->
```

For the visual representation of string states:
- For **muted strings**, we create an X symbol using Temani Atif’s [cross shape](https://css-shape.com/cross/) with `border-image` and a 45° rotation
- For **open strings**, we use a CSS mask with a radial gradient to create a hollow circle effect

```css
string-note[mute] {
  border-image: conic-gradient(var(--fret-board-bg) 0 0) 50%/calc(50% - 0.25cqi);
  rotate: 45deg;
}
string-note[open] {
  border-radius: 50%;
  mask: radial-gradient(circle farthest-side at center, 
    transparent calc(100% - 1cqi), 
    #000 calc(100% - 1cqi + 1px));
}
```

### Barre Chords

A "barre chord" is one where you hold down multiple strings with one finger. Let’s add the `barre` attribute in HTML:

```html
<string-note string="6" fret="1" barre="6" finger="1"></string-note>
```

We already covered the calculations above, but here’s how it looks visually:

![Barre Chord](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/yqwxv95igkhpyj6nnerd.png)

### Fret Numbers

Sometimes, a chord does not start on the first fret, and we need to indicate a fret number. For this, we use an ordered list, `<ol>`, where we set the `value` attribute on the first item:

```html
<ol><li value="7"></li></ol>
```

You can inspect the styles in the final demo, but it looks like this:

![Fret Number](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nbazm2usaz9ddobo6jv3.png)

## Other instruments with frets and strings

Now, the great thing about controlling the CSS from a few attributes is how easy we can make it work for _other_ instruments. Here are some examples:

### Ukulele — 4 strings:
![Ukulele](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/l64el7u7sx7rx1kgkga0.png)

### Banjo — 5 strings:
![Banjo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ygjcsbqk63lygaqif1h8.png)

---

## Demo

---

I hope you enjoyed this article as much as I did writing it — now, I’ll grab my guitar and play some of these chords.