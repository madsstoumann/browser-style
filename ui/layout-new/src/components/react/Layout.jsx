'use client'

import React from 'react'
import { presetToAttributes } from '../../preset.js'
import { getSizes, normalizeSrcsets } from './srcset-utils.js'
import { buildSrcsets, getSizesForChild, autoGenerateSizes } from './srcset-advanced.js'
import { layoutConfig } from '../../../layouts-map.js'

/**
 * Layout Component - React wrapper for <lay-out> element
 *
 * @param {Object} props - Component props
 * @param {import('../../types').LayoutPreset} [props.preset] - Layout preset object
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.CSSProperties} [props.style] - Inline styles
 * @param {string|Object} [props.srcsets] - Srcsets for responsive images (string: "default:100vw;540:50vw" or object: {default: '100vw', 540: '50vw'})
 * @param {Object} [props.config] - Layout config (for auto-generating srcsets from preset)
 * @param {Object} [props.layoutsData] - Layouts data (for auto-generating srcsets from preset)
 *
 * Individual layout properties (override preset):
 * @param {Object.<string, string>} [props.breakpoints] - Breakpoint layouts (e.g., {md: "columns(2)", lg: "grid(3a)"})
 * @param {string} [props.md] - Medium breakpoint layout
 * @param {string} [props.lg] - Large breakpoint layout
 * @param {string} [props.xl] - Extra large breakpoint layout
 * @param {string} [props.xxl] - 2X large breakpoint layout
 * @param {number} [props.colGap] - Column gap multiplier
 * @param {number} [props.rowGap] - Row gap multiplier
 * @param {number} [props.spaceBottom] - Bottom margin multiplier
 * @param {number} [props.spaceTop] - Top margin multiplier
 * @param {number} [props.padBottom] - Bottom padding multiplier
 * @param {number} [props.padTop] - Top padding multiplier
 * @param {number} [props.padInline] - Inline padding multiplier
 * @param {string} [props.maxWidth] - Maximum width
 * @param {string} [props.width] - Width token (xs, sm, md, lg, xl, xxl)
 * @param {number} [props.bleed] - Bleed value 0-100
 * @param {string} [props.self] - place-self value
 * @param {boolean} [props.gapDecorations] - Enable gap decorations
 * @param {string} [props.overflow] - Overflow mode (preview, dynamic, none)
 * @param {string} [props.theme] - Theme name
 * @param {string} [props.animation] - Animation value
 */
export function Layout({
  preset,
  children,
  className,
  style,
  srcsets: srcsetsProp,
  config,
  layoutsData,
  // Individual props that can override preset
  breakpoints,
  md,
  lg,
  xl,
  xxl,
  colGap,
  rowGap,
  spaceBottom,
  spaceTop,
  padBottom,
  padTop,
  padInline,
  maxWidth,
  width,
  bleed,
  self,
  gapDecorations,
  overflow,
  theme,
  animation,
  ...rest
}) {
  // Build final preset from preset prop + individual overrides
  const finalPreset = React.useMemo(() => {
    const base = preset || {}

    // Merge breakpoints
    const finalBreakpoints = { ...base.breakpoints }
    if (breakpoints) {
      Object.assign(finalBreakpoints, breakpoints)
    }
    if (md !== undefined) finalBreakpoints.md = md
    if (lg !== undefined) finalBreakpoints.lg = lg
    if (xl !== undefined) finalBreakpoints.xl = xl
    if (xxl !== undefined) finalBreakpoints.xxl = xxl

    return {
      ...base,
      breakpoints: finalBreakpoints,
      ...(colGap !== undefined && { colGap }),
      ...(rowGap !== undefined && { rowGap }),
      ...(spaceBottom !== undefined && { spaceBottom }),
      ...(spaceTop !== undefined && { spaceTop }),
      ...(padBottom !== undefined && { padBottom }),
      ...(padTop !== undefined && { padTop }),
      ...(padInline !== undefined && { padInline }),
      ...(maxWidth !== undefined && { maxWidth }),
      ...(width !== undefined && { width }),
      ...(bleed !== undefined && { bleed }),
      ...(self !== undefined && { self }),
      ...(gapDecorations !== undefined && { gapDecorations }),
      ...(overflow !== undefined && { overflow }),
      ...(theme !== undefined && { theme }),
      ...(animation !== undefined && { animation }),
    }
  }, [
    preset, breakpoints, md, lg, xl, xxl,
    colGap, rowGap, spaceBottom, spaceTop,
    padBottom, padTop, padInline, maxWidth,
    width, bleed, self, gapDecorations,
    overflow, theme, animation
  ])

  // Normalize srcsets (string or object format)
  // Auto-generate from preset if not provided
  const srcsets = React.useMemo(() => {
    if (srcsetsProp) {
      return normalizeSrcsets(srcsetsProp)
    }
    // Auto-generate from preset breakpoints if available
    if (finalPreset.breakpoints && Object.keys(finalPreset.breakpoints).length > 0) {
      const generated = buildSrcsets(finalPreset.breakpoints)
      return normalizeSrcsets(generated)
    }
    return {}
  }, [srcsetsProp, finalPreset.breakpoints])

  // Convert preset to HTML attributes
  const layoutAttrs = React.useMemo(() => {
    return presetToAttributes(finalPreset)
  }, [finalPreset])

  return React.createElement(
    'lay-out',
    {
      ...layoutAttrs,
      className,
      style,
      ...rest
    },
    children
  )
}

