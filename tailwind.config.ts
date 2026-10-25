import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: { 950: '#022c22' },
        slate: { 850: '#172033' },
      },
      boxShadow: {
        soft: '0 8px 30px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;
