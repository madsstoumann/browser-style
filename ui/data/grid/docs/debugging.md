# Debugging

This guide helps you troubleshoot common issues and debug DataGrid components.

## Debug Mode

### Enable Debug Mode

Add the `debug` attribute to enable console logging:

```html
<data-grid debug></data-grid>
```

Or programmatically:

```javascript
grid.setAttribute('debug', '');
```

### Console Output

Debug mode logs all major operations with color-coded messages:

| Color | Operation | Example |
|-------|-----------|---------|
| #046 | Attribute changes | `attr: itemsperpage=25` |
| #52B | Table renders | `render: table` |
| #56F | Header renders | `render: thead` |
| #584 | Body renders | `render: tbody` |
| #A0A | Custom events | `event: dg:selection` |
| #000 | General messages | `info: data loaded` |

**Example Output:**
```
attr: itemsperpage=25 (#046)
render: table (#52B)
render: thead (#56F)
render: tbody (#584)
event: dg:loaded (#A0A)
```

## Browser DevTools

### Inspect State

```javascript
// In browser console:
const grid = document.querySelector('data-grid');

// View entire state
console.log(grid.state);

// View specific properties
console.log('Columns:', grid.state.thead);
console.log('Data:', grid.state.tbody);
console.log('Selected:', grid.state.selected);
console.log('Page:', grid.state.page);
console.log('Sort:', { 
  index: grid.state.sortIndex, 
  order: grid.state.sortOrder 
});

// Convert Set to Array
console.log('Selected keys:', Array.from(grid.state.selected));
```

### Inspect Settings

```javascript
console.log('Settings:', grid.settings);
console.log('External nav:', grid.settings.externalNavigation);
console.log('Density:', grid.settings.density);
console.log('Formatters:', Object.keys(grid.formatters));
```

### Inspect DOM

```javascript
// Table elements
console.log('Table:', grid.table);
console.log('Header cells:', grid.table.tHead.rows[0].cells);
console.log('Body rows:', grid.table.tBodies[0].rows);

// Navigation form
console.log('Form:', grid.form);
console.log('Search term:', grid.form.elements.searchterm.value);
console.log('Items per page:', grid.form.elements.itemsperpage.value);

// Wrapper
console.log('Wrapper:', grid.wrapper);
```

### Monitor Events

```javascript
// Log all custom events
['dg:loaded', 'dg:selection', 'dg:cellchange', 'dg:pagechange', 
 'dg:rowclick', 'dg:itemsperpage', 'dg:removed'].forEach(name => {
  grid.addEventListener(name, (e) => {
    console.log(`Event: ${name}`, e.detail);
  });
});
```

## Common Issues

### Issue: Table Not Rendering

**Symptoms:** Empty grid, no table visible

**Possible Causes:**

1. **No data loaded**
   ```javascript
   // Check if data exists
   console.log('Has data:', grid.state.tbody?.length > 0);
   
   // Solution: Set data
   grid.data = [...];
   ```

2. **Fetch failed**
   ```javascript
   // Check network tab for failed requests
   grid.addEventListener('error', (e) => {
     console.error('Fetch error:', e);
   });
   ```

3. **Invalid data format**
   ```javascript
   // Data must be array or { thead, tbody }
   // Not: { data: [...] }
   ```

### Issue: Pagination Not Working

**Symptoms:** All rows shown, no pagination controls

**Causes:**

1. **Missing `itemsperpage` attribute**
   ```html
   <!-- ❌ No pagination -->
   <data-grid></data-grid>
   
   <!-- ✅ With pagination -->
   <data-grid itemsperpage="25"></data-grid>
   ```

2. **Value not in pagesize array**
   ```html
   <!-- ❌ 25 not in [10,50,100] -->
   <data-grid itemsperpage="25" pagesize="10,50,100"></data-grid>
   
   <!-- ✅ 25 in [10,25,50] -->
   <data-grid itemsperpage="25" pagesize="10,25,50"></data-grid>
   ```

### Issue: Selection Not Working

**Symptoms:** Checkboxes don't appear, selection fails

**Causes:**

1. **Missing `selectable` attribute**
   ```html
   <!-- ❌ Not selectable -->
   <data-grid></data-grid>
   
   <!-- ✅ Selectable -->
   <data-grid selectable></data-grid>
   ```

