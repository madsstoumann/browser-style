
# Translations

DataEntry supports flexible and dynamic translations through the use of an `i18n` attribute or setter method. This enables developers to control translations from an endpoint or directly via JavaScript, offering a more dynamic way to handle internationalization in form rendering.

## Setting Up Translations

### Using the `i18n` Attribute

You can specify an endpoint for translations using the `i18n` attribute on the `<data-entry>` component. This attribute points to an API or JSON file containing translation keys and values for different languages.

Example:
```html
<data-entry
    data="your.api/product"
    schema="your.api/schema"
    i18n="your.api/i18n"
    lang="en">
</data-entry>
```

In the above example, the `i18n` attribute fetches a JSON file containing translation mappings. The `lang` attribute is used to specify the current language, which can be switched dynamically.

### Setting Translations Programmatically

If you prefer to set translations directly via JavaScript, you can use the `i18n` setter. This allows you to manually load and set translations for the `DataEntry` component.

```javascript
const myDataEntry = document.querySelector('data-entry');
myDataEntry.i18n = {
  en: {
    add: 'Add',
    close: 'Close',
    details: 'Details',
    release_date: 'Release Date',
    reset: 'Reset',
  },
  da: {
    add: 'Tilføj',
    close: 'Luk',
    details: 'Detaljer',
    release_date: 'Udgivelsesdato',
      reset: 'Nulstil',
  }
};
```

### Dynamically Loaded Translations

When the `i18n` attribute is used, translations are dynamically loaded from the specified endpoint. The translations object can then be accessed via the `this.instance.i18n` object after the `loadResources` method completes.

```javascript
class DataEntry extends HTMLElement {
  async connectedCallback() {
    // Load resources including translations
    await this.loadResources();

    // Set the instance i18n after loading the resources
    this.instance.i18n = this.i18n || {};

    // Now translations are available
    console.log(this.instance.i18n);
  }
}
```

## Translation Method (`t` function)

The `t` function is used internally to translate keys in the form schema or other parts of the UI. It looks up the key in the `i18n` object based on the current language.

```javascript
export function t(key, lang, i18n) {
    return i18n[lang]?.[key] || key;
}
```

If a translation key starts with `${t:}`, the system knows it refers to a translatable string, and the key will be replaced by the corresponding translation in the specified language.

Example usage in a schema:
```json
{
  "title": "${t:details}",
  "properties": {
    "release_date": {
      "type": "string",
      "title": "${t:release_date}"
    }
  }
}
```

## Setting the Language

The language for translations is set using the `lang` attribute or via the `this.instance.lang` property. This determines which language from the `i18n` object is used for translations.

```html
<data-entry lang="en" i18n="your.api/i18n.json"></data-entry>
```

You can also change the language dynamically in JavaScript:

```javascript
myDataEntry.lang = 'da';
```

This will instantly switch the UI to Danish if the relevant translations are available in the `i18n` object.
