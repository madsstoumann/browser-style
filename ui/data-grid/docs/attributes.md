
# Attributes for `<data-grid>`

`<data-grid>` can be configured through a variety of attributes. Below is a detailed description of each attribute and how to use them.

## density
Boolean attribute. If present, adds a density button to the actions part of the bottom navigation, allowing users to toggle between a compact and expanded state.

### Example
```html
<data-grid density></data-grid>
```

## debug
Boolean attribute. If present, logs events and errors to the console for debugging purposes.

### Example
```html
<data-grid debug></data-grid>
```

## editable
Boolean attribute. If present, the grid becomes editable, but only if at least one column has `"uid": true`.

### Example
```html
<data-grid editable></data-grid>
```

## exportable
Boolean attribute. If present, adds CSV and JSON export buttons to the actions part of the bottom navigation.

### Example
```html
<data-grid exportable></data-grid>
```

## i18n
Object attribute. Defines internationalization settings for different languages. It can be set as a stringified object in the attribute.

### Example
```html
<data-grid i18n='{"en": {"all": "All", "next": "Next"}}'></data-grid>
```

## locale
String attribute. Specifies the locale to use for the grid. If not provided, it defaults to the `lang` attribute on the `<html>` element or "en".

### Example
```html
<data-grid locale="en"></data-grid>
```

## pagesize
Array of numbers attribute. Defines the options available in the "Page Size" dropdown. The value corresponding to `itemsperpage` must exist in this array.

### Example
```html
<data-grid pagesize="5,10,25,50,100"></data-grid>
```

## printable
Boolean attribute. If present, adds a print button to the actions part of the navigation and allows printing with `Ctrl + P`.

### Example
```html
<data-grid printable></data-grid>
```

## searchable
Boolean attribute. If present, adds an `<input type="search">` before the table, allowing for basic filtering.

### Example
```html
<data-grid searchable></data-grid>
```

## selectable
Boolean attribute. If present, allows selection of rows in the grid.

### Example
```html
<data-grid selectable></data-grid>
```

## src
String attribute. The URL of an endpoint API returning an object with `thead` and `tbody` data. Can also be a stringified object (JSON).

### Example
```html
<data-grid src="https://endpoint.com/"></data-grid>
```

## Additional Attributes

### itemsperpage
Numeric attribute. Indicates the number of items to display per page. If omitted, pagination is not used.

### Example
```html
<data-grid itemsperpage="20"></data-grid>
```

### searchmethod
String attribute. Determines how search/filtering is applied. The default value is "includes". Valid values are "end", "equals", "includes", and "start".

### Example
```html
<data-grid searchmethod="includes"></data-grid>
```

### searchterm
String attribute. The search term used for filtering the grid. Can be set to preload the grid with a specific search term.

### Example
```html
<data-grid searchterm="batman"></data-grid>
```

### sortindex
Numeric attribute. The index of the column used for sorting (starting from 0). Can be set to preload the grid with a specific column sorted.

### Example
```html
<data-grid sortindex="0"></data-grid>
```

### sortorder
Numeric attribute. The order for sorting: 0 for ascending and 1 for descending.

### Example
```html
<data-grid sortorder="1"></data-grid>
```

### stickycol
Boolean attribute. If present, makes the first column sticky.

### Example
```html
<data-grid stickycol></data-grid>
```

### tableclass
String attribute. Adds style classes to the internal `<table>` element. The value should be a space-delimited string of class names.

### Example
```html
<data-grid tableclass="my-table-class is-dark zebra-rows"></data-grid>
```

### lang
Standard HTML attribute. Specifies the language of the grid. If not present, the grid uses the `lang` attribute from the `<html>` tag or defaults to "en".

### Example
```html
<data-grid lang="fr"></data-grid>
```

## Combining Attributes

You can combine multiple attributes to customize the grid according to your needs.

### Example
```html
<data-grid
  itemsperpage="5"
  page="1"
  sortindex="0"
  sortorder="1"
  searchterm="batman"
  selectable
  editable
  debug>
</data-grid>
```

This example creates a grid that is selectable, editable, and preloaded with a search term "batman", sorted by the first column in descending order, and starts on the second page with 5 items per page. Debugging is enabled to log events and errors to the console.