2. **No key fields defined**
   ```javascript
   // ❌ No key fields
   thead: [
     { field: 'name', label: 'Name' }
   ]
   
   // ✅ With key field
   thead: [
     { field: 'id', label: 'ID', key: true },
     { field: 'name', label: 'Name' }
   ]
   ```

3. **Composite key mismatch**
   ```javascript
   // Debug: Log composite keys
   grid.addEventListener('dg:selection', (e) => {
     console.log('Selected keys:', Array.from(e.detail));
   });
   ```

### Issue: Editing Not Working

**Symptoms:** Can't edit cells, contenteditable not applied

**Requirements:**

1. **`editable` attribute**
   ```html
   <data-grid editable></data-grid>
   ```

2. **At least one `uid` column**
   ```javascript
   thead: [
     { field: 'id', label: 'ID', uid: true },  // Required!
     { field: 'name', label: 'Name' }
   ]
   ```

3. **Press Enter on focused cell**
   ```javascript
   // Tab to cell, press Enter to edit
   // Or click and press Enter
   ```

### Issue: External Navigation Not Firing

**Symptoms:** `dg:requestpagechange` not dispatched

**Causes:**

1. **External navigation not enabled**
   ```javascript
   // ✅ Enable it
   grid.settings = { externalNavigation: true };
   ```

2. **Search is active**
   ```javascript
   // External nav disabled when searching
   console.log('Search term:', grid.getAttribute('searchterm'));
   // Clear search to enable external nav
   grid.setAttribute('searchterm', '');
   ```

### Issue: Formatters Not Applied

**Symptoms:** Raw values shown instead of formatted

**Causes:**

1. **Formatter not defined**
   ```javascript
   // Check if formatter exists
   console.log('Formatters:', Object.keys(grid.formatters));
   
   // Add missing formatter
   grid.formatters = {
     ...grid.formatters,
     currency: (value) => `$${value.toFixed(2)}`
   };
   ```

2. **Wrong formatter name**
   ```javascript
   // ❌ Typo
   thead: [{ field: 'price', formatter: 'currenty' }]
   
   // ✅ Correct
   thead: [{ field: 'price', formatter: 'currency' }]
   ```

3. **Formatter returns wrong type**
   ```javascript
   // ❌ Returns object
   formatter: (value) => ({ formatted: value })
   
   // ✅ Returns string
   formatter: (value) => String(value)
   ```

### Issue: Events Not Firing

**Symptoms:** Event listeners never called

**Causes:**

1. **Listener added after data loaded**
   ```javascript
   // ❌ Too late
   grid.data = [...];
   grid.addEventListener('dg:loaded', () => {
     // Never fires
   });
   
   // ✅ Add first
   grid.addEventListener('dg:loaded', () => {
     // Fires correctly
   });
   grid.data = [...];
   ```

2. **Wrong event name**
   ```javascript
   // ❌ Wrong
   grid.addEventListener('selection', ...)
   
   // ✅ Correct (dg: prefix)
   grid.addEventListener('dg:selection', ...)
   ```

3. **Event detail structure changed**
   ```javascript
   // Check event detail structure
   grid.addEventListener('dg:selection', (e) => {
     console.log('Detail type:', typeof e.detail);
     console.log('Detail:', e.detail);
   });
   ```

## Performance Debugging

### Measure Render Time

```javascript
let renderStart;

grid.addEventListener('dg:pagechange', () => {
  renderStart = performance.now();
});

// Monkey-patch renderTBody
const originalRender = grid.renderTBody;
grid.renderTBody = function(context) {
  const result = originalRender.call(this, context);
  if (renderStart) {
    const duration = performance.now() - renderStart;
    console.log(`Render took ${duration.toFixed(2)}ms`);
    renderStart = null;
  }
  return result;
};
```

### Measure Data Size

```javascript
// Calculate state size
function getStateSize(grid) {
  const json = JSON.stringify(grid.state);
  const bytes = new Blob([json]).size;
  return {
    bytes,
    kb: (bytes / 1024).toFixed(2),
    mb: (bytes / 1024 / 1024).toFixed(2)
  };
}

console.log('State size:', getStateSize(grid));
```

### Find Memory Leaks