Layout.displayName = 'Layout'

/**
 * Helper function to get Next.js Image sizes attribute from srcsets
 * Can be used outside component context
 *
 * @example
 * const sizes = Layout.getSizes("default:100vw;540:50vw;720:33.33vw")
 * <Image src="/photo.jpg" sizes={sizes} />
 *
 * @example
 * const sizes = Layout.getSizes({ default: '100vw', 540: '50vw', 720: '33.33vw' })
 * <Image src="/photo.jpg" sizes={sizes} />
 */
Layout.getSizes = getSizes

/**
 * Advanced: Get sizes for specific child with min() constraints
 * @param {string|Object} srcsets - Srcsets string or object
 * @param {number} childIndex - Child index (0-based)
 * @param {Object} [options] - Options
 * @returns {string} CSS sizes attribute
 *
 * @example
 * // Per-child sizes with constraints
 * const sizes = Layout.getSizesForChild("default:100vw;720:66.67%,33.33%,33.33%", 0)
 * // → "(min-width: 720px) min(66.67vw, 683px), 100vw"
 */
Layout.getSizesForChild = getSizesForChild

/**
 * Auto-generate srcsets from layout breakpoints
 * @param {Object} breakpoints - Layout breakpoints
 * @returns {string} Srcsets string
 *
 * @example
 * const srcsets = Layout.buildSrcsets({ md: 'columns(2)', lg: 'grid(3c)' })
 * // → "default:100vw;540:50%;720:66.67%,33.33%,33.33%"
 */
Layout.buildSrcsets = buildSrcsets

/**
 * Auto-generate sizes for a child from breakpoints
 * @param {Object} breakpoints - Layout breakpoints
 * @param {number} childIndex - Child index (0-based)
 * @param {Object} [options] - Options
 * @returns {string} CSS sizes attribute
 *
 * @example
 * const sizes = Layout.autoGenerateSizes({ md: 'columns(2)', lg: 'grid(3c)' }, 0)
 * // → "(min-width: 720px) min(66.67vw, 683px), (min-width: 540px) min(50vw, 512px), 100vw"
 */
Layout.autoGenerateSizes = autoGenerateSizes

