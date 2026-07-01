import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#f7f6f2",
        line: "#dedbd3",
        sage: "#6f826a",
        clay: "#b96f5a",
        blue: "#365a8c"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(21, 21, 21, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
