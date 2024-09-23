
# Translations in DataEntry

The **DataEntry** component supports multiple languages through a simple translation system. This system allows you to translate key terms used in the interface into different languages by providing translation objects and a `t` function that resolves the translation for a given key.

## How Translations Work

The translation system consists of a key-value pair for each language, where:
- The key represents the term or phrase that needs to be translated.
- The value is the translated term in the corresponding language.

Translations are organized in an object where each language has its own dictionary of key-value pairs.

### Example of Translation Object:

```javascript
const translations = {
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
  },
  // Add more languages as needed
};
```

## The `t` Function

To fetch the appropriate translation for a given key, the `t` function is used. It takes two parameters:
1. The **key** (string) representing the term to be translated.
2. The **lang** (string) representing the language code (e.g., `en`, `da`).

If a translation for the key is available in the specified language, it will return the translated string. If no translation is found, it will return the key itself as a fallback.

### Example of the `t` Function:

```javascript
export function t(key, lang) {
  return translations[lang]?.[key] || key;
}
```

### Example Usage:

```javascript
const label = t('add', 'en');  // Returns "Add" in English
const label = t('close', 'da');  // Returns "Luk" in Danish
```

## How to Use Translations in DataEntry

Within **DataEntry**, the translation system can be used to provide localized labels for various UI elements such as buttons, form fields, and headings.

### Example in Schema:

In the schema, you can define titles using the translation system by incorporating translation keys like `${t:details}`. When the form is rendered, the key will be translated based on the selected language.

```json
{
  "type": "object",
  "properties": {
    "release_date": {
      "type": "string",
      "title": "${t:release_date}",
      "render": {
        "method": "input",
        "attributes": [
          {
            "name": "release_date"
          },
          {
            "placeholder": "Enter release date"
          }
        ]
      }
    }
  }
}
```

### Setting the Language

The language used for translations is determined by the `lang` attribute in **DataEntry**. This attribute should be set to the desired language code (e.g., `en` for English, `da` for Danish).

```html
<data-entry lang="en"></data-entry>
```

## Extending the Translations

You can easily extend the translations object by adding more languages and keys as needed. To support a new language, simply add a new dictionary to the `translations` object.

### Example of Adding a New Language:

```javascript
const translations = {
  ...,
  fr: {
    add: 'Ajouter',
    close: 'Fermer',
    details: 'Détails',
    release_date: 'Date de sortie',
    reset: 'Réinitialiser',
  }
};
```

In this example, **French** is added with the respective translations for the keys used in the application.

## Customizing the `t` Function

The `t` function is designed to be modular, which means you can move it to a different module or even make it user-configurable. If you want to centralize translations or manage them globally across your application, you can export the `t` function from a common utilities module.

## Conclusion

The translation system in **DataEntry** provides a simple and effective way to localize your form elements and UI. By leveraging the `t` function and translation objects, you can easily support multiple languages in your application.
