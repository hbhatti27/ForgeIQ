/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        keyframes: {
          shimmer: {
            '0%': { backgroundPosition: '-500px 0' },
            '100%': { backgroundPosition: '500px 0' },
          },
        },
        animation: {
          shimmer: 'shimmer 2s infinite linear',
        },
      },
    },
    plugins: [],
  };