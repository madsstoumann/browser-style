/**
 * @browser.style/layout - TypeScript Definitions
 * Type definitions for the Layout System v2.0
 */

/**
 * Layout Preset - Complete configuration for a lay-out element
 *
 * Represents a reusable layout configuration that can be applied
 * to a <lay-out> element, including breakpoint-specific layouts,
 * spacing, constraints, and visual/behavioral properties.
 *
 * @example
 * ```typescript
 * const heroPreset: LayoutPreset = {
 *   id: 'hero',
 *   name: 'Hero Layout',
 *   description: 'Two-column layout on medium screens, bento on large',
 *   breakpoints: {
 *     md: 'columns(2)',
 *     lg: 'bento(4a)'
 *   },
 *   spaceTop: 2,
 *   spaceBottom: 2,
 *   theme: 'primary'
 * }
 * ```
 */
export interface LayoutPreset {
  // Identity
  /** Unique identifier for the preset */
  id: string
  /** Display name for the preset */
  name: string
  /** Optional description of the preset's purpose */
  description?: string

  // Breakpoint-specific layouts
  /**
   * Layout definitions per breakpoint
   * @example { md: 'columns(2)', lg: 'bento(4a)' }
   */
  breakpoints: {
    [breakpoint: string]: string
  }

  // Grid Configuration
  /** CSS grid-template-columns override */
  columns?: string
  /** CSS grid-template-rows override */
  rows?: string

  // Spacing
  /** Column gap multiplier (default: 1) */
  colGap?: number
  /** Row gap multiplier (default: 1) */
  rowGap?: number
  /** Margin bottom multiplier (default: 0) */
  spaceBottom?: number
  /** Margin top multiplier (default: 0) */
  spaceTop?: number
  /** Padding bottom multiplier (default: 0) */
  padBottom?: number
  /** Padding top multiplier (default: 0) */
  padTop?: number
  /** Padding inline multiplier (default: 0) */
  padInline?: number

  // Constraints
  /** Max width CSS value (default: 100vw) */
  maxWidth?: string
  /** Width token: xs, sm, md, lg, xl, xxl */
  width?: WidthToken
  /** Bleed value 0-100 (undefined = no bleed attribute) */
  bleed?: number
  /** place-self CSS value (default: auto) */
  self?: string

  // Visual & Behavior
  /** Enable column/row rule decorations (default: false) */
  gapDecorations?: boolean
  /** Overflow mode for carousel-like behavior */
  overflow?: OverflowMode
  /** Theme name (must exist in layout.config themes) */
  theme?: string
  /** Animation value (reserved for future use) */
  animation?: string
}

/**
 * Width token values for constrained layouts
 */
export type WidthToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

/**
 * Overflow modes for carousel/scrolling behavior
 */
export type OverflowMode = '' | 'preview' | 'dynamic' | 'none'

/**
 * Layout Configuration (layout.config structure)
 *
 * Main configuration file for the layout system.
 * Defines breakpoints, layouts, themes, and container properties.
 */
export interface LayoutConfig {
  /** Output CSS filename */
  fileName: string
  /** Custom element tag name */
  element: string
  /** CSS cascade layer name */
  layer?: string
  /** Generate demo HTML files (default: false) */
  generateHTML?: boolean
  /** Core CSS files to include (from /core folder) */
  core: string[]
  /** Common CSS files to include (from /core folder) */
  common: string[]
  /** Layout container configuration */
  layoutContainer: LayoutContainer
  /** Breakpoint definitions */
  breakpoints: Record<string, Breakpoint>
  /** Layout inclusion configuration */
  layouts: LayoutsConfig
  /** Theme definitions */
  themes: Record<string, ThemeConfig>
}

/**
 * Layout Container Configuration
 *
 * Defines global layout constraints and width tokens
 */
export interface LayoutContainer {
  /** Root element selector for CSS custom properties */
  layoutRootElement: string
  /** Maximum layout width configuration */
  maxLayoutWidth: CSSPropertyMapping
  /** Layout margin configuration */
  layoutMargin: CSSPropertyMapping
  /** Width token definitions */
  widthTokens: Record<WidthToken, CSSPropertyMapping>
}

/**
 * CSS Custom Property Mapping
 *
 * Maps a value to a CSS custom property
 */
export interface CSSPropertyMapping {
  /** CSS value (e.g., "1024px", "1rem") */
  value: string
  /** CSS custom property name (e.g., "--layout-bleed-mw") */
  cssProperty: string
}

/**
 * Breakpoint Configuration
 *
 * Defines a responsive breakpoint
 */
export interface Breakpoint {
  /** Query type: media query or container query */
  type: '@media' | '@container'
  /** Minimum width (e.g., "720px") */
  min: string | null
  /** Maximum width (e.g., "1024px") */
  max: string | null
  /** Legacy: layouts available at this breakpoint (deprecated in v2) */
  layouts?: string[]
}

