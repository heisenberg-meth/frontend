/** @type {import('tailwindcss').Config} */
export const content = [
  "./index.html",
  "./src/**/*.{js,jsx,ts,tsx}"
];
export const theme = {
  extend: {
    colors: {
      background: "#0C1321",
      surface: "#151B2A",
      "surface-high": "#232A39",
      primary: "#6366F1",
      "primary-dim": "#C0C1FF",
      danger: "#EF4444",
      warning: "#F59E0B",
      success: "#22C55E",
    },
    fontFamily: {
      sans: ["Inter", "sans-serif"],
      display: ["Manrope", "sans-serif"],
    },
    borderRadius: {
      lg: "16px",
      md: "10px",
      sm: "8px",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },
  },
};
export const plugins = [];
