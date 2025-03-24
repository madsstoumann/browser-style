In my previous post, I looked into [clocks and watches](https://dev.to/madsstoumann/clocks-and-watches-in-css-36mm), mimicking classic, analog watches. Now, how about _digital_ watches in CSS? The JavaScript initialization is identical, but that’s where the similarities stop.

Let’s look into how we can animate numbers, automatically switch between “am” and “pm” for 12-hour clocks — and much, much more, using only CSS!

## Initial
First, we’ll create a web component to keep all logic wrapped up in a single instance. Feel free to simplify it later!

```html
<digital-clock timezone="+1"></digital-clock>
```
The inner, shadow-structure is like this:

```html
<span part="label"></span>
<span part="date"></span>
<ol part="time">
  <li part="hours"></li>
  <li part="minutes"></li>
  <li part="seconds"></li>
  <li part="ampm"></li>
</ol>
```

In the web component, we’ll later add logic _not_ to render specific elements.

For now, let’s focus on the CSS. First, we set 3 custom properties, set with `@property`, allowing us to animate them:

```css
@property --seconds {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}
@property --minutes {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}
@property --hours {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}
```

Next, we calculate — in JavaScript, from the current time and timezone — animation delays for these:

```js
#updateClock() {
  const time = new Date();
  const tzOffset = this.#roundTzOffset(this.getAttribute('timezone') || '0');
  const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
  const tzTime = new Date(utc + (3600000 * tzOffset));

  const hours = tzTime.getHours() * 3600;
  const minutes = tzTime.getMinutes() * 60;
  const seconds = tzTime.getSeconds();

  this.style.setProperty('--delay-hours', `-${hours + minutes + seconds}s`);
  this.style.setProperty('--delay-minutes', `-${minutes + seconds}s`);
  this.style.setProperty('--delay-seconds', `-${seconds}s`);
  this.style.setProperty('--number-system', this.getAttribute('number-system') || 'decimal-leading-zero');
}
```

The animations are simple enough — we go from 0 to 24 hours, and 0 to 60 minutes (and seconds):

```css
@keyframes hours {
  from { --hours: 0; }
  to { --hours: 24; } 
}
@keyframes minutes { 
  from { --minutes: 0; }
  to { --minutes: 60; } 
}
@keyframes seconds { 
  from { --seconds: 0;}
  to { --seconds: 60; }
}
```

## Animating numbers
And now for the tricky part! To animate numbers we’re going to use CSS **counters.** For `hours`, `minutes` and `seconds` we create a custom counter, and then _re-set_ them with the values we get from the keyframe animations.

For seconds, that’s:

```css
:host::part(seconds) {
  animation: seconds 60s steps(60, end) infinite;
  animation-delay: var(--delay-seconds, 0s);
  counter-reset: seconds var(--seconds);
}
```

So what’s going on here? Let’s break it down:

1. The keyframe animation increments the `--seconds` custom property from 0 to 60 over exactly 60 seconds
2. The `steps(60, end)` timing function creates 60 discrete jumps (one per second) rather than a smooth transition
3. Each time `--seconds` changes, the `counter-reset` property immediately updates the CSS counter named "seconds"
4. The counter is displayed using a pseudo-element:

```css
:host::part(seconds)::after {
  content: counter(seconds, var(--number-system, decimal-leading-zero)) ' ';
}
```

The `animation-delay` with a negative value (calculated in JavaScript) synchronizes the animation with the current time, so when the animation shows “42”, it matches the actual 42nd second of the current minute.

This approach ensures the clock runs entirely through the browser’s animation engine with no further JavaScript needed. This eliminates timing drift that can occur with `setInterval()` or `setTimeout()` and requires no ongoing DOM manipulation.

The same principle applies to minutes and hours, each with appropriate durations and step counts. For hours, the animation runs for 24 hours (86,400 seconds) with 24 steps; for minutes, it’s 60 minutes (3,600 seconds) with 60 steps.

The `counter()` method’s second parameter defines the [list-style-type](https://developer.mozilla.org/en-US/docs/Web/CSS/list-style-type) or “number system” used to display the values. We default to `decimal-leading-zero`, but this can be customized through the `number-system` 
attribute.

## 12-hour clocks: am and pm
To display time in 12-hour-format, we can use a few CSS tricks! To tell the clock we want 12-hour-format, we add the string “12hour” to the `time`-attribute of the web component. 

Next, we use the existing `hours` counter for the `counter-reset`, as we only want to update this when the hour change.

To convert 24-hour time to 12-hour format, we use modulus. Modern CSS makes this easy with the `mod()` function:

```css
:host([time*="12hour"])::part(hours) {
  counter-reset: hours calc(mod(var(--hours) - 1, 12) + 1);
}
```

1. We subtract 1 from the hour (shifting 1-24 to 0-23)
2. Apply modulo 12 (giving us 0-11)
3. Add 1 back (giving us 1-12)

This ensures that 0 becomes 12, 13 becomes 1, 23 becomes 11, etc.

To show ”am” or ”pm” after the time, we create a custom counter:

```css
@counter-style am-pm {
  system: cyclic;
  symbols: "am" "am" "am" "am" "am" "am" "am" "am" "am" "am" "am" "pm" 
           "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "pm" "am";
}
```

The `cyclic` system cycles through these values as hours increment, ensuring the correct am/pm indicator is shown for each hour of the day. Note that the 12th string is `pm` and 24th is `am`, so 12 (noon) becomes `12pm` and 12 (midnight) becomes `12am`.

To show it:

```css
:host::part(ampm)::after {
  content: counter(hours, am-pm);
}
```

## Using the DigitalClock Web Component
Wrapping the code in a `<digital-clock>` web component offers a simple way to add a digital clock to your web projects. It’s customizable through various attributes and CSS custom properties.

### Installation & Usage
Install via npm:

```bash
npm i @browser.style/digital-clock
```

Or use directly via CDN:

```html
<script src="https://browser.style/ui/digital-clock/index.js" type="module"></script>
```

Then, simply add the component to your HTML — here, a basic clock with UTC time:

```html
<digital-clock></digital-clock>
```

The DigitalClock component offers several attributes for customization:

### Available Attributes

1. **timezone**: Sets the timezone offset (e.g., "+1", "-4")
2. **label**: Adds a text label before the clock (e.g., "Berlin,")
3. **date**: Shows the date in different formats: "full", "short", or "narrow"
4. **lang**: Sets the language for date formatting (e.g., "en-US", "ja-JP")
5. **time**: Configures time display format, options include "12hour" and "short" (no seconds)
6. **number-system**: Changes number display format (e.g., "decimal-leading-zero", "arabic-indic", "hiragana")

### Usage Examples

Clock with timezone, label and full date:
```html
<digital-clock
  label="Berlin"
  lang="de"
  date="full"
  timezone="+1">
</digital-clock>
```

![Berlin](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m6480dlgi7mt6r5k72sa.png)

12-hour format with short time (no seconds):
```html
<digital-clock
  label="New York"
  lang="en-US"
  date="short"
  timezone="-4"
  time="12hour short">
</digital-clock>
```

![New York](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5a7fks10ki6gykotm6os.png)

## Different number systems

Now the cool thing about CSS list-types are the _many_ different number systems that just work out-of-the-box.

Let's add some color and create some cool examples:

```html
<digital-clock
  label="東京"
  lang="ja-JP"
  number-system="hiragana"
  timezone="+9">
</digital-clock>
```

![Hiragana](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/c4cqrkzlsnee6dqf4z04.png)


```html
<digital-clock
  label="الرياض"
  lang="ar-SA"
  date="full"
  number-system="arabic-indic"
  timezone="+3">
</digital-clock>
```

![Arabic](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n5bisnjrv6mzhnparf9i.png)

Or how about a clock with roman numerals?

```html
<digital-clock
  label="Roma"
  number-system="upper-roman" 
  timezone="+2">
</digital-clock>
```

![Roman](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nnn7nxmjfe0q8a1no4c1.png)

### Styling

The component exposes several CSS custom properties for styling — I might add more later (let me know if you need more control):

- `--digital-clock-bg`: Background color
- `--digital-clock-bdrs`: Border radius
- `--digital-clock-gap`: Gap between elements
- `--digital-clock-p`: Padding
- `--digital-clock-fs`: Font size
- `--digital-clock-fw`: Font weight
- `--digital-clock-date-ff/fs/fw`: Font properties for the date
- `--digital-clock-label-ff/fs/fw`: Font properties for the label

All the parts (pun intended) of the clock have `::part`s, so you can easily style the shadow parts from outside:

```css
.hiragana {
  background: #080808;
  color: #ff1a1a;
  font-family: ui-sans-serif, system-ui;
  width: 300px;
  &::part(time) { 
    text-shadow: 0 0 5px rgba(255, 26, 26, 0.7);
  }
}
```

## Demo
Here’s a CodePen with all the clocks we've been making (and a few extra!):

{% codepen https://codepen.io/stoumann/pen/ByaxmOv %}