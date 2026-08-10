/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef3ff',
          100: '#dce7ff',
          200: '#b9cfff',
          300: '#8fb0ff',
          400: '#4a6ff0',
          500: '#1f52e6',
          600: '#0D41E1',
          700: '#0a34b3',
          800: '#0a2c8f',
          900: '#0b2568',
        },
        navy: '#0f2447',
      },
      boxShadow: {
        card: '0 2px 10px 0 rgb(15 36 71 / 0.06)',
        soft: '0 10px 24px -6px rgb(13 65 225 / 0.28)',
      },
      borderRadius: {
        xl2: '1.5rem',
      },
    },
  },
  plugins: [],
};
