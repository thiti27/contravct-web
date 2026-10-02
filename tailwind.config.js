/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Header-specific breakpoint: below this, the "Contract Procedure"/"Download
      // Form" pill buttons collapse to icon-only (see Header.jsx) so the nav items
      // (Home/Job Status/.../Settings) never get squeezed off-screen — measured
      // against the real header content, not one of Tailwind's stock sm/md/lg/xl
      // steps, which straddled the exact width where the squeeze started.
      screens: {
        hd: '1440px',
      },
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
        // Was '0 2px 10px 0 rgb(15 36 71 / 0.06)' — 6% alpha read as barely-there next
        // to a light page background, which is what actually made cards across the
        // app (not just Home) "blend into" their backdrop instead of looking lifted
        // off it. Boosted for real elevation; every card using shadow-card (there's
        // no Home-only variant of a shared token) picks this up automatically.
        card: '0 14px 30px -8px rgb(15 36 71 / 0.22)',
        soft: '0 10px 24px -6px rgb(13 65 225 / 0.28)',
      },
      borderRadius: {
        xl2: '1.5rem',
      },
    },
  },
  plugins: [],
};
