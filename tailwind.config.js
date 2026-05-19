/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'on-primary-fixed-variant': '#26500a',
        'surface-dim': '#131315',
        'secondary-fixed': '#e4e2e4',
        'inverse-on-surface': '#303032',
        outline: '#8c9384',
        'inverse-surface': '#e4e2e4',
        'tertiary-fixed': '#ffd8eb',
        'surface-container-highest': '#353437',
        'on-secondary': '#303032',
        'on-primary-fixed': '#092100',
        'surface-container-low': '#1b1b1d',
        'outline-variant': '#42493c',
        'on-secondary-container': '#b6b4b7',
        'on-tertiary-fixed': '#3b002c',
        'on-secondary-fixed-variant': '#474649',
        tertiary: '#ffc1e3',
        'on-surface-variant': '#c2c9b8',
        'on-surface': '#e4e2e4',
        'on-tertiary-fixed-variant': '#732c5b',
        primary: '#aee18b',
        'secondary-container': '#474649',
        'primary-fixed': '#bdf199',
        secondary: '#c8c6c8',
        'on-background': '#e4e2e4',
        'on-primary': '#153800',
        'error-container': '#93000a',
        'primary-container': '#93c572',
        'surface-tint': '#a2d580',
        background: '#131315',
        'on-tertiary': '#581543',
        'on-tertiary-container': '#752e5c',
        'on-error': '#690005',
        error: '#ffb4ab',
        'surface-container': '#1f1f21',
        'surface-container-high': '#2a2a2c',
        'surface-bright': '#39393b',
        'tertiary-fixed-dim': '#ffaedc',
        'surface-variant': '#353437',
        'on-error-container': '#ffdad6',
        'secondary-fixed-dim': '#c8c6c8',
        surface: '#131315',
        'tertiary-container': '#f59bd0',
        'inverse-primary': '#3d6922',
        'on-secondary-fixed': '#1b1b1d',
        'on-primary-container': '#27520b',
        'surface-container-lowest': '#0e0e10',
        'primary-fixed-dim': '#a2d580'
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px'
      },
      spacing: {
        'stack-sm': '8px',
        'margin-main': '40px',
        'gutter-md': '24px',
        'app-width': '800px',
        'app-height': '540px',
        'stack-md': '16px',
        'stack-lg': '32px'
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'sans-serif'],
        'headline-lg': ['Hanken Grotesk'],
        'label-md': ['Hanken Grotesk'],
        'body-sm': ['Hanken Grotesk'],
        'body-lg': ['Hanken Grotesk'],
        'button-text': ['Hanken Grotesk'],
        'headline-md': ['Hanken Grotesk']
      },
      fontSize: {
        'headline-lg': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'headline-md': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'body-lg': ['15px', { lineHeight: '22px' }],
        'body-sm': ['13px', { lineHeight: '18px' }],
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'button-text': ['14px', { lineHeight: '20px', fontWeight: '700' }]
      }
    }
  },
  plugins: []
}
