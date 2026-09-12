/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          dark: '#0a1128',
          card: '#1c2541',
          accent: '#00b4d8',
          gold: '#f77f00',
          alert: '#d90429',
          success: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
