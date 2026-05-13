import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#152033",
        paper: "#fbfcff",
        line: "#d9e2ef",
        brand: {
          50: "#eef6ff",
          100: "#d8eaff",
          500: "#3067f0",
          600: "#244fd0",
          700: "#1e3fa8"
        },
        mint: {
          50: "#eafaf4",
          500: "#19a974",
          600: "#13865d"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 32, 51, 0.10)"
      }
    },
  },
  plugins: [],
};

export default config;
