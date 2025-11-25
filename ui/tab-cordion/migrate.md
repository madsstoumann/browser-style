# Tab-Cordion Migration Plan

## Current State Analysis

### File Structure
Currently, the tab-cordion component consists of a single monolithic CSS file (`index.css`, ~658 lines) that handles:
- Custom properties and theming
- Base component styles
- Accordion variants (`from` attribute tokens)
- Tab variants (`to` attribute tokens)
- Hover states
- State transitions
- Browser-specific fixes

### Current Token Implementation

#### Accordion Mode (`from` attribute)
```css
:scope:where([from~="background"]) { ... }
:scope:where([from~="breakout"]) { ... }
:scope:where([from~="elevated"]) { ... }    /* sub-variant of breakout */
:scope:where([from~="separate"]) { ... }
:scope:where([from~="contain"]) { ... }
:scope:where([from~="divided"]) { ... }
:scope:where([from~="rounded"]) { ... }     /* context-dependent */
```

#### Tab Mode (`to` attribute)
```css
&[to~="background"] { ... }
&[to~="compact"] { ... }
&[to~="highlight"] { ... }
&[to~="line"] { ... }
&[to~="noicons"] { ... }
&[to~="panel-bg"] { ... }
&[to~="rounded"] { ... }                    /* context-dependent */
&[to~="shadow"] { ... }
&[to~="contain"] { ... }
```

#### Hover States
```css
:scope[from-hover~="bg"] { ... }
:scope[from-hover~="accent"] { ... }
:scope[to-hover~="bg"] { ... }
:scope[to-hover~="accent"] { ... }
:scope[to-hover~="line"] { ... }
```

---

## Migration Challenges

### 1. Context-Dependent `rounded` Token

**Current Behavior:**
```html
<!-- Accordion: rounds container and items -->
<tab-cordion from="rounded">

<!-- Tabs: rounds tabs, panel, and indicator -->
<tab-cordion to="rounded">

<!-- Combined with other tokens, behavior changes -->
<tab-cordion from="rounded separate">  <!-- rounds individual items -->
<tab-cordion from="rounded breakout">  <!-- dynamic rounding based on open state -->
```

**Proposed New Structure:**
```html
<!-- Explicit control over each rounded element -->
<tab-cordion from="cnt-rounded itm-rounded">
<tab-cordion to="tab-rounded pnl-rounded ind-rounded">
```

**Migration Path:**
- Add support for new granular tokens (cnt-rounded, itm-rounded, etc.)
- Keep `rounded` as an alias that expands to multiple tokens based on context
- Provide deprecation warnings
- Eventually remove the context-dependent behavior

### 2. Nested Variant Dependencies

Some tokens only work in combination:
- `elevated` requires `breakout` to function
- `rounded` behavior changes when combined with `separate` or `breakout`

**Solution:** Document these relationships clearly and potentially add validation/warnings.

### 3. Attribute Naming Consistency

**Current:**
- `from` attribute for accordion mode
- `to` attribute for tab mode
- `from-hover` and `to-hover` for hover states

**Proposed:**
- Keep `from` and `to` for backward compatibility
- Hover tokens move into the main attributes: `from="cnt-bg hvr-bg"`, `to="tab-bg hvr-line"`
- Deprecate separate `from-hover` and `to-hover` attributes

---

## Proposed File Structure

### Option A: Split by Mode (Recommended)

```
ui/tab-cordion/
├── index.css                    # Main entry point + base styles
├── _properties.css              # Custom properties and theming
├── _base.css                    # Core layout & element styles
├── _accordion.css               # All `from` attribute variants
├── _tabs.css                    # All `to` attribute variants
├── _transitions.css             # State transitions and animations
└── _fixes.css                   # Browser-specific workarounds
```

**Rationale:**
- Clean separation between accordion and tab modes
- Easy to understand which file controls which behavior
- Transitions isolated for performance tuning
- Browser fixes clearly separated

### Option B: Split by Component Part

