# Table Component

A collection of modifier-classes to enhance the appearance of tables, using native HTML table elements.

## Installation

```bash
npm install @browser.style/table
```

For required dependencies and basic setup, see the [main documentation](../readme.md).

## Usage

Import the component CSS:

```html
<link rel="stylesheet" href="node_modules/@browser.style/table/index.css">
```

Or in your CSS:
```css
@import '@browser.style/table';
```

## Basic Example

```html
<table class="ui-table">
  <thead>
    <tr><th>Header 1</th><th>Header 2</th></tr>
  </thead>
  <tbody>
    <tr><td>Data 1</td><td>Data 2</td></tr>
    <tr><td>Data 3</td><td>Data 4</td></tr>
  </tbody>
</table>
```

## Modifiers

Add these classes to customize the table appearance:

- `--block-border`: Adds bottom borders only
- `--hover-all`: Enables all hover effects
- `--hover-col`: Column hover effect
- `--hover-td`: Cell hover effect
- `--hover-tr`: Row hover effect
- `--no-border`: Removes all borders
- `--rounded`: Adds rounded corners
- `--split-cols`: Adds space between columns
- `--split-rows`: Adds space between rows
- `--th-dark`: Dark header style
- `--th-light`: Light header style
- `--zebracol-even`: Zebra striping on even columns
- `--zebracol-odd`: Zebra striping on odd columns
- `--zebrarow-even`: Zebra striping on even rows
- `--zebrarow-odd`: Zebra striping on odd rows