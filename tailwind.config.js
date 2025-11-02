/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FAFAFA',
        accent: '#007AFF',
        text: '#1D1D1F',
        border: '#E5E5E7',
        secondary: '#F5F5F7',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'apple': '12px',
      },
    },
  },
  plugins: [],
}
