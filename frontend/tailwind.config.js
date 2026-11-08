/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#070F1E',
          900: '#0B192C',
          850: '#112239',
          800: '#1E3E62',
          700: '#254E7B',
          600: '#2B6CB0',
          500: '#0284C7',
          400: '#38BDF8',
          100: '#F0F9FF',
          50: '#F8FAFC'
        },
        alarm: {
          critical: '#DC2626',
          warning: '#F59E0B',
          healthy: '#10B981',
          info: '#3B82F6'
        }
      }
    },
  },
  plugins: [],
}
