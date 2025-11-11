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
        accent: '#1D1D1F',
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
      typography: {
        DEFAULT: {
          css: {
            'h1': {
              marginTop: '2em',
              marginBottom: '1em',
            },
            'h2': {
              marginTop: '2em',
              marginBottom: '0.75em',
            },
            'h3': {
              marginTop: '1.5em',
              marginBottom: '0.5em',
            },
            'ul': {
              marginTop: '1em',
              marginBottom: '1.5em',
            },
            'p': {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
