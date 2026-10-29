/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        company: {
          navy: '#0f172a',
          charcoal: '#334155',
          blue: '#2563eb',
          lightBlue: '#eff6ff',
          border: '#e2e8f0',
          bg: '#f8fafc'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
