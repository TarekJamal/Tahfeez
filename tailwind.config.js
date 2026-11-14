module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { navy: '#0B1426', gold: '#D4AF37', emerald: { 950: '#052e22' } },
      fontFamily: {
        quran: ['var(--font-amiri)', 'serif'],
        ui: ['var(--font-tajawal)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
