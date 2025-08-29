import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Retro cream palette - exact HSL values from design
        cream: "hsl(48, 100%, 93%)",
        butter: "hsl(45, 88%, 77%)", 
        mango: "hsl(35, 88%, 68%)",
        cocoa: "hsl(25, 30%, 33%)",
        coffee: "hsl(28, 37%, 39%)",
        ink: "hsl(25, 21%, 20%)",
        muted: "hsl(25, 14%, 53%)",
        card: "hsl(45, 90%, 95%)",
        stroke: "hsl(35, 48%, 89%)",
        
        // Standard Tailwind overrides to match retro theme
        background: "hsl(48, 100%, 93%)",
        foreground: "hsl(25, 21%, 20%)",
        'card-bg': {
          DEFAULT: "hsl(45, 90%, 95%)",
          foreground: "hsl(25, 21%, 20%)",
        },
        popover: {
          DEFAULT: "hsl(45, 90%, 95%)",
          foreground: "hsl(25, 21%, 20%)",
        },
        primary: {
          DEFAULT: "hsl(35, 88%, 68%)",
          foreground: "hsl(25, 30%, 15%)",
        },
        secondary: {
          DEFAULT: "hsl(45, 88%, 77%)",
          foreground: "hsl(25, 30%, 33%)",
        },
        'muted-bg': {
          DEFAULT: "hsl(35, 20%, 92%)",
          foreground: "hsl(25, 14%, 53%)",
        },
        accent: {
          DEFAULT: "hsl(45, 88%, 77%)",
          foreground: "hsl(25, 30%, 33%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        border: "hsl(35, 48%, 89%)",
        input: "hsl(45, 90%, 95%)",
        ring: "hsl(35, 88%, 68%)",
        chart: {
          "1": "hsl(35, 88%, 68%)",
          "2": "hsl(159, 100%, 36%)",
          "3": "hsl(42, 93%, 56%)",
          "4": "hsl(147, 79%, 42%)",
          "5": "hsl(341, 75%, 51%)",
        },
        sidebar: {
          DEFAULT: "hsl(45, 90%, 95%)",
          foreground: "hsl(25, 21%, 20%)",
          primary: "hsl(35, 88%, 68%)",
          "primary-foreground": "hsl(25, 30%, 15%)",
          accent: "hsl(45, 88%, 77%)",
          "accent-foreground": "hsl(25, 30%, 33%)",
          border: "hsl(35, 48%, 89%)",
          ring: "hsl(35, 88%, 68%)",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "Noto Sans KR", "sans-serif"],
        brand: ["Quicksand", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
        mono: ["Menlo", "monospace"],
      },
      borderRadius: {
        lg: "22px",
        md: "18px", 
        sm: "14px",
        pill: "999px",
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        pulse: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        loading: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s infinite",
        loading: "loading 1.5s infinite",
      },
      boxShadow: {
        retro: "0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)",
        "retro-lg": "0 8px 15px -3px rgba(94, 50, 40, 0.15), 0 4px 6px -2px rgba(94, 50, 40, 0.05)",
        "retro-xl": "0 10px 20px -5px rgba(244, 182, 97, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      gradients: {
        vinyl: "radial-gradient(circle at center, #d9c2a8 0 10px, #4f3d2f 11px 12px, #6b5442 13px 100%)",
        avatar: "linear-gradient(145deg, #d9c0a2, #fff)",
        fab: "linear-gradient(180deg, #F7D58C, #F4B661)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    function({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.vinyl': {
          'border-radius': '50%',
          'background': 'radial-gradient(circle at center, #d9c2a8 0 10px, #4f3d2f 11px 12px, #6b5442 13px 100%)',
          'position': 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            background: '#5C4433',
            'border-radius': '50%',
          }
        },
        '.soft-card': {
          'background': 'hsl(45, 90%, 95%)',
          'border': '1px solid hsl(35, 48%, 89%)',
          'border-radius': '22px',
          'box-shadow': '0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 8px 15px -3px rgba(94, 50, 40, 0.15), 0 4px 6px -2px rgba(94, 50, 40, 0.05)',
          }
        },
        '.btn-mango': {
          'background': 'hsl(35, 88%, 68%)',
          'color': 'hsl(25, 30%, 15%)',
          'border': '0',
          'font-weight': '700',
          'transition': 'all 0.3s ease',
          'border-radius': '12px',
          'padding': '0.75rem 1.5rem',
          '&:hover': {
            'background': 'hsl(35, 88%, 62%)',
            'color': 'hsl(25, 30%, 10%)',
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)',
          }
        },
        '.pill': {
          'padding': '0.45rem 0.9rem',
          'border-radius': '999px',
          'background': 'hsl(45, 90%, 92%)',
          'border': '1px solid hsl(35, 48%, 89%)',
          'display': 'inline-flex',
          'align-items': 'center',
          'gap': '0.35rem',
          'transition': 'all 0.3s ease',
          'cursor': 'pointer',
          'font-size': '0.875rem',
          'font-weight': '500',
          '&:hover': {
            'background': 'hsl(45, 88%, 77%)',
            'border-color': 'hsl(35, 88%, 68%)',
          },
          '&.active': {
            'background': 'hsl(35, 88%, 68%)',
            'color': 'hsl(25, 30%, 15%)',
            'border-color': 'transparent',
          }
        },
        '.appbar': {
          'backdrop-filter': 'blur(12px)',
          'background': 'hsla(48, 100%, 93%, 0.95)',
          'border-bottom': '1px solid hsl(35, 48%, 89%)',
          'transition': 'background 0.3s ease',
        },
        '.tabbar': {
          'position': 'fixed',
          'bottom': '0',
          'left': '0',
          'right': '0',
          'z-index': '1040',
          'background': 'hsla(48, 100%, 93%, 0.98)',
          'border-top': '1px solid hsl(35, 48%, 89%)',
          'backdrop-filter': 'blur(12px)',
        },
        '.fab': {
          'position': 'fixed',
          'right': '16px',
          'bottom': '86px',
          'z-index': '1050',
          'width': '58px',
          'height': '58px',
          'border-radius': '999px',
          'background': 'linear-gradient(180deg, #F7D58C, #F4B661)',
          'color': 'hsl(25, 30%, 15%)',
          'border': '0',
          'transition': 'all 0.3s ease',
          'box-shadow': '0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          '&:hover': {
            'transform': 'scale(1.1)',
            'box-shadow': '0 10px 20px -5px rgba(244, 182, 97, 0.4)',
          }
        },
        '.wave-corner': {
          'position': 'absolute',
          'bottom': '0',
          'left': '0',
          'width': '100%',
          'height': '140px',
          'pointer-events': 'none',
          '&.top': {
            'top': '0',
            'bottom': 'auto',
          }
        }
      })
    }
  ],
} satisfies Config;