```
ui/tab-cordion/
├── index.css                    # Main entry point
├── _properties.css              # Custom properties
├── _container.css               # cnt-* tokens (background, border, rounded)
├── _items.css                   # itm-* tokens (divided, separate, elevated, breakout, rounded)
├── _tabs.css                    # tab-* tokens (bg, compact, rounded, noicons)
├── _panels.css                  # pnl-* tokens (bg, shadow, rounded, slide, fade, scale)
├── _indicators.css              # ind-* tokens (pill, line, rounded)
├── _hover.css                   # hvr-* tokens (all hover states)
├── _transitions.css             # Animation definitions
└── _fixes.css                   # Browser fixes
```

**Rationale:**
- Aligns with new token naming system
- Each file corresponds to a token prefix
- More granular control for tree-shaking
- Better code organization for larger components

### Option C: Hybrid Approach

```
ui/tab-cordion/
├── index.css                    # Main entry point
├── core/
│   ├── _properties.css          # Custom properties
│   ├── _base.css                # Base element styles
│   └── _grid.css                # Grid layout and state propagation
├── accordion/
│   ├── _container.css           # cnt-* tokens for accordion
│   ├── _items.css               # itm-* tokens
│   └── _hover.css               # Accordion hover states
├── tabs/
│   ├── _tabs.css                # tab-* tokens
│   ├── _panels.css              # pnl-* tokens
│   ├── _indicators.css          # ind-* tokens
│   └── _hover.css               # Tab hover states
├── animations/
│   ├── _transitions.css         # Base transitions
│   └── _panel-animations.css   # pnl-slide, pnl-fade, pnl-scale
└── _fixes.css                   # Browser workarounds
```

**Rationale:**
- Best of both worlds: mode separation + component organization
- Clear folder structure for navigation
- Separates core from mode-specific features
- Animation logic grouped together

---

## Recommended Migration Strategy

### Phase 1: Preparation (No Breaking Changes)
1. Add new granular tokens alongside existing ones
   - `cnt-bg`, `cnt-border`, `cnt-rounded` alongside `background`, `contain`, `rounded`
   - `itm-divided`, `itm-separate`, etc.
2. Refactor internal CSS to use new token names
3. Make old tokens aliases that map to new ones
4. Update documentation with new token names

### Phase 2: File Split (No Breaking Changes)
1. Choose file structure (recommend **Option A** for simplicity)
2. Extract code into separate files
3. Update `index.css` to import all files:
   ```css
   @import "./_properties.css";
   @import "./_base.css";
   @import "./_accordion.css";
   @import "./_tabs.css";
   @import "./_transitions.css";
   @import "./_fixes.css";
   ```
4. Test thoroughly to ensure no regressions
5. Consider providing both bundled and unbundled versions

### Phase 3: New Features
1. Implement new panel animation tokens:
   - `pnl-slide`
   - `pnl-fade`
   - `pnl-scale`
2. Add to `_transitions.css` (Option A) or `_panel-animations.css` (Option C)
3. Document combinations and best practices

### Phase 4: Deprecation (Breaking Change - Major Version)
1. Add console warnings for old token usage
2. Update all examples and documentation to use new tokens
3. Provide automated migration tool/script
4. Set deprecation timeline

### Phase 5: Removal (Future Major Version)
1. Remove old token aliases
2. Remove backward compatibility code
3. Clean up any technical debt
4. Optimize file sizes

---

## File Content Breakdown

### `index.css` (Main Entry)
```css
/*
 * Tab-Cordion Component
 * A hybrid accordion/tabs component
 */
@import "../icon/index.css";
@import "./_properties.css";
@import "./_base.css";
@import "./_accordion.css";
@import "./_tabs.css";
@import "./_transitions.css";
@import "./_fixes.css";
```

### `_properties.css` (Lines 23-78)
- All CSS custom properties
- Theme variables
- Color definitions
- Spacing and sizing variables
- No selectors, only `:scope` property definitions

