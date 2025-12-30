# Attributes for `<data-grid>`

`<data-grid>` can be configured through a variety of attributes. Below is a detailed description of each attribute and how to use them.

## data
String attribute. The URL to fetch data from, or a JSON string containing the data object with `thead` and `tbody` properties.

### Example
```html
<data-grid data="/api/data"></data-grid>
<data-grid data='{"thead": [...], "tbody": [...]}'></data-grid>
```

## debug
Boolean attribute. If present, logs events and errors to the console for debugging purposes.

### Example
```html
<data-grid debug></data-grid>
```

## density
String attribute. Controls the row density/spacing. Valid values are 'small', 'medium', or 'large'. Default is 'medium'.

### Example
```html
<data-grid density="small"></data-grid>
```

## export-csv
Boolean attribute. If present, adds a CSV export button to the actions part of the bottom navigation.

### Example
```html
<data-grid export-csv></data-grid>
```

## export-json
Boolean attribute. If present, adds a JSON export button to the actions part of the bottom navigation.

### Example
```html
<data-grid export-json></data-grid>
```

## external-navigation
Boolean attribute. If present, enables external pagination mode where page changes dispatch events instead of being handled internally.

### Example
```html
<data-grid external-navigation></data-grid>
```

## i18n
String or object attribute. URL to fetch internationalization translations, or a stringified JSON object with translation keys for different languages.

### Example
```html
<data-grid i18n="/api/i18n"></data-grid>
<data-grid i18n='{"en": {"all": "All", "next": "Next"}}'></data-grid>
```

## itemsperpage
Numeric attribute. Indicates the number of items to display per page. If omitted, pagination is not used. Default is 10.

### Example
```html
<data-grid itemsperpage="20"></data-grid>
```

## lang
Standard HTML attribute. Specifies the language of the grid. If not present, the grid uses the `lang` attribute from the `<html>` tag or defaults to "en".

### Example
```html
<data-grid lang="fr"></data-grid>
```

## layoutfixed
Boolean attribute. If present, applies fixed table layout for consistent column widths.

### Example
```html
<data-grid layoutfixed></data-grid>
```

## noform
Boolean attribute. If present, hides form controls.

### Example
```html
<data-grid noform></data-grid>
```

## nonav
Boolean attribute. If present, hides the navigation controls.

### Example
```html
<data-grid nonav></data-grid>
```

## nopage
Boolean attribute. If present, disables pagination.

### Example
```html
<data-grid nopage></data-grid>
```

## norows
Boolean attribute. If present, hides the rows per page selector.

### Example
```html
<data-grid norows></data-grid>
```

## nosortable
Boolean attribute. If present, disables column sorting.

### Example
```html
<data-grid nosortable></data-grid>
```

## page
Numeric attribute. The initial page number to display (zero-based).

### Example
```html
<data-grid page="2"></data-grid>
```

## pagesize
Array of numbers attribute. Comma-separated list defining the options available in the "Page Size" dropdown. Default is "5,10,25,50,100".

### Example
```html
<data-grid pagesize="5,10,25,50,100"></data-grid>
```

## printable
Boolean attribute. If present, adds a print button to the actions part of the navigation and enables printing with `Ctrl/Cmd + P`.

### Example
```html
<data-grid printable></data-grid>
```

## schema
String attribute. URL to fetch a JSON schema for the data structure.

### Example
```html
<data-grid schema="/api/schema"></data-grid>
```

## searchable
Boolean attribute. If present, adds an `<input type="search">` before the table, allowing for basic filtering.

### Example
```html
<data-grid searchable></data-grid>
```

## searchmethod
String attribute. Determines how search/filtering is applied. Valid values are "start" (starts with), "end" (ends with), "equals", and "includes" (default).

### Example
```html
<data-grid searchmethod="start"></data-grid>
```

## searchterm
String attribute. The search term used for filtering the grid. Can be set to preload the grid with a specific search term.

### Example
```html
<data-grid searchterm="batman"></data-grid>
```

## selectable
Boolean attribute. If present, allows selection of rows in the grid.

### Example
```html
<data-grid selectable></data-grid>
```

## sortindex
Numeric attribute. The index of the column used for sorting (starting from 0). Can be set to preload the grid with a specific column sorted.

### Example
```html
<data-grid sortindex="0"></data-grid>
```

## sortorder
Numeric attribute. The order for sorting: 0 for ascending and 1 for descending.

### Example
```html
<data-grid sortorder="1"></data-grid>
```

## src
String attribute. Alternative to `data` attribute. The URL of an endpoint API returning an object with `thead` and `tbody` data. Can also be a stringified object (JSON).

### Example
```html
<data-grid src="https://endpoint.com/"></data-grid>
```

## stickycols
String attribute. Comma-separated list of column indices that should remain sticky during horizontal scrolling.

### Example
```html
<data-grid stickycols="0,1"></data-grid>
```

## tableclasses
String attribute. Space-separated CSS class names to apply to the internal `<table>` element. Default is "ui-table --th-light --hover-all".

### Example
```html
<data-grid tableclasses="ui-table --th-light --hover-all"></data-grid>
```

## textoptions
Boolean attribute. If present, shows text wrap and layout toggle options.

### Example
```html
<data-grid textoptions></data-grid>
```

## textwrap
String or Boolean attribute. Controls text wrapping behavior in cells. Default is true.

### Example
```html
<data-grid textwrap="true"></data-grid>
```

## wrapperclasses
String attribute. Comma-separated CSS class names to apply to the wrapper element. Default is "ui-table-wrapper".

### Example
```html
<data-grid wrapperclasses="ui-table-wrapper,custom-wrapper"></data-grid>
```

## Combining Attributes

You can combine multiple attributes to customize the grid according to your needs.

### Example
```html
<data-grid
  data="/api/data"
  itemsperpage="10"
  page="0"
  sortindex="0"
  sortorder="1"
  searchterm="batman"
  selectable
  printable
  searchable
  debug>
</data-grid>
```

This example creates a grid that is selectable, printable, and searchable, preloaded with a search term "batman", sorted by the first column in descending order, and starts on the first page with 10 items per page. Debugging is enabled to log events and errors to the console.
