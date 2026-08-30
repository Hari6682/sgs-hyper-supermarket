import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SGS brand tokens
        sgs: {
          ink: '#1C231F',        // near-black, green-tinted body text
          cream: '#FBF9F4',      // warm off-white background
          sage: '#E4EFE6',       // light surface / section backgrounds
          green: {
            DEFAULT: '#1F6B4C',  // primary brand green
            dark: '#164F38',
            light: '#2E8562',
          },
          mango: {
            DEFAULT: '#E8A33D',  // accent / CTA highlight
            dark: '#C9862A',
          },
          tomato: '#C1443B',     // discount badges / alerts
          line: '#DDD6C7',       // hairline borders on cream
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Karla"', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
      maxWidth: {
        content: '1240px',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