### `_base.css` (Lines 81-132, 622-638)
- `cq-box` grid setup
- `details` and `summary` base styles
- `ui-icon` styling
- State propagation (nth-child custom properties)
- Core layout without variant styling

### `_accordion.css` (Lines 143-303, 317-368)
- All `from` attribute selectors
- Container variants (`cnt-*`)
- Item variants (`itm-*`)
- Accordion hover states
- Accordion content transitions

### `_tabs.css` (Lines 419-608)
- All `to` attribute selectors within `@container (width >= 700px)`
- Tab header variants (`tab-*`)
- Panel variants (`pnl-*`)
- Indicator variants (`ind-*`)
- Tab hover states
- Tab layout and grid transformation

### `_transitions.css` (Lines 338-368, 463-473)
- Details content transitions
- Panel animations
- Hover transitions
- New: `pnl-slide`, `pnl-fade`, `pnl-scale` implementations

### `_fixes.css` (Lines 649-658)
- Safari/WebKit-specific fixes
- Browser compatibility workarounds
- Feature detection `@supports` queries

---

## Implementation Complexity

### Easy Wins
✅ **Extracting `_properties.css`** - Simple copy/paste, no logic changes
✅ **Extracting `_fixes.css`** - Self-contained browser fixes
✅ **Extracting `_base.css`** - Core styles, minimal dependencies

### Moderate Complexity
⚠️ **Splitting `_accordion.css` and `_tabs.css`** - Need to preserve media/container query context
⚠️ **Extracting `_transitions.css`** - Transitions are scattered, need careful extraction

### High Complexity
🔴 **Migrating to new token names** - Requires maintaining backward compatibility
🔴 **Handling `rounded` context-dependency** - Complex logic needs refactoring
🔴 **Implementing new panel animations** - New features while maintaining structure

---

## Testing Strategy

1. **Visual Regression Testing**
   - Capture screenshots of all token combinations before migration
   - Compare after each phase
   - Test at various viewport sizes (accordion ↔ tabs transition)

2. **Token Compatibility Matrix**
   ```
   Test all combinations:
   - background + contain + rounded
   - breakout + elevated + rounded
   - separate + rounded
   - All `to` tokens in various combinations
   ```

3. **Browser Testing**
   - Chrome/Edge (Blink)
   - Firefox (Gecko)
   - Safari (WebKit) - especially for `_fixes.css`

4. **Performance Testing**
   - Measure bundle size before/after
   - Test rendering performance
   - Validate CSS parsing time

---

## Rollout Recommendations

### For Users
- Provide migration guide with examples
- Create automated token renaming tool (regex-based)
- Offer both old and new APIs during transition period
- Clear communication about deprecation timeline

### For Developers
- Use feature flags to toggle between old/new implementations
- Maintain comprehensive test suite
- Document all token combinations
- Keep changelog detailed for each phase

---

## Open Questions

1. **Should we support mixing old and new tokens?**
   ```html
   <tab-cordion from="background itm-separate rounded">
   ```
   This could ease migration but adds complexity.

2. **Should `rounded` auto-expand to all relevant tokens?**
   - `from="rounded"` → `from="cnt-rounded itm-rounded"`
   - `to="rounded"` → `to="tab-rounded pnl-rounded ind-rounded"`

3. **Should we keep separate `from-hover` and `to-hover` attributes?**
   - Current: `<tab-cordion from="bg" from-hover="accent">`
   - Proposed: `<tab-cordion from="cnt-bg hvr-accent">`

4. **How to handle the `elevated` + `breakout` dependency?**
   - Validate at runtime?
   - Auto-add `breakout` when `elevated` is used?
   - Just document it?

---

## Success Metrics

- ✅ Zero visual regressions
- ✅ Backward compatibility maintained through Phase 3
- ✅ File sizes remain similar or smaller
- ✅ Improved maintainability (measured by time to add new tokens)
- ✅ Better developer experience (measured by feedback)
- ✅ Clear documentation and examples for all token combinations
