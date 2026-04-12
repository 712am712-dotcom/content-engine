export const aeBrand = {
  id: "ae",
  name: "Artificial Education",
  tagline: "The signal, not the noise.",
  colors: {
    background: "#0A0A0A",
    primary: "#00FF88",   // green
    secondary: "#FFFFFF",
    accent: "#00FF88",
  },
  fonts: {
    headline: "Inter",
    body: "Inter",
  },
  // ElevenLabs voice: Rachel — sharp, clear female
  voiceId: "21m00Tcm4TlvDq8ikWAM",
} as const;

export type AEBrand = typeof aeBrand;
