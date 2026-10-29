/**
 * SCORP DS - TAILWIND PRESET
 * 
 * This preset extends Tailwind CSS with Scorp DS design tokens.
 * Use this in your consuming project's tailwind.config.js:
 * 
 * module.exports = {
 *   presets: [require('@scorp-ds/tokens/tailwind.preset')],
 *   // ... your other config
 * }
 */

/**
 * Responsive prefixes, mirroring `global.breakpoint` in tokens.json and the
 * `--breakpoint-*` custom properties in tokens.css. sm/md/lg/xl carry
 * Tailwind's default pixel values, so existing responsive classes keep
 * behaving exactly as before; `docked` is a component breakpoint (Modal's
 * docked variant), here so one scale covers both CSS and JS consumers.
 *
 * These are literals on purpose: consumer sites vendor this preset as a
 * single standalone file (the showcase imports
 * `vendor/scorp-ds/tailwind.preset.cjs` with no sibling src/), so the preset
 * must not require tokens.json at load time. The token-parser drift test
 * asserts these values match tokens.json and tokens.css, so they cannot
 * silently diverge.
 */
const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  docked: '960px',
};

module.exports = {
  theme: {
    extend: {
      // Breakpoints mirroring global.breakpoint. Declared under `extend` so
      // Tailwind's remaining default screens (2xl) stay available.
      screens,
      // Colors from design tokens - reference CSS variables
      colors: {
        amber: {
          50: 'var(--color-amber-50)',
          100: 'var(--color-amber-100)',
          200: 'var(--color-amber-200)',
          300: 'var(--color-amber-300)',
          400: 'var(--color-amber-400)',
          500: 'var(--color-amber-500)',
          600: 'var(--color-amber-600)',
          700: 'var(--color-amber-700)',
          800: 'var(--color-amber-800)',
          900: 'var(--color-amber-900)',
          950: 'var(--color-amber-950)',
          975: 'var(--color-amber-975)',
          1000: 'var(--color-amber-1000)',
          gold: 'var(--color-amber-gold)',
        },
        sepia: {
          50: 'var(--color-sepia-50)',
          100: 'var(--color-sepia-100)',
          200: 'var(--color-sepia-200)',
          300: 'var(--color-sepia-300)',
          400: 'var(--color-sepia-400)',
          500: 'var(--color-sepia-500)',
          600: 'var(--color-sepia-600)',
          700: 'var(--color-sepia-700)',
          800: 'var(--color-sepia-800)',
          900: 'var(--color-sepia-900)',
          925: 'var(--color-sepia-925)',
          950: 'var(--color-sepia-950)',
          975: 'var(--color-sepia-975)',
          1000: 'var(--color-sepia-1000)',
        },
        green: {
          50: 'var(--color-green-50)',
          100: 'var(--color-green-100)',
          200: 'var(--color-green-200)',
          300: 'var(--color-green-300)',
          400: 'var(--color-green-400)',
          500: 'var(--color-green-500)',
          600: 'var(--color-green-600)',
          700: 'var(--color-green-700)',
          800: 'var(--color-green-800)',
          900: 'var(--color-green-900)',
          950: 'var(--color-green-950)',
        },
        blue: {
          50: 'var(--color-blue-50)',
          100: 'var(--color-blue-100)',
          200: 'var(--color-blue-200)',
          300: 'var(--color-blue-300)',
          400: 'var(--color-blue-400)',
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
          700: 'var(--color-blue-700)',
          800: 'var(--color-blue-800)',
          900: 'var(--color-blue-900)',
          950: 'var(--color-blue-950)',
        },
        purple: {
          50: 'var(--color-purple-50)',
          100: 'var(--color-purple-100)',
          200: 'var(--color-purple-200)',
          300: 'var(--color-purple-300)',
          400: 'var(--color-purple-400)',
          500: 'var(--color-purple-500)',
          600: 'var(--color-purple-600)',
          700: 'var(--color-purple-700)',
          800: 'var(--color-purple-800)',
          900: 'var(--color-purple-900)',
          950: 'var(--color-purple-950)',
        },
        red: {
          50: 'var(--color-red-50)',
          100: 'var(--color-red-100)',
          200: 'var(--color-red-200)',
          300: 'var(--color-red-300)',
          400: 'var(--color-red-400)',
          500: 'var(--color-red-500)',
          600: 'var(--color-red-600)',
          700: 'var(--color-red-700)',
          800: 'var(--color-red-800)',
          900: 'var(--color-red-900)',
          950: 'var(--color-red-950)',
        },
        // TUI Tier 2: ANSI terminal accent colors
        term: {
          green: 'var(--color-term-green)',
          amber: 'var(--color-term-amber)',
          cyan: 'var(--color-term-cyan)',
          magenta: 'var(--color-term-magenta)',
          red: 'var(--color-term-red)',
          blue: 'var(--color-term-blue)',
          white: 'var(--color-term-white)',
          dim: 'var(--color-term-dim)',
        },
        // Semantic color aliases
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
          975: 'var(--color-primary-975)',
          1000: 'var(--color-primary-1000)',
          gold: 'var(--color-primary-gold)',
        },
        secondary: {
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
          925: 'var(--color-secondary-925)',
          950: 'var(--color-secondary-950)',
          975: 'var(--color-secondary-975)',
          1000: 'var(--color-secondary-1000)',
        },
        success: {
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
          950: 'var(--color-success-950)',
        },
        info: {
          50: 'var(--color-info-50)',
          100: 'var(--color-info-100)',
          200: 'var(--color-info-200)',
          300: 'var(--color-info-300)',
          400: 'var(--color-info-400)',
          500: 'var(--color-info-500)',
          600: 'var(--color-info-600)',
          700: 'var(--color-info-700)',
          800: 'var(--color-info-800)',
          900: 'var(--color-info-900)',
          950: 'var(--color-info-950)',
        },
        warning: {
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
          950: 'var(--color-warning-950)',
        },
        error: {
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
          950: 'var(--color-error-950)',
        },
        // Semantic roles (light / dark via CSS variables — use in components instead of raw scales)
        surface: {
          page: 'var(--surface-page)',
          container: 'var(--surface-container)',
          card: 'var(--surface-card)',
          'container-stroke': 'var(--surface-container-stroke)',
          subtle: 'var(--surface-subtle)',
          muted: 'var(--surface-muted)',
          overlay: 'var(--surface-overlay)',
          inverse: 'var(--surface-inverse)',
          raised: 'var(--surface-raised)',
        },
        foreground: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
          link: 'var(--text-link)',
          'link-hover': 'var(--text-link-hover)',
          'on-inverse': 'var(--text-on-inverse)',
        },
        line: {
          default: 'var(--border-default)',
          muted: 'var(--border-muted)',
          strong: 'var(--border-strong)',
          hairline: 'var(--border-hairline)',
          error: 'var(--border-error)',
          focus: 'var(--border-focus)',
        },
        // Brand accent (single role; theme eggs may override --accent at runtime)
        accent: 'var(--accent)',
        // Unfilled control rail: Switch off track, Slider rail
        control: {
          track: 'var(--control-track)',
        },
        // Fire ramp (theme-invariant dither-art sepia tones)
        fire: {
          bright: 'var(--fire-bright)',
          mid: 'var(--fire-mid)',
          dim: 'var(--fire-dim)',
        },
        field: {
          bg: 'var(--field-background)',
          'bg-error': 'var(--field-background-error)',
          border: 'var(--field-border)',
          'border-hover': 'var(--field-border-hover)',
          'border-focus': 'var(--field-border-focus)',
          'border-error': 'var(--field-border-error)',
          placeholder: 'var(--field-placeholder)',
        },
      },
      // Control sizes from tokens: h-control-md, min-h-control-sm, size-control-lg,
      // w-touch / h-touch for 44px hit areas (Tailwind 3.4 feeds spacing to
      // width, height, min/max sizes and size-*)
      spacing: {
        // The spacing scale (global.spacing), whole and half steps, routed through
        // the variables so a token edit reaches every p-*, m-*, gap-* class. Values
        // equal Tailwind's defaults, so nothing moves. Half steps are hyphenated in
        // the token name (DTCG names cannot hold a dot): `1.5` is --spacing-1-5.
        // Steps outside this list (7, 9, 11, 14, …) are lint errors in components
        // (scorp/no-off-scale-spacing, decision 0027).
        0: 'var(--spacing-0)',
        0.5: 'var(--spacing-0-5)',
        1: 'var(--spacing-1)',
        1.5: 'var(--spacing-1-5)',
        2: 'var(--spacing-2)',
        2.5: 'var(--spacing-2-5)',
        3: 'var(--spacing-3)',
        3.5: 'var(--spacing-3-5)',
        4: 'var(--spacing-4)',
        5: 'var(--spacing-5)',
        6: 'var(--spacing-6)',
        8: 'var(--spacing-8)',
        10: 'var(--spacing-10)',
        12: 'var(--spacing-12)',
        16: 'var(--spacing-16)',
        20: 'var(--spacing-20)',
        24: 'var(--spacing-24)',
        'control-sm': 'var(--control-height-sm)',
        'control-md': 'var(--control-height-md)',
        'control-lg': 'var(--control-height-lg)',
        touch: 'var(--touch-target)',
      },
      // Font families from tokens
      fontFamily: {
        mono: 'var(--font-family-mono)',
      },
      // Font weights from tokens (global.font.weight). The scale is 400 / 500 /
      // 700 only. There is no 600, so `font-semibold` is off-token.
      fontWeight: {
        regular: 'var(--font-weight-regular)',
        normal: 'var(--font-weight-regular)',
        medium: 'var(--font-weight-medium)',
        bold: 'var(--font-weight-bold)',
      },
      // The system's single rule weight: `border-hairline`, `border-b-hairline`
      borderWidth: {
        hairline: 'var(--border-width-hairline)',
      },
      // Font sizes from tokens (matches tokens.css / tokens.json global.font.size)
      fontSize: {
        '3xs': 'var(--font-size-3xs)',
        '2xs': 'var(--font-size-2xs)',
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
        '6xl': 'var(--font-size-6xl)',
        'page-title': 'var(--font-size-page-title)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Plate silhouettes: the system's shape language (replaces the retired
    // radius tokens). clip-path slices real borders, so build rings as
    // element = ring color clipped + ::before = fill clipped 1px inset,
    // and use inset focus rings.
    function scorpPlates({ addUtilities }) {
      addUtilities({
        '.plate-round': { 'clip-path': 'var(--plate-round)' },
        '.plate-round-lg': { 'clip-path': 'var(--plate-round-lg)' },
        '.plate-round-lg-top': { 'clip-path': 'var(--plate-round-lg-top)' },
      });
    },
  ],
};
