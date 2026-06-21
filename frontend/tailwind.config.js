/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-primary-fixed-variant": "#1f477b",
        "on-error-container": "#93000a",
        "inverse-primary": "#a7c8ff",
        "surface-tint": "#3a5f94",
        "surface-container-high": "#e5e9eb",
        "error": "#ba1a1a",
        "on-background": "#181c1e",
        "tertiary-fixed-dim": "#e6c446",
        "on-surface": "#181c1e",
        "on-tertiary-fixed": "#231b00",
        "inverse-on-surface": "#eef1f3",
        "primary-fixed": "#d5e3ff",
        "on-tertiary-container": "#4d3e00",
        "on-secondary": "#ffffff",
        "on-tertiary-fixed-variant": "#564500",
        "secondary-fixed-dim": "#bcc7dd",
        "on-error": "#ffffff",
        "on-surface-variant": "#43474f",
        "on-secondary-fixed-variant": "#3c475a",
        "surface-container-low": "#f1f4f6",
        "outline": "#737780",
        "surface-bright": "#f7fafc",
        "surface-container-highest": "#e0e3e5",
        "tertiary": "#715c00",
        "on-secondary-fixed": "#111c2c",
        "primary-container": "#003366",
        "surface-container": "#ebeef0",
        "background": "#f7fafc",
        "inverse-surface": "#2d3133",
        "surface-variant": "#e0e3e5",
        "tertiary-fixed": "#ffe17c",
        "surface-container-lowest": "#ffffff",
        "secondary": "#545f72",
        "on-secondary-container": "#586377",
        "primary": "#001e40",
        "on-tertiary": "#ffffff",
        "on-primary-fixed": "#001b3c",
        "outline-variant": "#c3c6d1",
        "primary-fixed-dim": "#a7c8ff",
        "surface-dim": "#d7dadc",
        "error-container": "#ffdad6",
        "tertiary-container": "#c9a82c",
        "on-primary": "#ffffff",
        "surface": "#f7fafc",
        "secondary-container": "#d5e0f7",
        "on-primary-container": "#799dd6"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "gutter": "24px",
        "unit": "8px",
        "margin-desktop": "40px",
        "margin-mobile": "16px",
        "container-max": "1440px"
      },
      fontFamily: {
        "status-code": ["JetBrains Mono", "monospace"],
        "body-md": ["Inter", "sans-serif"],
        "label-caps": ["JetBrains Mono", "monospace"],
        "display-lg": ["Hanken Grotesk", "sans-serif"],
        "headline-lg-mobile": ["Hanken Grotesk", "sans-serif"],
        "headline-lg": ["Hanken Grotesk", "sans-serif"]
      },
      fontSize: {
        "status-code": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
