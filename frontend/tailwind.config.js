/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0a',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a'
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          accent: '#8b5cf6'
        },
        purple: {
          primary: '#8b5cf6',
          hover: '#7c3aed',
          dark: '#6d28d9'
        },
        border: '#333333'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
}