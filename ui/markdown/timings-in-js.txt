The other day I needed a **digital clock**-component, so I quickly composed a simple JavaScript-method:

```js
function uiDigitalClock(node) {
  const now = () => {
    node.textContent = new Date().toLocaleTimeString()
    requestAnimationFrame(now)
  }
  now()
}
```

Somewhere I read that `requestAnimationFrame` should be better for performance than `setInterval`, but the method kept nagging me. 

Under optimal conditions, `requestAnimationFrame` will trigger **60 times per second** — which is 60 times more than the digital clock requires!

It cannot be good for performance to create a `Date()`-object 60 times per second!

So I tried with `setInterval`:

```js
function interval(node){
  return setInterval(() => node.textContent = new Date().toLocaleTimeString(), 1000)
}
```

Again, not much code, the visual result is the same — and only **one** `Date()`-object per second.

What about `setTimeout()`?

```js
function timeout(node) {
  const now = () => {
    node.textContent = new Date().toLocaleTimeString()
    setTimeout(now, 1000)
  }
  now()
}
```

It also works with a similar result, but with an _annoying_ delay (`setImmediate()` is only in Node)

I then decided to **rework** the initial version to only trigger every second, as `requestAnimationFrame()` returns a timestamp:

```js
function frame(node) {
  let last = 0;
  const render = now => {
    if (!last || now - last >= 1000) {
      last = now;
      node.textContent = new Date().toLocaleTimeString();
    }
    requestAnimationFrame(render);
  }
  window.requestAnimationFrame(render);
}
```

With all 3 methods running,  I happened to inspect the markup in Dev Tools, and noticed that I couldn't even _expand_ the nodes, because they were being refreshed constantly, and looking like the old `<blink>`-tag! 

---

## Asking Bard for help

Still not really knowing which method to pick, I decided to ask Google Bard, to which it replied:

- **clock1** uses the `setInterval()` method, which creates a recurring timer that fires every 1000 milliseconds (1 second). This is the least performant method because it creates a new timer for each iteration, which can add up to a significant amount of overhead.

- **clock2** uses the `setTimeout()` method, which creates a single timer that fires after 1000 milliseconds. This is more performant than clock1 because it does not create a new timer for each iteration. However, it is still less performant than clock3 because the browser has to wait for the timer to fire before updating the text content.

- **clock3** uses the `requestAnimationFrame()` method, which is a more efficient way to request a repaint of the browser. The browser will only repaint the element when it is necessary, which can save a significant amount of CPU time.

Fine, I decieded to go with **clock3** ... but then it hit me: "What about **number-animations in CSS**, using `@property`?

Jhey made a [Pure CSS Stopwatch](jh3y/pen/jOVmJBL) a while ago, so I decided to try something similar.

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

Then, in an `<ol>`-tag, I added a `<li>`-tag for each time-unit.

To use the value of the `@property`-declaration, you need to use a CSS counter, so for seconds it's:

```css
.seconds {
  animation: seconds 60s steps(60, end) infinite;
  animation-delay: var(--delay-seconds, 0s);
  counter-reset: seconds var(--seconds);
  &::after { content: counter(seconds, decimal-leading-zero) ' '; }
}
```

To **animate** the seconds, a keyframe is needed:

```css
@keyframes seconds { 
  from { --seconds: 0;}
  to { --seconds: 60; }
}
```

For minutes, it's almost the same, but the animation takes 60 times longer (60 x 60 = 3600):

```css
animation: minutes 3600s steps(60, end) infinite;
```

And for hours, we need to multiple that number with 24:

```css
animation: hours 86400s steps(24, end) infinite;
```

Yay! We have a working CSS Clock ... but it only works at midnight, since both hours, minutes and seconds start at `0` (zero). 

So what to do? I could easily update the properties from JavaScript, after having created an initial `Date()`-object. 

But then the animations would be wrong, as they would run for the same amount of times (60 seconds for seconds), even if the actual amount of seconds were less than that.

I asked for help on Twitter — and to my luck, Temani Afif and Álvaro Montoro replied! The solution was to use a **negative** `animation-delay`.

So, with a bit of JavaScript to set the current time and calculate the delays:

```js
const time = new Date();
const hours = time.getHours();
const minutes = time.getMinutes();
const seconds = time.getSeconds();

// Delays
const HOURS = -Math.abs((hours * 3600) + (minutes * 60) + seconds);
const MINS = -Math.abs((minutes * 60) + seconds);
const SECS = -Math.abs(seconds);
```

... we can **update** the CSS Properties specified earlier, for example:

```js
node.style.setProperty(`--delay-seconds`, `${seconds}s`);
```

Now, we have a **working digital CSS clock** — compare it with the other methods here:

{% codepen stoumann/pen/eYbJaqV %}

If you inspect the markup in Dev Tools, you'll see that the CSS-version isn't re-writing DOM-content.

---

## Countdown

After this, I decided to revisit an old Codepen of mine, a multilanguage countdown, and make a CSS-only-version:

{% codepen stoumann/pen/yLGJPZK %}

You can play around with the `locale` in the JS-code, if you want it in another language:

![CSS Countdown](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9ej09p61qtcmp21vrdub.png)

But what about performance? CSS might not be blocking the main thread like JavaScript, but can we be sure it's using the GPU instead of the CPU?

There's an old trick for that:

```css
.useGpu {
  transform: translateZ(0);
  will-change: transform;
}
```

Then, in Dev Tools, go to "Layers":
![Layers](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e89t7ldk6x8lz4ee6nnq.png)

See how the "countdown" now has it's **own** rendering-layer? Not sure if this is still applicable, but guess it doesn't hurt to add.

---

## Leaving a Browser Tab
I haven't had any issues with the CSS-only clock when I leave a browser-tab and return. Maybe I haven't been waiting long enough! But **should** you encounter any issues, recalculate the clock's delays using this event:

```js
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { ... }
})
```

---

## Analog Clock

As a bonus – here's an analog clock, I did a while ago:

{% codepen stoumann/pen/wvxOQKo %}

---

And now it's time (pun intended), to end this article!

Cover image by DALL·E.