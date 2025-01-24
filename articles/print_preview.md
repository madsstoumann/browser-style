# Creating a Print Preview Web Component

I’m currently working on a large e-commerce project — an update to an app I coded back in 1994-1996! 🤯

Back then, the app was coded in VBA, connecting to a Microsoft Access database. Now — of course — it’s web-based. The differences between MS Access and a web-based solution are **huge**. One of the major challenges has been print control. In MS Access, you have _reports_ that you can fine-tune. This app requires a lot of _printed_ content, like packing slips for orders, invoices, and much more.

Many of these documents don’t appear in the interface but need to be printed nevertheless. For example, a “Print subscription packing slips” button in the UI should simply open the native print dialog with nicely formatted packing slips ready to print.

To solve this, I created a Web Component, `<print-preview>`, for print control and preview. It uses the `popover API` to keep it “detached” from the regular DOM (popover content is in the _top layer_).

## What It Does

- Previews your content exactly as it’ll print
- Fine-tune everything from paper size to fonts
- Handle images smartly (show them, hide them, or just show outlines)
- Templates for dynamic stuff like invoices
- Works in different languages (i18n)

## Getting Started

First, drop this into your HTML:

```html
<print-preview>
  <paper-sheet>
    <h1>Hello, Printer!</h1>
    <p>This will look great on paper.</p>
  </paper-sheet>
</print-preview>
```

> **Note:** The component _must_ be a direct child of `<body>`. If not, it will not mount. Also: Just **one** instance is allowed.

Each `<paper-sheet>` represents one printed page. If you want more pages, just add more `<paper-sheet>` elements.

Now, we won't see *anything* on the page yet. First, we need to load the component itself:

```html
<script type="module">
import PrintPreview from './index.js';
</script>
```

Then, show it, using the `preview()` method:

```js
const printPreview = document.querySelector('print-preview');
if (printPreview) printPreview.preview();
```

## Templates
Remember those Access reports I mentioned? For the web-based solution, we use templates instead:

```js
const invoiceTemplate = (data) => 
  data.map((obj) => {
    const subtotal = obj.products.reduce((sum, product) => 
      sum + (product.quantity * product.price), 0);
    const vat = subtotal * 0.2;
    const total = subtotal + vat;

    return `
    <paper-sheet>
      <h2>Invoice</h2>
      <p>
        ${obj.customer.first_name} ${obj.customer.last_name}<br>
        ${obj.customer.street_address}<br>
        ${obj.customer.postal_code} ${obj.customer.city}
      </p>
      <table part="table">
        <!-- Your table stuff here -->
      </table>
    </paper-sheet>
    `;
  }).join('');
```

## Making It Pretty
One thing I really missed from Access was the report designer's ease of use. Luckily, we have CSS and `::part`:

```css
print-preview {
  &::part(table) {
    border-collapse: collapse;
    margin-block-start: 4rem;
    width: 100%;
  }
  &::part(tbody) {
    break-after: avoid;
  }
  &::part(tfoot) {
    border-block-start: 1px dashed;
    border-block-end: 4px double;
    break-before: avoid;
  }
}
```

Let’s see how the preview looks like:

![Print preview](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ob1gn4bkov4bltweg59f.png)

Now, click the print button or hit Ctrl+P (or ⌘+P on Mac):

![Print Dialog](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ryaaj6e7yzqwjjcbzddk.png)

Back to the preview — we can change lots of stuff:

- Paper size (A4, Letter, whatever you need)
- Portrait or landscape
- Margins
- Fonts and sizes
- Image handling

Let’s change to A5, landscape, a different font etc.:

![Print preview after change](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xysuiuqi58piw2dg4nh7.png)

We can also control whether images should be visible, hidden, or displayed as outlines:

![Preview with image](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/o69u1gxjrp08ony3u3u4.png)

If you pick “outline”, you’ll see where the image should be, and you’ll save a lot of printer toner:

![Preview with image outline](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ywfca0r84e7uwg1gsti6.png)

---

## Setting Content
We’ve already covered templates and placing HTML directly under `<print-preview>`.

You can also use the `setContent()` method to set a string of HTML from JavaScript.

We can also _pre-configure_ the settings such as typography, margins, etc.:

```js
printPreview.addTemplate('invoice', invoiceTemplate, {
  'font-family': 'ff-transitional',
  'font-size': 'large',
  'margin-left': '15mm'
});
```

## Adding Support for Other Languages
You can easily localize the interface to meet the needs of users in different regions.

To change the interface language, configure the `i18n` object like this:

```js
customElements.whenDefined('print-preview').then(() => {
  PrintPreview.i18n = {
    es: {
      bottom: 'Abajo',
      close: 'Cerrar',
      font_family: 'Tipo de letra',
      font_size: 'Tamaño de letra',
      left: 'Izquierda',
      orientation: 'Orientación',
      orientation_landscape: 'Horizontal',
      orientation_portrait: 'Vertical',
      paper_size: 'Tamaño de papel',
      print: 'Imprimir',
      right: 'Derecha',
      top: 'Arriba'
    }
  };
  document.querySelector('print-preview').setAttribute('lang', 'es');
});
```

## Conclusion & Demo

This turned out to be a component I didn’t know I needed 😁 Maybe it’s just **this** particular project that requires such control and preview of printed content — but I _hope_ you find it useful!

There’s more to the component than I’ve covered in this article, so check out the [demo](https://browser.style/ui/print-preview/) to see it in action. It’s also on [GitHub](https://github.com/madsstoumann/browser-style/tree/main/ui/print-preview).

Also — fair warning — it took me two days to code this, assisted by Claude.ai. As I start creating more templates, there **will** be updates and bugfixes, so revisit the demo from time to time.

Happy printing! 📄✨

---

Cover image by Wendelin Jacober: https://www.pexels.com/da-dk/foto/1440504/