/**
 * React hook to get sizes from Layout context with child-position awareness
 * Use this inside components that are children of <Layout>
 *
 * @param {number} [childIndex] - Child index (0-based). If not provided, returns simple sizes
 * @returns {string} CSS sizes attribute
 *
 * @example
 * // Simple usage (all children same size)
 * function MyCard() {
 *   const sizes = useLayoutSizes()
 *   return <Image src="/photo.jpg" sizes={sizes} />
 * }
 *
 * @example
 * // With child index (for per-child sizes)
 * function MyCard({ index }) {
 *   const sizes = useLayoutSizes(index)
 *   return <Image src="/photo.jpg" sizes={sizes} />
 * }
 */
export function useLayoutSizes(childIndex) {
  const context = React.useContext(LayoutContext)
  if (!context) {
    return '100vw'
  }

  // If child index provided, use advanced calculation
  if (childIndex !== undefined && context.srcsets) {
    return getSizesForChild(context.srcsets, childIndex, {
      maxLayoutWidth: context.maxLayoutWidth
    })
  }

  // Otherwise return simple sizes
  return getSizes(context.srcsets)
}

// Create context for child components to access srcsets
const LayoutContext = React.createContext(null)

// Enhanced Layout with context provider
const LayoutWithContext = React.forwardRef(function LayoutWithContext(props, ref) {
  const { srcsets: srcsetsProp, config, layoutsData, preset, ...layoutProps } = props

  // Calculate srcsets (same logic as above)
  const finalPreset = React.useMemo(() => {
    const base = preset || {}
    const finalBreakpoints = { ...base.breakpoints }
    if (props.breakpoints) Object.assign(finalBreakpoints, props.breakpoints)
    if (props.md !== undefined) finalBreakpoints.md = props.md
    if (props.lg !== undefined) finalBreakpoints.lg = props.lg
    if (props.xl !== undefined) finalBreakpoints.xl = props.xl
    if (props.xxl !== undefined) finalBreakpoints.xxl = props.xxl

    return {
      ...base,
      breakpoints: finalBreakpoints,
      ...(props.colGap !== undefined && { colGap: props.colGap }),
      ...(props.rowGap !== undefined && { rowGap: props.rowGap }),
      ...(props.spaceBottom !== undefined && { spaceBottom: props.spaceBottom }),
      ...(props.spaceTop !== undefined && { spaceTop: props.spaceTop }),
      ...(props.padBottom !== undefined && { padBottom: props.padBottom }),
      ...(props.padTop !== undefined && { padTop: props.padTop }),
      ...(props.padInline !== undefined && { padInline: props.padInline }),
      ...(props.maxWidth !== undefined && { maxWidth: props.maxWidth }),
      ...(props.width !== undefined && { width: props.width }),
      ...(props.bleed !== undefined && { bleed: props.bleed }),
      ...(props.self !== undefined && { self: props.self }),
      ...(props.gapDecorations !== undefined && { gapDecorations: props.gapDecorations }),
      ...(props.overflow !== undefined && { overflow: props.overflow }),
      ...(props.theme !== undefined && { theme: props.theme }),
      ...(props.animation !== undefined && { animation: props.animation }),
    }
  }, [preset, props])

  const srcsets = React.useMemo(() => {
    if (srcsetsProp) {
      return normalizeSrcsets(srcsetsProp)
    }
    // Auto-generate from preset breakpoints if available
    if (finalPreset.breakpoints && Object.keys(finalPreset.breakpoints).length > 0) {
      const generated = buildSrcsets(finalPreset.breakpoints)
      return normalizeSrcsets(generated)
    }
    return {}
  }, [srcsetsProp, finalPreset.breakpoints])

  const maxLayoutWidth = props.maxWidth || layoutConfig.maxLayoutWidth

  const contextValue = React.useMemo(() => ({
    srcsets,
    maxLayoutWidth
  }), [srcsets, maxLayoutWidth])

  return (
    <LayoutContext.Provider value={contextValue}>
      <Layout ref={ref} preset={finalPreset} {...layoutProps} />
    </LayoutContext.Provider>
  )
})

LayoutWithContext.displayName = 'LayoutWithContext'
LayoutWithContext.getSizes = getSizes

export { LayoutWithContext, getSizes }
export default Layout
