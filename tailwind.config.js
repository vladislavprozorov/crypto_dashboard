/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        panel: token('panel'),
        ink: token('ink'),
        'on-ink': token('on-ink'),
        muted: token('muted'),
        rule: token('rule'),
        'rule-soft': token('rule-soft'),
        accent: token('accent'),
        up: token('up'),
        down: token('down'),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        page: '1376px',
      },
    },
  },
  plugins: [],
};
