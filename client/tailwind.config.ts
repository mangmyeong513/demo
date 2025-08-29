import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Retro cream palette - exact HSL values from design reference
        cream: "hsl(48, 100%, 93%)", // #FFF5DF
        butter: "hsl(45, 88%, 77%)", // #F7D58C  
        mango: "hsl(35, 88%, 68%)", // #F4B661
        cocoa: "hsl(25, 30%, 33%)", // #5C4433
        coffee: "hsl(28, 37%, 39%)", // #8A5E3C
        ink: "hsl(25, 21%, 20%)", // #3E3228
        muted: "hsl(25, 14%, 53%)", // #8E7C6A
        card: "hsl(45, 90%, 95%)", // #FFF9EB
        stroke: "hsl(35, 48%, 89%)", // #F0E2C9
        
        // Standard Tailwind overrides to match retro theme exactly
        background: "hsl(48, 100%, 93%)", // var(--cream)
        foreground: "hsl(25, 21%, 20%)", // var(--ink)
        'card-bg': {
          DEFAULT: "hsl(45, 90%, 95%)", // var(--card)
          foreground: "hsl(25, 21%, 20%)", // var(--ink)
        },
        popover: {
          DEFAULT: "hsl(45, 90%, 95%)", // var(--card)
          foreground: "hsl(25, 21%, 20%)", // var(--ink)
        },
        primary: {
          DEFAULT: "hsl(35, 88%, 68%)", // var(--mango)
          foreground: "hsl(25, 30%, 15%)", // #3c2b1f from design
        },
        secondary: {
          DEFAULT: "hsl(45, 88%, 77%)", // var(--butter)
          foreground: "hsl(25, 30%, 33%)", // var(--cocoa)
        },
        'muted-bg': {
          DEFAULT: "hsl(45, 90%, 92%)", // #fff2d5 from pills
          foreground: "hsl(25, 14%, 53%)", // var(--muted)
        },
        accent: {
          DEFAULT: "hsl(45, 88%, 77%)", // var(--butter)
          foreground: "hsl(25, 30%, 33%)", // var(--cocoa)
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)", // #e74c3c from design
          foreground: "hsl(0, 0%, 98%)",
        },
        border: "hsl(35, 48%, 89%)", // var(--stroke)
        input: "hsl(45, 90%, 95%)", // var(--card)
        ring: "hsl(35, 88%, 68%)", // var(--mango)
        chart: {
          "1": "hsl(35, 88%, 68%)", // var(--mango)
          "2": "hsl(159, 100%, 36%)",
          "3": "hsl(42, 93%, 56%)",
          "4": "hsl(147, 79%, 42%)",
          "5": "hsl(341, 75%, 51%)",
        },
        sidebar: {
          DEFAULT: "hsl(45, 90%, 95%)", // var(--card)
          foreground: "hsl(25, 21%, 20%)", // var(--ink)
          primary: "hsl(35, 88%, 68%)", // var(--mango)
          "primary-foreground": "hsl(25, 30%, 15%)",
          accent: "hsl(45, 88%, 77%)", // var(--butter)
          "accent-foreground": "hsl(25, 30%, 33%)", // var(--cocoa)
          border: "hsl(35, 48%, 89%)", // var(--stroke)
          ring: "hsl(35, 88%, 68%)", // var(--mango)
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "Noto Sans KR", "sans-serif"],
        brand: ["Quicksand", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
        mono: ["Menlo", "monospace"],
      },
      borderRadius: {
        lg: "22px", // var(--radius) from design
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
      backgroundImage: {
        'vinyl': 'radial-gradient(circle at center, #d9c2a8 0 10px, #4f3d2f 11px 12px, #6b5442 13px 100%)',
        'avatar': 'linear-gradient(145deg, #d9c0a2, #fff)',
        'fab': 'linear-gradient(180deg, #F7D58C, #F4B661)',
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
          'background': '#FFF9EB', // var(--card)
          'border': '1px solid #F0E2C9', // var(--stroke)  
          'border-radius': '22px', // var(--radius)
          'box-shadow': '0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 8px 15px -3px rgba(94, 50, 40, 0.15), 0 4px 6px -2px rgba(94, 50, 40, 0.05)',
          }
        },
        '.btn-mango': {
          'background': '#F4B661', // var(--mango)
          'color': '#3c2b1f', // exact from design
          'border': '0',
          'font-weight': '700',
          'transition': 'all 0.3s ease',
          'border-radius': '12px',
          'padding': '0.75rem 1.5rem',
          '&:hover': {
            'background': '#f2a44a', // exact from design
            'color': '#2e2119', // exact from design
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)',
          }
        },
        '.btn-outline-mango': {
          'background': 'transparent',
          'color': '#F4B661', // var(--mango)
          'border': '2px solid #F4B661', // var(--mango)
          'transition': 'all 0.3s ease',
          'border-radius': '12px',
          'padding': '0.75rem 1.5rem',
          'font-weight': '600',
          '&:hover': {
            'background': '#F4B661', // var(--mango)
            'color': '#3c2b1f',
          }
        },
        '.btn-ghost': {
          'background': 'transparent',
          'border': '1px solid #F0E2C9', // var(--stroke)
          'transition': 'all 0.3s ease',
          'border-radius': '12px',
          'padding': '0.5rem 1rem',
          '&:hover': {
            'background': '#F7D58C', // var(--butter)
            'border-color': '#F4B661', // var(--mango)
          }
        },
        '.pill': {
          'padding': '0.45rem 0.9rem',
          'border-radius': '999px',
          'background': '#fff2d5', // exact from design
          'border': '1px solid #F0E2C9', // var(--stroke)
          'display': 'inline-flex',
          'align-items': 'center',
          'gap': '0.35rem',
          'transition': 'all 0.3s ease',
          'cursor': 'pointer',
          'font-size': '0.875rem',
          'font-weight': '500',
          '&:hover': {
            'background': '#F7D58C', // var(--butter)
            'border-color': '#F4B661', // var(--mango)
          },
          '&.active': {
            'background': '#F4B661', // var(--mango)
            'color': '#3c2b1f', // exact from design
            'border-color': 'transparent',
          }
        },
        '.appbar': {
          'backdrop-filter': 'blur(12px)',
          'background': 'rgba(255, 245, 223, 0.95)', // rgba version of cream
          'border-bottom': '1px solid #F0E2C9', // var(--stroke)
          'transition': 'background 0.3s ease',
        },
        '.tabbar': {
          'position': 'fixed',
          'bottom': '0',
          'left': '0',
          'right': '0',
          'z-index': '1040',
          'background': 'rgba(255, 245, 223, 0.98)', // rgba version of cream
          'border-top': '1px solid #F0E2C9', // var(--stroke)
          'backdrop-filter': 'blur(12px)',
        },
        '.tab': {
          'padding': '0.55rem 0',
          'color': '#8E7C6A', // var(--muted)
          'transition': 'all 0.3s ease',
          'cursor': 'pointer',
          'display': 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'gap': '0.25rem',
          '&.active': {
            'color': '#3E3228', // var(--ink)
          },
          '&:hover': {
            'color': '#F4B661', // var(--mango)
          }
        },
        '.fab': {
          'position': 'fixed',
          'right': '16px',
          'bottom': '86px',
          'z-index': '1050',
          'width': '58px',
          'height': '58px',
          'border-radius': '999px',
          'background': 'linear-gradient(180deg, #F7D58C, #F4B661)', // exact from design
          'color': '#3b2a20', // exact from design
          'border': '0',
          'transition': 'all 0.3s ease',
          'box-shadow': '0 4px 6px -1px rgba(94, 50, 40, 0.1), 0 2px 4px -1px rgba(94, 50, 40, 0.06)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          '&:hover': {
            'transform': 'scale(1.1)',
            'box-shadow': '0 10px 20px -5px rgba(244, 182, 97, 0.4)', // exact from design
          }
        },
        '.avatar': {
          'width': '42px',
          'height': '42px',
          'border-radius': '50%',
          'background': 'linear-gradient(145deg, #d9c0a2, #fff)', // exact from design
          'border': '1px solid #F0E2C9', // var(--stroke)
          'transition': 'all 0.3s ease',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'position': 'relative',
          '&:hover': {
            'transform': 'scale(1.05)',
          }
        },
        '.avatar-lg': {
          'width': '64px',
          'height': '64px',
          'border-radius': '50%',
          'background': 'linear-gradient(145deg, #d9c0a2, #fff)', // exact from design
          'border': '2px solid #F0E2C9', // var(--stroke)
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
        },
        '.post-actions': {
          'display': 'flex',
          'gap': '1rem',
          'padding-top': '1rem',
          'border-top': '1px solid #F0E2C9', // var(--stroke)
          'margin-top': '1rem',
        },
        '.action-btn': {
          'background': 'none',
          'border': 'none',
          'color': '#8E7C6A', // var(--muted)
          'display': 'flex',
          'align-items': 'center',
          'gap': '0.5rem',
          'padding': '0.5rem',
          'border-radius': '8px',
          'transition': 'all 0.3s ease',
          'cursor': 'pointer',
          'font-size': '0.875rem',
          '&:hover': {
            'background': '#F7D58C', // var(--butter)
            'color': '#3E3228', // var(--ink)
          },
          '&.liked': {
            'color': '#e74c3c', // exact from design
          },
          '&.bookmarked': {
            'color': '#F4B661', // var(--mango)
          }
        },
        '.form-control': {
          'background': '#FFF9EB', // var(--card)
          'border': '1px solid #F0E2C9', // var(--stroke)
          'border-radius': '12px',
          'padding': '0.75rem 1rem',
          'transition': 'all 0.3s ease',
          'font-size': '1rem',
          '&:focus': {
            'border-color': '#F4B661', // var(--mango)
            'box-shadow': '0 0 0 0.2rem rgba(244, 182, 97, 0.25)', // mango with opacity
            'background': '#fff',
            'outline': 'none',
          }
        },
        '.mini': {
          'font-size': '0.9rem',
          'color': '#8E7C6A', // var(--muted)
        },
        '.brand': {
          'font-weight': '800',
          'letter-spacing': '0.5px',
          'font-family': 'Quicksand, sans-serif',
          '& .accent': {
            'color': '#F4B661', // var(--mango)
            'font-style': 'normal',
          }
        },
        '.skeleton': {
          'background': 'linear-gradient(90deg, #F0E2C9 25%, transparent 50%, #F0E2C9 75%)', // var(--stroke)
          'background-size': '200% 100%',
          'animation': 'loading 1.5s infinite',
          'border-radius': '8px',
        },
        '.notification-badge': {
          'position': 'absolute',
          'top': '-5px',
          'right': '-5px',
          'background': '#e74c3c', // exact from design
          'color': 'white',
          'border-radius': '50%',
          'width': '20px',
          'height': '20px',
          'font-size': '0.7rem',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'animation': 'pulse 2s infinite',
        },
        // Responsive layout from design
        '@media (min-width: 992px)': {
          '.shell': {
            'display': 'grid',
            'grid-template-columns': '260px minmax(0, 720px) 340px',
            'gap': '20px',
          },
          '.left-rail, .right-rail': {
            'position': 'sticky',
            'top': '82px',
            'align-self': 'start',
          },
          '.tabbar, .fab': {
            'display': 'none',
          }
        }
      })
    }
  ],
} satisfies Config;
