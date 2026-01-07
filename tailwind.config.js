/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: '#0A0A0A',
                surface: '#1A1A1A',
                'surface-light': '#2A2A2A',
                accent: {
                    DEFAULT: '#F97316',
                    hover: '#EA580C',
                },
                muted: '#888888',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
