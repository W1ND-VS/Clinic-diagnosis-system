/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        mulish: ['Mulish', 'sans-serif'],
      },
      colors: {
        // Màu chính từ Design System
        primary: {
          DEFAULT: '#1f94ca',
          50: '#e6f3f8',
          100: '#cce7f2',
          200: '#99cfe5',
          300: '#66b7d7',
          400: '#339fca',
          500: '#1f94ca', // Primary color
          600: '#1a7aa6',
          700: '#145f82',
          800: '#0f455d',
          900: '#0a2a39',
        },
        secondary: {
          DEFAULT: '#394152',
          50: '#ebeced',
          100: '#d6d8db',
          200: '#adb1b7',
          300: '#858a94',
          400: '#5c6370',
          500: '#394152', // Secondary color
          600: '#303542',
          700: '#252833',
          800: '#1a1c24',
          900: '#101115',
        },
        tertiary: {
          DEFAULT: '#6e7a8c',
          50: '#f1f2f4',
          100: '#e3e6e9',
          200: '#c7ccd3',
          300: '#abb3bd',
          400: '#8f99a7',
          500: '#6e7a8c', // Tertiary color
          600: '#596473',
          700: '#444d5a',
          800: '#2f3640',
          900: '#1a1e27',
        },
        // Dark theme colors
        dark: {
          bg: '#1a1c24',
          card: '#252833',
          text: '#f7fafc',
          textSecondary: '#a0aec0',
          border: '#394152',
        },
      },
      fontSize: {
        'h1': '40px',
        'h2': '26px',
        'h3': '20px',
        'h4': '16px',
        'h5': '14px',
        'h6': '12px',
      },
    },
  },
  plugins: [],
}

