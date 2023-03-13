# Countdown

## HTML

```html
<time datetime="2023-01-01" class="bs-countdown"></time>
```

## Change `lang`-attribute for variations:

```html
<time datetime="2023-01-01" class="bs-countdown" lang="fr-FR"></time>
<time datetime="2023-01-01" class="bs-countdown" lang="zh-Hans-CN-u-nu-hanidec"></time>
<time datetime="2023-01-01" class="bs-countdown" lang="fa-IR"></time>
```

## Init

Import `countdown.js` and run it per `element` (`<time>`-tag):

```js
import countdown from './countdown.js';
countdown(element)
```
