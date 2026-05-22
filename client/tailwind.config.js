/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          gold: '#F5A623',
          purple: '#9B59B6',
          red: '#EF4444',
          emerald: '#22C55E',
          navy: '#0d0d1a',
          'navy-deep': '#1a0d2e',
          metal: '#2A2A35',
          'metal-dark': '#1C1C24'
        }
      },
      backgroundImage: {
        'carbon-fiber': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%2311111a' d='M0 0h4v4H0zM4 4h4v4H4z'/%3E%3Cpath fill='%23161622' d='M4 0h4v4H4zM0 4h4v4H0z'/%3E%3C/svg%3E\")",
        'brushed-metal': "linear-gradient(135deg, #2A2A35 0%, #3A3A4A 25%, #2A2A35 50%, #4A4A5A 75%, #2A2A35 100%)",
        'metallic-gold': "linear-gradient(180deg, #FFE177 0%, #F5A623 50%, #B8780B 100%)",
        'metallic-red': "linear-gradient(180deg, #FF6B6B 0%, #EF4444 50%, #991B1B 100%)",
      },
      boxShadow: {
        'hardware-btn': '0 8px 0 #05050A, 0 15px 20px rgba(0,0,0,0.5)',
        'hardware-btn-active': '0 2px 0 #05050A, 0 4px 6px rgba(0,0,0,0.5)',
        'panel-heavy': '0 20px 40px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.6)',
        'inner-hole': 'inset 0 4px 8px rgba(0,0,0,0.8), inset 0 -1px 1px rgba(255,255,255,0.08)',
        glow: '0 0 32px rgba(245, 158, 11, 0.22)',
        'glow-gold': '0 0 28px rgba(245, 166, 35, 0.3)',
        'glow-purple': '0 0 28px rgba(155, 89, 182, 0.3)',
        'glow-red': '0 0 28px rgba(239, 68, 68, 0.4)',
        'glow-emerald': '0 0 28px rgba(34, 197, 94, 0.3)',
        'neon-gold': '0 0 42px rgba(245, 166, 35, 0.4), 0 0 80px rgba(245, 166, 35, 0.15)',
        'neon-red': '0 0 42px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.2)'
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'illustration-float 6s ease-in-out infinite',
        'slide-in': 'slide-in-up 500ms cubic-bezier(0.2, 0.9, 0.3, 1.15)',
        'fade-in': 'fade-in 400ms ease-out',
        'glitch': 'glitch-anim 0.3s cubic-bezier(.25, .46, .45, .94) both infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite both'
      }
    }
  },
  plugins: []
};
