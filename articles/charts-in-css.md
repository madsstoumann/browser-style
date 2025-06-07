Charts have been done in CSS many times before — there's even a [dedicated project](https://chartscss.org/). So why this post? Because CSS evolves all the time — new, cool techniques emerge, allowing us to do things _simpler_, or add even more complicated new features. 

Let's dive in!

## Markup

Like the *CSS Charts*-project, we'll use a `<table>` for our charts. It's accessible, simple and readable:

```html
<table>
  <caption>Monthly Sales Figures ($)</caption>
  <tbody>
    <tr>
      <th scope="row">January</th>
      <td data-value="28500" data-pv="28500" data-av="0">$28,500</td>
    </tr>
    <tr>
      <th scope="row">February</th>
      <td data-value="22300">$22,300</td>
    </tr>
    <tr>
      <th scope="row">March</th>
      <td data-value="30100">$30,100</td>
    </tr>
<!-- etc. -->
  </tbody>
</table>
```

Notice the `data-value`-attribute? We'll grab that with the new, typed `attr()` in CSS:

```css
--_v: attr(data-value type(<number>), 0);
```

Before we continue, let's wrap the `<table>` in a custom element, allowing us to add a few custom attributes, as well as functioning as a **container**, we can use to make **responsive charts** (more on that later!):

```html
<data-chart
  aria-label="Annual Revenue Growth"
  max="50000"
  min="0"
  role="figure">
  <table> ... </table>
</data-chart>
```

We'll grab the `min` and `max` attributes with `attr()` as well, setting fallbacks to `0` and `100`:

```css
  --_min: attr(min type(<number>), 0);
  --_max: attr(max type(<number>), 100);
```

Next, we'll add a simple grid to the `<table>`, setting fixed heights for the caption and the label-area, and `1fr` for the chart itself:

![Simple Grid](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vkgqe5uqg7r4z1mhfp24.png)

### A bit of math

The first chart we'll build is a _Column Chart_. For that, we need to calculate the height of each column: 

```css
td {
  height: calc(
  ((var(--_v) - var(--_min)) / 
  (var(--_max) - var(--_min))) 
  * 100cqb - var(--data-chart-label-h)
  );
}
```

**So what's going on?** We calculate the height based on `min` and `max` and the current value, then multiply by `100cqb`, which is the height of the "container" — finally, we deduct the height of the labels.

We'll skip the logic for colors (see final demo) — let's just add the `<tbody>`-part and see what we have so far:

![Table Data Added](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e4yav57lov3wpy2ga5c2.png)

Cool! Now, let's add some grid lines and numeric labels along the y-axis. Because it's a `<table>`, we can't just add any tag. Since we're not using `<thead>`, let's use that:

```html
<thead aria-hidden="true">
  <tr>
    <th colspan="2">50000</th>
  </tr>
  <tr>
    <th colspan="2"></th>
  </tr>
  <tr>
    <th colspan="2">40000</th>
  </tr>
  <!-- etc. -->
</thead>
```

We need `aria-hidden`, so it's not picked up by screen readers. 

This is styled like this:

![Thead Added](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f1m9y3wnj967ldexdpe5.png)

Let's see how `<thead>` and `<tbody>` look together without Dev Tool's grid inspector:


![Final Column Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i37jo6h68w88beu1lkzm.png)

Nice! Now, how about we create some variants?

## Variants

The variants will use the **exact same markup**, but because of some limitations, we have to add a few extra attributes (for now).

### Area Chart

For an _Area Chart_, we can re-use most of the _Column Chart_; we just need the value of the _previous_ element for each table cell. Unfortunately, we can't grab the previous value with:

```css
:nth-of-type(calc(sibling-index() - 1))
```

We _could_ create a bunch of `:has(tr:nth-of-type(x)`-selectors to grab the value of the previous cell, but that would make the code a bit messy.

So — for now — we set the *previous value* on each `<td>` as `data-prev`:

```html
<tr>
  <th scope="row">January</th>
  <td data-value="28500" data-prev="28500">$28,500</td>
</tr>
```

Next, we create a simple polygon `clip-path` that creates a diagonal line from the *previous value* to the *current value*:

```css
clip-path: polygon(-1% 100%,
  -1% calc(var(--_py) * 100%),
  101% calc(var(--_y) * 100%),
  101% 100%);
```

Let's not dive too deep into this, it's simply y-coordinates, calculated from _value_ and _previous value_.

![Area Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/688m1hyfnvwfsfmcm8jn.png)

OK, this is one of the cases where a single color looks better. Let's update `--data-chart-bar-bg`:

![Area Chart Single Color](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bbvl7vkcghfvzz9jb6ar.png)

### Line Chart
A line chart is *almost* the same as an area chart. We simply need to cut off the bottom part as well. That distance is the height of the line, which we define in `--line-chart-line-h`:

```css
clip-path: polygon(-1% calc(var(--_py) * 100% + var(--line-chart-line-h) / 2),
  -1% calc(var(--_py) * 100% - var(--line-chart-line-h) / 2),
  101% calc(var(--_y) * 100% - var(--line-chart-line-h) / 2),
  101% calc(var(--_y) * 100% + var(--line-chart-line-h) / 2));
```

Now we get:

![Line Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s8bjd77wm79abjt3xalc.png)

### Bar Chart

The _Bar Chart_ does not need the `data-prev`-attribute, but it **does** require a few style-changes. Let's not dive deep into these changes — instead, inspect the styles in the final demo.

![Bar Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xkxlbwlunfobvhm8fes3.png)

### Pie Chart

The _Pie Chart_ is a bit different! Here, we need to use `conic-gradient`s, where each gradient needs to start where the previous one ends. Thus, we need an accumulated value (`--_av`) and a **total** of all values (`--_t`):

```css
tbody {
  --_t: attr(data-t type(<number>), 0);
}
td {
  --_av: attr(data-av type(<number>), 0);
  --_start: calc(
    (var(--_av) / var(--_t)) * 
    360deg
  );
  --_end: calc(
    (var(--_v) / var(--_t)) * 
    360deg
  );

  background: conic-gradient(
    from var(--_start),
    var(--_bg) 0 var(--_end),
    #0000 var(--_end) 
    calc(var(--_start) + 360deg)
  );
}
```

This gives us:

![Pie Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/e0uzzlkrz9ywt5x3cbuh.png)

I'd _really_ like it if we could use CSS counters to do the accumulated value and total, but couldn't get it to work (maybe someone like Temani Afif can!?).

### Donut Chart
A donut chart is the same as a pie chart, but with a "cut out", for which we use a simple CSS Mask:

```css
tbody {
  mask: radial-gradient(circle, #0000 40%, #000 40%);
}
```

... and voilà, we get:

![Donut Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lqby1h4ry058pl24ij6v.png)

## Grouped Charts

Grouped charts are simply done with multiple cells per table row:

```html
<tr>
  <th scope="row">January</th>
  <td data-value="12500">12500</td>
  <td data-value="9800">9800</td>
  <td data-value="6200">6200</td>
</tr>
```

In the styles we then group them — and in some cases, present them like individual "layers". Inspect the styles in the final demo for more details — here's how they look:

### Grouped Column Chart
![Multi Column Column Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qw00zc5ebk80gq97hin9.png)

### Grouped Area Chart

![Multi Column Area Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qfxn6atnodd2bmljtoi8.png)

### Grouped Line Chart

![Multi Column Line Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k483o3cy4h4930gmnxwa.png)

### Grouped Bar Chart

![Multi Column Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ai35awf9npymgmiqj3oj.png)

### Grouped Donut Chart

![Multi Column Donut Chart](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wgkayu68vicnzftexsle.png)

---

## Responsive Charts

One cool thing about controlling charts in CSS, is how easily we can make them responsive. First, let's add two new attributes to our `<data-chart>`-component:

```html
<data-chart
  items-sm="7"
  items-xs="4"
>
```

These indicate how many columns we want to show per breakpoint, in this case "sm" (small) and "xs" (x-small). Add as many as you want, and control the breakpoint in a `@container`-query:

```css
@container (max-width: 400px) {
  &:is([type="area"], [type="column"], [type="line"]) {
    &[items-xs="1"] tbody tr:nth-of-type(n+2),
    &[items-xs="2"] tbody tr:nth-of-type(n+3) {
      display: none;
    }
  }
}
```

So — in this case — if `items-sm="1"`, hide all items after `n+2` etc. Not rocket science, and hopefully something we can make more beautiful in the future.

Let's resize the screen and check it out. First, "sm":

![Small](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/iccwvjp081sff6ke5yxn.png)

Next, "xs":

![XS](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gj496rrtmii4fsv6y53i.png)

---

## Demo
I've created a single demo, where you can use a dropdown to choose between all the chart types. This — of course — requires JavaScript, but the charts themselves do not.

