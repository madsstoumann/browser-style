
A couple of months ago, I wrote an article about [Guitar Chords in CSS](https://dev.to/madsstoumann/guitar-chords-in-css-3hk8), using the new typed `attr()` method in CSS. I didn't plan to write a follow-up, but then I saw [these beautiful posters](https://detkuloerteudvalg.dk/?s=klaverakkorder&post_type=product) and wanted to do something similar. It turned out to be *way* more complicated than guitar chords!

---

## Markup
The markup consists of a single custom element, with a `keys`-attribute:

```html
<piano-chord keys="14">
</piano-chord>
```

`keys` indicates how many *white* keys we want to show on our piano. For now, that's all we need; all the heavy lifting is done in CSS.

---

## CSS


The first thing we do in CSS is grab the `keys` attribute:

```css
piano-chord {
  --_keys: attr(keys type(<number>), 8);
}
```

Next, we need a private const to indicate how many white keys are in a regular octave:

`--_octave-keys: 7;`


OK, so now we can already draw the white keys, which will be simple lines at calculated intervals:


```css
background: linear-gradient(90deg, 
var(--piano-chord-black-key) 
var(--piano-chord-key-gap), 
#0000 0 var(--piano-chord-key-gap));

border-block:
  var(--piano-chord-key-gap)
  solid var(--piano-chord-black-key);
```


I've added a few properties to set the line color and width. We also need to set the `background-size`:

```css
background-size: calc(100% / var(--_keys) - (var(--piano-chord-key-gap) / var(--_keys))) 100%;
```


This gives us:

![White piano keys](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hlb1454byxfg0g4dm2td.png)

---


Next, we need to calculate the octave width, as the five black keys in a regular octave will repeat in the next octave, creating the distinct pattern we know from a piano.


For the next calculations, we need a few more private properties:

### Octave width
```css
--_ow: calc(100% / (var(--_keys) / var(--_octave-keys)));
```
### Black key ratio


The black key is always 60% of the width of a white key, but because we change the octave width dynamically, we need another calculation to keep this ratio:

```css
--_r: calc(var(--_keys) / var(--_octave-keys) * 0.6);
```
### White key width:
```css
--_wkw: calc(100% / var(--_keys));
```

### Black key width
```css
--_bkw: calc(var(--_wkw) * var(--_r));
```


Phew! And we're not done yet! You might recall that the black key is 60% of a white key and placed exactly in the middle between two white keys. Half of 60% is 30%, so we need to place the first black key (between C and D on a piano) at 70% of the first white key (C):

```css
--_off1: calc(0.7 / var(--_octave-keys) * 100%);
```


To skip forward: The next ones are placed at `1.7`, `3.7`, `4.7`, and `5.7`. Now, we need to add five extra gradients to our background, one for each black key in an octave.

I'll just show the code for the first here:

```css
linear-gradient(90deg,
  #0000 0 var(--_off1),
  var(--piano-chord-black-key) var(--_off1)
  calc(var(--_off1) + var(--_bkw)),
  #0000 0))
```


Thankfully, the `background-size` is simple this time: `var(--_ow) 60%`

Let's see what we've got:

![Piano Chord Initial](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pheop48fa7wx4fq8hvrm.png)


Cool! Let's change `keys` to `keys="21"`:

![Piano with 21 white keys](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3jr0752g1lx9c7c7b4dw.png)


Isn't that cool? A CSS-only, attribute-controlled piano pattern?

---

## Adding chord indicators


Now, let's add chords. For that, we need a new custom element, `<piano-key>`:

```html
<piano-chord aria-label="C" keys="14">
  <piano-key note="C"></piano-key>
  <piano-key note="E"></piano-key>
  <piano-key note="G"></piano-key>
 </piano-chord>
```


That wraps up what we need to do in HTML. Let's go back to CSS. First, we set a piano key to be a grid:

```css
piano-key { display: grid; }
```


Next, we need to set at which column location the key is:

```css
piano-key[note="C"] {  grid-column: 1; }
piano-key[note="D"] {  grid-column: 2; }
/* etc. */
```


Next, we add a pseudo-element showing a small dot:

```css
piano-key::after {
  background: var(--_bg, #000);
  border-radius: 50%;
  content: "";
  display: block;
  height: 10px;
  margin-block: 8px;
  place-self: end center;
  width: 10px;
}
```

This renders:

![C major](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xgzg8bl1feqw0m7qvse7.png)


... and that's *almost* it! We need to handle sharp and flat notes:

```css
piano-key[note*="#"] {
  translate: 50% -40%;
}
piano-key[note*="b"] {
  translate: -50% -40%;
}
```


And to make them look just as cool as in the posters I mentioned in the beginning, let's wrap the piano in a wrapper with a dusty blue color and a retro SVG filter (see the final demo for the code!):


![C major dusty blue](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/abes7r98u3uq99qt7ced.png)

And that's it! There is, of course, much more to it, but I've covered most of the basics. Here's a CodePen with a bunch of chords: