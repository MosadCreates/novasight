/**** Tailwind CSS Config ****/
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        science: {
          50: '#f0f5ff',
          100: '#e0ecff',
          600: '#1a56db',
          700: '#2563eb',
        },
      },
    },
  },
  plugins: [],
};
