A couple of years ago, when CSS trigonometry functions became baseline, I [wrote an article](https://css-tricks.com/creating-a-clock-with-the-new-css-sin-and-cos-trigonometry-functions/) about them. One of the examples I did, was a CSS-only analog clock:

[Codepen Example](https://codepen.io/stoumann/pen/wvxOQKo)

Since then, CSS has introduced a _bunch_ of new features — one being `offset-path`, which is perfect for creating indices on a clock (I sound like an horology expert, but I Googled that).

So, without further ado, let's expand my old example with some more, cool features! We'll wrap it within a Web Component for easier customization, but you can stick with CSS-only, if you want.

---

First, we set up a simple grid, divided into 3 rows:

![Main Grid](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i5kjl7popqo5voq5w3zq.png)

```css
:host {
  aspect-ratio: 1;
  background: #f2f2f2;
  border-radius: 50%;
  display: grid;
  grid-template-rows: repeat(3, 1fr);
}
```

The indices are a bunch of `<li>` elements within a `<ul>`, using `offset-distance / path` to place them around the circle:

```css
li {
  display: inline-block;
  list-style: none;
  offset-distance: var(--_d);
  offset-path: content-box;
  width: fit-content;
}
```

Each `<li>` has a degree (actually a percentage), defined  in the `--_d` custom property:

```html
<li style="--_d:0%">|</li>
```

This gets us:

![Indices](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/oszblwrawq3xh4vry5wq.png)

> By default, `offset-rotate` automatically rotates elements to follow the path direction. This behavior is exactly what we need for the indices, so we don't need to set any additional rotation.

Now, for the numerals, we'll also use `<li>`, but this time within an _ordered_ list, `<ol>`:

```html
<ol>
  <li style="--_d:300deg">1</li>
</ol>
```

We'll use `cos()` and `sin()` to place the numerals, like in my original example. 

```css
li {
  --_r: calc((100% - 15cqi) / 2);
  --_x: calc(var(--_r) + (var(--_r) * cos(var(--_d))));
  --_y: calc(var(--_r) + (var(--_r) * sin(var(--_d))));
  aspect-ratio: 1;
  display: grid;
  left: var(--_x);
  place-content: center;
  position: absolute;
  top: var(--_y);
  width: 15cqi;
}
```

And we get:

![Numerals](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rj1ecputaz8d2ko4gx56.png)

Now, let's create the markup for the hands and date. The cap will be added as a pseudo-element. I had a hard time trying to wrap my head around what good, semantic markup would be here? I gave up, and just used a bunch of `<div>`s 😄

```html
<nav part="hands">
  <div part="seconds"></div>
  <div part="minutes"></div>
  <div part="hours"></div>
  <time part="date"></time>
</nav>
```

We position the `<nav>` in the middle row of the main grid, and create a 3-column grid:

```css
:host::part(hands) {
  display: grid;
  grid-area: 2 / 1 / 3 / 1;
  grid-template-columns: repeat(3, 1fr);
}
```

This gives us:
![Hands](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/3xctejzyouzv46oprdb2.png)

Finally, we place the label at the top center of the last row of the main grid:

![Label](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5fqpqdu6vdhmgrj9ukxt.png)

---

## Animating the hands

To animate the hands, we just need a single animation:

```css
@keyframes turn {
  to { transform: rotate(1turn); }
}
```

However, it needs to be **called** in 3 very distinct ways:

```css
:host::part(hours) {
  animation: turn 43200s linear infinite;
  animation-delay: var(--_dh, 0ms);
}
:host::part(minutes) {
  animation: turn 3600s steps(60, end) infinite;
  animation-delay: var(--_dm, 0ms);
}
:host::part(seconds) {
  animation: turn 60s linear infinite;
  animation-delay: var(--_ds, 0ms);
}
```

And that's it! ... if you don't mind the clock always starting at noon!

To initialize the clock with the _actual_ time, we need to update the delay properties: `--_dh`, `--_dm` and `--_ds` — and for that, we need a small snippet of JavaScript:

```js
const time = new Date();
const hour = -3600 * (time.getHours() % 12);
const mins = -60 * time.getMinutes();
app.style.setProperty('--_dm', `${mins}s`);
app.style.setProperty('--_dh', `${(hour+mins)}s`);
```

## Variants

Styling variants is dead simple (see the final demo at the end of the article).

How about a SAIKO:

![SAIKO](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ibdhfqxspcujqmdlhqnd.png)

Or a ROBEX (sorry for my unimaginative names!):

![ROBEX](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fih6t3iqu16gbxjzyoiq.png)

... or how about some _really_ colorful examples:
 
![Burmese, Thai and Indian](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1rbqolr8eizkrx3x10kk.png)

The latter can, of course, be done by adding the labels manually, but if we wrap it in a web component, it becomes a bit easier to maintain:


```html
<analog-clock
  label="မြန်မာ"
  system="mymr"
  timezone="+6.5"
  class="burmese"
  indices
  marker="•">
</analog-clock>

<analog-clock
  label="ประเทศไทย"
  system="thai"
  timezone="+7"
  class="thai"
  indices
  marker="·"
  marker-hour="•">
</analog-clock>

<analog-clock
  label="अरुणाचल"
  system="wcho"
  timezone="+5.5"
  class="indian">
</analog-clock>
```

Let's look into that.

---

## Web Component

Wrapping the code in a `<analog-clock>` web component offers a simple way to add an analog clock to your web projects. It's  customizable through various attributes and CSS custom properties.

### Installation & Usage

Install via npm:

```bash
npm i @browser.style/analog-clock
```

Or use directly via CDN:

```html
<script src="https://browser.style/ui/analog-clock/index.js" type="module"></script>
```

Then, simply add the component to your HTML:

```html
<analog-clock></analog-clock>
```

### Basic Examples

Here are some common use cases:

```html
<!-- Simple clock for New York time -->
<analog-clock 
  label="New York" 
  timezone="-4">
</analog-clock>

<!-- Clock with date display and minute markers -->
<analog-clock 
  indices 
  date="day month" 
  label="Current Time">
</analog-clock>

<!-- Clock with custom markers and Roman numerals -->
<analog-clock 
  indices="hours"
  system="roman"
  marker="•"
  marker-hour="●"
  label="Roma">
</analog-clock>
```

### Styling Examples

The component can be styled using CSS custom properties:

```css
/* Gold luxury theme */
.luxury {
  --analog-clock-bg: radial-gradient(
    circle at 50% 50%,
    #f4e5c3 50%,
    #e2ca7d 51%,
    #5c4d28 95%
  );
  --analog-clock-c: #2a2317;
  --analog-clock-ff: "Didot", serif;
  --analog-clock-second: #8b0000;
  --analog-clock-cap: #403428;
}

/* Minimalist theme */
.minimal {
  --analog-clock-bg: #fff;
  --analog-clock-c: #333;
  --analog-clock-indices-c: #ddd;
  --analog-clock-second: #ff4444;
  --analog-clock-cap-sz: 4cqi;
}
```

### Number Systems

The `system` attribute supports various [number systems](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#numberingsystem), as we saw in the colorful examples earlier:

```html
<!-- Roman numerals -->
<analog-clock system="mymr"></analog-clock>

<!-- Thai numbers -->
<analog-clock system="thai"></analog-clock>
```

### Timezone Support

You can display different timezones using the `timezone` attribute:

```html
<analog-clock label="New York" timezone="-4"></analog-clock>
<analog-clock label="London" timezone="0"></analog-clock>
<analog-clock label="Tokyo" timezone="+9"></analog-clock>
<analog-clock label="Mumbai" timezone="+5.5"></analog-clock>
```

## Attributes

- `date`: Display date. Values: "day", "month", "year" or any combination
- `indices`: Show tick marks. Values: empty (60 marks) or "hours" (12 marks)
- `label`: Text label below the clock
- `marker`: Character used for indices (default: "|")
- `marker-hour`: Character used for hour indices (defaults to marker value)
- `numerals`: Number of numerals to display (1-12, default: 12)
- `steps`: Use stepping animation for seconds hand
- `system`: Number system. Values: "roman", "romanlow", or any valid [Intl numberingSystem](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#numberingsystem)
- `timezone`: UTC offset in hours (e.g., "-4", "+1", "+5.5")


## Demo
Here's a Codepen with all the clocks and watches, we've coded:

[Codepen Example](https://codepen.io/stoumann/pen/OPJLRLV)

Now go teach kids how to read an analog clock!