
# Data Grid Events

`<data-grid>` emits and listens to various events to allow client interaction and custom functionality. This document describes these events and provides examples of how to use them.

## Emitting Events

### dg:append
Appends data to the end of the table.

**Usage:**
```javascript
const dataToAppend = [
    {
        firstname: "Ugo",
        lastname: "Quaisse",
        email: "ugo@quaisse.fr",
        gender: "Male",
        city: "Paris",
        country: "France"
    },
    {
        firstname: "Steven",
        lastname: "Singh",
        email: "steven@singh.dk",
        gender: "Male",
        city: "Copenhagen",
        country: "Denmark"
    }
];
grid.dispatchEvent(new CustomEvent('dg:append', { detail: dataToAppend }));
```

### dg:cellchange
Triggered when a cell has been edited.

**Usage:**
```javascript
grid.addEventListener('dg:cellchange', (event) => {
    console.log('Cell changed:', event.detail);
});
```

### dg:clearselected
Clears all selected rows.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:clearselected'));
```

### dg:pagechange
Triggered when a page has changed.

**Usage:**
```javascript
grid.addEventListener('dg:pagechange', (event) => {
    console.log('Page changed:', event.detail);
});
```

### dg:row
Returns the current/active row, triggered from `dg:getrow`.

**Usage:**
```javascript
grid.addEventListener('dg:row', (event) => {
    console.log('Current row:', event.detail);
});
```

### dg:selected
Returns an array of selected objects, triggered from `dg:getselected`.

**Usage:**
```javascript
grid.addEventListener('dg:selected', (event) => {
    console.log('Selected rows:', event.detail);
});
```

### dg:selection
Triggered when a selection occurs.

**Usage:**
```javascript
grid.addEventListener('dg:selection', (event) => {
    console.log('Selection changed:', event.detail);
});
```

## Receiving Events

### dg:getrow
Emits `dg:row`.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:getrow'));
```

### dg:getselected
Emits `dg:selected`.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:getselected'));
```

### dg:append
Append data to the table.

**Usage:**
```javascript
const dataToAppend = [
    { id: 6, name: 'New User', age: 30, email: 'newuser@example.com' }
];
grid.dispatchEvent(new CustomEvent('dg:append', { detail: dataToAppend }));
```

### dg:clearselected
Clear selected rows.

**Usage:**
```javascript
grid.dispatchEvent(new Event('dg:clearselected'));
```
