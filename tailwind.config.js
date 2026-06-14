/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f0faf7',
          100: '#d9f5ec',
          200: '#b3ead9',
          300: '#7dd8c2',
          400: '#44bda6',
          500: '#2b9e8a',
          600: '#1e8070',
          700: '#1a675a',
          800: '#185249',
          900: '#16443d',
        },
        lavender: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b7cdb',
          600: '#7c6fcd',
          700: '#6557b8',
          800: '#5343a0',
          900: '#453584',
        },
        coral: {
          50:  '#fff5f2',
          100: '#ffe8e1',
          200: '#ffcbb7',
          300: '#ffa285',
          400: '#f97350',
          500: '#e87557',
          600: '#c95a3d',
          700: '#a84530',
          800: '#883825',
          900: '#6d2e1e',
        },
        warm: {
          50:  '#faf9f7',
          100: '#f5f3f0',
          200: '#eceae5',
          300: '#d8d4cd',
          400: '#b5aea6',
          500: '#928b83',
          600: '#706c65',
          700: '#5a564f',
          800: '#3d3a35',
          900: '#1c1a17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'float':        'floatY 4s ease-in-out infinite',
        'card-in':      'cardEntrance 0.35s ease-out both',
        'pulse-gentle': 'pulseGently 3s ease-in-out infinite',
        'spin-slow':    'spinSlow 20s linear infinite',
        'gradient':     'gradientShift 6s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        cardEntrance: {
          from: { opacity: '0', transform: 'translateY(16px) scale(.98)' },
          to:   { opacity: '1', transform: 'translateY(0)    scale(1)'   },
        },
        pulseGently: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04)',
        'card-md':  '0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)',
        'card-lg':  '0 8px 24px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.06)',
        'sage':     '0 4px 14px rgba(43,158,138,.18)',
        'lavender': '0 4px 14px rgba(124,111,205,.18)',
        'coral':    '0 4px 14px rgba(232,117,87,.18)',
      },
    },
  },
  plugins: [],
}
