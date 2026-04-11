export const mfdBrand = {
  id: "mfd",
  name: "Markets for Dummies",
  tagline: "Wall Street, translated.",
  colors: {
    background: "#0A0A0A",
    primary: "#F5C518",   // gold
    secondary: "#FFFFFF",
    accent: "#F5C518",
  },
  fonts: {
    headline: "Inter",
    body: "Inter",
  },
} as const;

export type MFDBrand = typeof mfdBrand;