```javascript
// Monitor selection Set size
setInterval(() => {
  console.log('Selected count:', grid.state.selected.size);
  console.log('Tbody length:', grid.state.tbody.length);
}, 5000);

// Check for orphaned popovers
setInterval(() => {
  const popovers = document.querySelectorAll('.ui-table-expand');
  if (popovers.length > 0) {
    console.warn('Orphaned popovers:', popovers.length);
  }
}, 5000);
```

## Browser Compatibility

### Check Required Features

```javascript
function checkCompatibility() {
  const checks = {
    'Custom Elements': 'customElements' in window,
    'Crypto UUID': 'randomUUID' in crypto,
    'Popover API': 'popover' in HTMLElement.prototype,
    'ResizeObserver': 'ResizeObserver' in window,
    'ES Modules': true  // If you got here, it works
  };
  
  console.table(checks);
  
  const missing = Object.entries(checks)
    .filter(([key, val]) => !val)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error('Missing features:', missing.join(', '));
    return false;
  }
  
  return true;
}

checkCompatibility();
```

### Polyfill Missing Features

```javascript
// Polyfill crypto.randomUUID
if (!crypto.randomUUID) {
  crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}
```

## Error Handling

### Catch Errors

```javascript
// Wrap in try-catch
try {
  grid.data = potentiallyBadData;
} catch (error) {
  console.error('Failed to set data:', error);
  grid.innerHTML = '<p>Failed to load data</p>';
}

// Listen for errors
grid.addEventListener('error', (event) => {
  console.error('Grid error:', event.error);
});

grid.addEventListener('dg:printerror', (event) => {
  console.error('Print error:', event.detail.error);
});
```

### Validate Data

```javascript
function validateData(data) {
  // Check format
  if (!Array.isArray(data) && !data.thead) {
    throw new Error('Data must be array or {thead, tbody}');
  }
  
  // Check if array
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.warn('Empty data array');
      return true;
    }
    
    // Check first row
    const first = data[0];
    if (typeof first !== 'object') {
      throw new Error('Data rows must be objects');
    }
    
    // Check consistency
    const keys = Object.keys(first);
    data.forEach((row, index) => {
      const rowKeys = Object.keys(row);
      if (rowKeys.length !== keys.length) {
        console.warn(`Row ${index} has different number of properties`);
      }
    });
  }
  
  // Check thead/tbody format
  if (data.thead) {
    if (!Array.isArray(data.thead)) {
      throw new Error('thead must be array');
    }
    if (!Array.isArray(data.tbody)) {
      throw new Error('tbody must be array');
    }
    
    // Validate thead fields
    data.thead.forEach((col, index) => {
      if (!col.field) {
        throw new Error(`Column ${index} missing field property`);
      }
      if (!col.label) {
        console.warn(`Column ${index} missing label property`);
      }
    });
  }
  
  return true;
}

// Use before setting data
if (validateData(myData)) {
  grid.data = myData;
}
```

## Debugging Checklist

Use this checklist to diagnose issues:

- [ ] Debug mode enabled (`debug` attribute)
- [ ] Browser console open and checked
- [ ] Required attributes present (`itemsperpage`, `selectable`, etc.)
- [ ] Data format valid (array or {thead, tbody})
- [ ] Event listeners added before data loaded
- [ ] No JavaScript errors in console
- [ ] Browser compatibility checked
- [ ] Network requests successful (check Network tab)
- [ ] CSS loaded correctly
- [ ] Peer dependencies installed

## Getting Help

### Create Minimal Reproduction

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@browser.style/data-grid/index.css">
</head>
<body>
  <data-grid id="grid" debug itemsperpage="10"></data-grid>
  
  <script type="module">
    import 'https://cdn.jsdelivr.net/npm/@browser.style/data-grid/index.js';
    
    const grid = document.getElementById('grid');
    
    // Your code that demonstrates the issue
    grid.data = [
      { id: 1, name: 'Test' }
    ];
  </script>
</body>
</html>
```

### Report Issues

Include in your report:

1. **Browser and version:** Chrome 120, Safari 17, etc.
2. **DataGrid version:** Check `package.json` or npm
3. **Minimal reproduction:** CodePen, JSFiddle, or HTML file
4. **Console output:** Copy debug messages and errors
5. **Expected behavior:** What should happen
6. **Actual behavior:** What actually happens

## Next Steps

- [Architecture](architecture.md) - Understanding component internals
- [Browser Support](browser-support.md) - Compatibility and requirements
- [Browser Support](browser-support.md) - Compatibility details
