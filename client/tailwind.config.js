/**
 * @FILE: tailwind.config.js
 * @RESPONSIBILITY: Tailwind CSS layout-first styling design system with Odoo-inspired color palettes and dense font scales.
 * @DEPENDENCIES: tailwindcss, autoprefixer.
 * @MODIFICATION_HOTSPOT: theme.extend color definitions and spacing scales.
 * @AUTHOR: Garima Mittal
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odoo: {
          primary: '#714B67',      // Signature Odoo deep plum/purple
          primaryHover: '#5B3B53',
          accent: '#00A09D',       // Signature Odoo teal accent
          accentHover: '#008784',
          surface: '#F8F9FA',      // Dense enterprise workspace background
          sidebar: '#2A2E33',      // Dark slate navigation rail
          sidebarActive: '#1F2226',
          border: '#E2E8F0',       // Crisp 1px structural table border
          header: '#FFFFFF',
          textMain: '#1E293B',
          textMuted: '#64748B'
        }
      },
      fontSize: {
        '2xs': '0.6875rem',       // 11px micro labels for dense Odoo tables
      }
    },
  },
  plugins: [],
}