/**
 * Layouts Configuration
 *
 * Specifies which layout types to include in the build
 */
export interface LayoutsConfig {
  /** Core layouts (always included): columns, grid, autofit */
  core: string[]
  /** Advanced layouts (opt-in): bento, mosaic, ratios, asymmetrical */
  advanced: string[]
  /** Custom layout file paths */
  custom: string[]
}

/**
 * Theme Configuration
 *
 * Defines a theme with background and text color
 */
export interface ThemeConfig {
  /** Background color */
  bg: string
  /** Text color */
  color: string
}

/**
 * Layout JSON File Structure
 *
 * Structure of individual layout definition files (e.g., columns.json)
 */
export interface LayoutDefinitionFile {
  /** Display name */
  name: string
  /** Layout prefix for pattern matching (e.g., "columns", "bento") */
  prefix: string
  /** Description (may include HTML) */
  desc: string
  /** Icon data for overflow mode visualizations */
  overflowIcons?: Record<string, IconData[]>
  /** Layout variants */
  layouts: LayoutVariant[]
}

/**
 * Layout Variant Definition
 *
 * Individual layout pattern within a layout type
 */
export interface LayoutVariant {
  /** Variant ID (e.g., "2", "3a", "4b") */
  id: string
  /** Human-readable description */
  description: string
  /** CSS grid-template-columns value */
  columns: string
  /** CSS grid-template-rows value */
  rows?: string
  /** Expected number of items */
  items: number
  /** Icon visualization data */
  icon: IconData[]
  /** Can pattern repeat with more items? */
  repeatable: boolean
  /** Srcset width percentages (e.g., "50%,50%,100%") */
  srcset: string
  /** Example breakpoint usage */
  breakpoints?: Record<string, string>
  /** CSS rules for grid positioning */
  rules?: LayoutRule[]
}

/**
 * Layout Rule
 *
 * CSS rule for layout variant (nth-child patterns)
 */
export interface LayoutRule {
  /** CSS selector (e.g., "*:nth-child(3n+3)") */
  selector: string
  /** CSS properties to apply */
  properties: Record<string, string>
}

/**
 * Icon Data
 *
 * Visual representation data for layout icons
 */
export interface IconData {
  /** Width percentage */
  w: number
  /** Height percentage */
  h: number
  /** X position percentage */
  x: number
  /** Y position percentage */
  y: number
  /** Optional CSS class */
  class?: string
}

/**
 * Srcset Generation Options
 */
export interface SrcsetOptions {
  /** Layout preset */
  preset: LayoutPreset
  /** Layout configuration */
  config: LayoutConfig
  /** Layout data map */
  layoutsData: Map<string, any>
}

/**
 * Layout Constraints
 *
 * Extracted constraints for srcset generation
 */
export interface LayoutConstraints {
  /** Has max width constraint? */
  hasMaxWidth: boolean
  /** Max width value */
  maxWidth?: string | null
  /** Width token used */
  widthToken?: string | null
  /** Global max layout width */
  globalMaxWidth?: string
  /** Layout margin */
  layoutMargin?: string
  /** Has bleed attribute? */
  hasBleed: boolean
  /** Is full width (bleed="0")? */
  isFullWidth?: boolean
}

/**
 * Build Options
 *
 * Options for building layout CSS
 */
export interface BuildOptions {
  /** Path to layout.config file */
  configPath?: string
  /** Path to layouts folder */
  layoutsPath?: string
  /** Output CSS file path */
  outputPath?: string
  /** Minify CSS output */
  minify?: boolean
  /** Watch mode */
  watch?: boolean
}

/**
 * Component Props - React Layout Component
 */
export interface LayoutProps extends Partial<LayoutPreset> {
  /** Preset object (alternative to individual props) */
  preset?: LayoutPreset
  /** Layout configuration */
  config?: LayoutConfig
  /** Children elements */
  children?: React.ReactNode
  /** Additional CSS class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Manual srcsets override */
  srcsets?: string
}

/**
 * Component Props - Layout Configurator
 */
export interface LayoutConfiguratorProps {
  /** Layout configuration */
  config?: LayoutConfig
  /** Path to layout.config file */
  configPath?: string
  /** Custom layouts data */
  layouts?: LayoutDefinitionFile[]
  /** Initial preset to edit */
  initialPreset?: LayoutPreset
  /** Callback when preset changes */
  onChange?: (preset: LayoutPreset) => void
  /** Callback when breakpoint changes */
  onBreakpointChange?: (breakpoint: string) => void
  /** Callback when layout is selected */
  onLayoutSelect?: (layout: string) => void
  /** Additional CSS class name */
  className?: string
}

/**
 * Preset Validation Result
 */
export interface ValidationResult {
  /** Is valid? */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
}
