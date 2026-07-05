/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",        // near-black navy background
        surface: "#101A2C",    // panel surface
        surface2: "#16223A",   // raised panel
        line: "#243350",       // hairline borders
        pulse: "#FF4D5E",      // vital-sign red — emergency/critical accent
        vital: "#2FE6C4",      // ECG-line teal — primary accent / "healthy" signal
        amber: "#F5B942",      // caution / manual review
        mist: "#8CA0C4",       // muted text
        paper: "#EAF0FB",      // primary text on dark
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(47,230,196,0.25), 0 0 24px rgba(47,230,196,0.15)",
        "glow-pulse": "0 0 0 1px rgba(255,77,94,0.25), 0 0 24px rgba(255,77,94,0.15)",
        premium: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.6)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(at 15% 0%, rgba(47,230,196,0.16) 0px, transparent 55%), radial-gradient(at 85% 15%, rgba(255,77,94,0.12) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(245,185,66,0.08) 0px, transparent 55%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "spin-slow": "spin-slow 14s linear infinite",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
