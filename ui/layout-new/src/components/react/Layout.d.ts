import React from 'react'
import type { LayoutPreset } from '../../types'

/**
 * Props for the Layout component
 */
export interface LayoutProps extends Partial<Omit<LayoutPreset, 'id' | 'name' | 'description'>> {
  /**
   * Layout preset object
   * Individual props will override preset values
   */
  preset?: LayoutPreset

  /**
   * Child elements to render inside the layout
   */
  children?: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Inline styles
   */
  style?: React.CSSProperties

  /**
   * Breakpoint-specific layouts
   * Shorthand for individual md, lg, xl, xxl props
   */
  breakpoints?: {
    [breakpoint: string]: string
  }

  /**
   * Medium breakpoint layout pattern (e.g., "columns(2)")
   */
  md?: string

  /**
   * Large breakpoint layout pattern (e.g., "grid(3a)")
   */
  lg?: string

  /**
   * Extra large breakpoint layout pattern
   */
  xl?: string

  /**
   * 2X large breakpoint layout pattern
   */
  xxl?: string

  /**
   * Column gap multiplier (default: 1)
   */
  colGap?: number

  /**
   * Row gap multiplier (default: 1)
   */
  rowGap?: number

  /**
   * Bottom margin multiplier (default: 0)
   */
  spaceBottom?: number

  /**
   * Top margin multiplier (default: 0)
   */
  spaceTop?: number

  /**
   * Bottom padding multiplier (default: 0)
   */
  padBottom?: number

  /**
   * Top padding multiplier (default: 0)
   */
  padTop?: number

  /**
   * Inline padding multiplier (default: 0)
   */
  padInline?: number

  /**
   * Maximum width (CSS length/percentage)
   */
  maxWidth?: string

  /**
   * Width token from layout.config
   */
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

  /**
   * Bleed value 0-100
   */
  bleed?: number

  /**
   * CSS place-self value
   */
  self?: string

  /**
   * Enable gap decorations (column/row rules)
   */
  gapDecorations?: boolean

  /**
   * Overflow mode for carousel-like behavior
   */
  overflow?: '' | 'preview' | 'dynamic' | 'none'

  /**
   * Theme name from layout.config
   */
  theme?: string

  /**
   * Animation value (reserved for future use)
   */
  animation?: string
}

/**
 * Layout Component - React wrapper for <lay-out> element
 *
 * Provides a React-friendly API for the browser.style layout system.
 * Accepts either a preset object or individual layout properties.
 *
 * @example
 * // Using preset
 * const preset = createPreset({
 *   id: 'hero',
 *   breakpoints: { md: 'columns(2)', lg: 'grid(3a)' }
 * })
 * <Layout preset={preset}>
 *   <Card />
 *   <Card />
 * </Layout>
 *
 * @example
 * // Using individual props
 * <Layout md="columns(2)" lg="grid(3a)" spaceTop={2}>
 *   <Card />
 *   <Card />
 * </Layout>
 *
 * @example
 * // Mixing preset and props (props override preset)
 * <Layout preset={basePreset} md="columns(3)" spaceBottom={3}>
 *   <Card />
 * </Layout>
 */
export function Layout(props: LayoutProps): React.ReactElement

export default Layout
