/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cat: {
          black:  '#1A1A1A',   // sidebar, headers, primary text
          yellow: '#FFCD11',   // primary buttons, progress fills, active states, logo
          gray: {
            50:  '#F5F5F5',
            200: '#E0E0E0',
            500: '#8A8A8A',
            700: '#4A4A4A'
          },
          orange: '#F7941E',   // medium/warning priority, weather-risk banners
          red:    '#E23D3D',   // critical/breakdown/proximity/geofence breach
          green:  '#2FA84F',   // normal/on-track/completed
          blue:   '#2E6FDB'    // informational (ETA, transport, route lines)
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cat': '0 2px 8px -1px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
}
