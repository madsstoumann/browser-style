# The Unofficial Dev.To Embed Web Component

The other day, I discovered that the dev.to API can be used _without_ an API key. That’s really great if you want to embed your articles anywhere — maybe on a personal blog — without the hassle of protecting secret keys. You can fetch a list of articles by a given author or a specific article. 

So, I coded a web component that lets you grab either a list of articles _or_ a specific one. Let’s start with the “list mode”:

```html
<dev-to
  author="madsstoumann"
  theme="classic"
  itemsperpage="10"
  links="internal">
</dev-to>
```
Here’s what we get:
![List](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lu2gxbad1swk918ymg97.png)

Notice the `theme` and `links` attributes? I’ve added 3 themes to choose from (but you can easily add your own):

- brutalist
- classic
- modern

`links` can be either “internal” or “external”. The first opens the article directly within the web component, while the latter opens the article on dev.to in a new tab.

Now, let’s click on “The Golden Ratio in CSS”.

![Classic Theme](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/itozx8nu6cerg5qapicc.png)

Very posh, classic theme, isn’t it?! 

If you just want to show the article directly, without showing the list first, you can use the component in “article mode”:

```html
<dev-to article="2014104" theme="classic"></dev-to>
```

Let’s change the theme to “modern”:

![Modern](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f9ltqhc2cbfvk35wmr7h.png)

... or how about “brutalist”, for that raw, industrial look?

![Brutalist](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/pdm3igfaypc690icc8ja.png)

## But Wait, There’s More! 🎁

### Internationalization
Want to display dates and UI text in your local language? The component supports i18n this way:

```html
<dev-to 
  author="madsstoumann"
  lang="es"
  i18n='{"es":{"more":"Más...","reactions":"reacciones"}}'>
</dev-to>
```

### Customization
The component exposes several parts that you can style using CSS `::part()`:

```css
dev-to::part(avatar) {
  border-radius: 50%;
  border: 2px solid currentColor;
}

dev-to::part(cover) {
  filter: sepia(0.3);
}

dev-to::part(more) {
  background: #ff00ff;
}
```

### Shadow DOM or Not?
If you need to style the component directly (without parts), just add the `noshadow` attribute:

```html
<dev-to author="madsstoumann" noshadow></dev-to>
```

## Installation

You can install the component directly from npm:

```bash
npm i @browser.style/dev-to
```

Or import the script directly from browser.style:

```html
<script
  type="module"
  src="https://browser.style/ui/dev-to/index.js">
</script>
```

Let me know what you think!

---

Cover Photo by Markus Spiske: https://www.pexels.com/photo/mork-computer-gron-software-225769/