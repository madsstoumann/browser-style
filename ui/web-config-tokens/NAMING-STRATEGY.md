# CSS Custom Property Naming Strategy

## Current Implementation

The web component supports **two naming strategies**:

### 1. Auto-generated from Token Path (Default)
Converts the token's JSON path to kebab-case CSS variable name.

**Example:**
```json
{
  "color": {
    "raw": {
      "neutral": {
        "50": { "$value": {...} }
      }
    }
  }
}
```
Generates: `--color-raw-neutral-50`

**Pros:**
- Consistent and predictable
- No naming conflicts
- Clear hierarchy
- No additional configuration needed

**Cons:**
- Can be verbose (includes "raw", "semantic", etc.)
- Not customizable per token

### 2. Custom Names via `$extensions.cssVar` (Optional)
Allows specifying custom CSS variable names in the JSON.

**Example:**
```json
{
  "color": {
    "raw": {
      "neutral": {
        "50": {
          "$value": {...},
          "$extensions": {
            "cssVar": "--neutral-50"
          }
        }
      }
    }
  }
}
```
Generates: `--neutral-50` (custom name)

**Pros:**
- Full control over naming
- Can create shorter, cleaner names
- Can match existing CSS conventions

**Cons:**
- More verbose JSON
- Risk of naming conflicts
- Requires manual maintenance

## Recommended Strategies

### Option A: Keep Path Segments (Current Default)
```css
--color-raw-neutral-50
--color-semantic-background-canvas
--color-semantic-text-primary
```

**Best for:** Maximum clarity and avoiding conflicts

### Option B: Skip "raw" and "semantic" Layers
Modify `_generateCSSVarName()` to skip organizational layers:

```javascript
_generateCSSVarName(path, key, token) {
  if (token.$extensions?.cssVar) {
    return token.$extensions.cssVar.startsWith('--')
      ? token.$extensions.cssVar
      : `--${token.$extensions.cssVar}`;
  }

  // Skip 'raw' and 'semantic' from path
  const filteredPath = path.filter(segment =>
    !['raw', 'semantic'].includes(segment)
  );
  const fullPath = [...filteredPath, key].join('-');
  return `--${fullPath}`;
}
```

**Result:**
```css
--color-neutral-50
--color-background-canvas
--color-text-primary
```

**Best for:** Cleaner names while maintaining hierarchy

### Option C: Minimal Naming
Skip even more segments to get minimal names:

```javascript
_generateCSSVarName(path, key, token) {
  if (token.$extensions?.cssVar) {
    return token.$extensions.cssVar.startsWith('--')
      ? token.$extensions.cssVar
      : `--${token.$extensions.cssVar}`;
  }

  // Only use the last segment before the key
  const parentSegment = path[path.length - 1];
  const name = parentSegment ? `${parentSegment}-${key}` : key;
  return `--${name}`;
}
```

**Result:**
```css
--neutral-50
--canvas
--primary
```

**Best for:** Shortest names, but higher risk of conflicts

## Comparison Table

| Strategy | Raw Color | Semantic Color | Length | Conflicts | Clarity |
|----------|-----------|----------------|--------|-----------|---------|
| Full Path | `--color-raw-neutral-50` | `--color-semantic-background-canvas` | Long | None | Excellent |
| Skip Layers | `--color-neutral-50` | `--color-background-canvas` | Medium | Low | Good |
| Minimal | `--neutral-50` | `--canvas` | Short | Medium | Fair |
| Custom | `--my-grey` | `--bg-main` | Variable | Risk | Variable |

## Recommendation

**Start with Option B (Skip "raw" and "semantic")**:
- Balances clarity and brevity
- Maintains logical hierarchy
- Reduces verbosity
- Still avoids most conflicts

Then allow `$extensions.cssVar` for exceptions where you need specific names.

## Example Configuration in JSON

If you want to override the auto-generated name:

```json
{
  "color": {
    "raw": {
      "neutral": {
        "50": {
          "$value": {
            "colorSpace": "srgb",
            "components": [0.98, 0.98, 0.98],
            "alpha": 1,
            "hex": "#FAFAFA"
          },
          "$extensions": {
            "cssVar": "--neutral-50",
            "description": "Lightest neutral shade"
          }
        }
      }
    },
    "semantic": {
      "background": {
        "canvas": {
          "$value": "{color.raw.neutral.50}",
          "$extensions": {
            "cssVar": "--bg-canvas",
            "colorScheme": {
              "dark": "{color.raw.neutral.900}"
            }
          }
        }
      }
    }
  }
}
```

This gives you:
- `--neutral-50` (custom name)
- `--bg-canvas` (custom name)

Instead of:
- `--color-raw-neutral-50` (auto-generated)
- `--color-semantic-background-canvas` (auto-generated)
