// The Intelligent Bistro — Design System
// Aesthetic: Upscale dark bistro — warm candlelight golds on deep espresso blacks
// Font mood: Refined editorial meets modern warmth

export const Colors = {
  // Core palette
  bg: "#0A0705", // Deep espresso black
  bgCard: "#120E0A", // Card surface
  bgElevated: "#1C1510", // Elevated surfaces
  bgSheet: "#16110D", // Bottom sheets

  // Gold accent system
  gold: "#C9933A", // Primary gold
  goldLight: "#E4B86A", // Light gold / highlights
  goldDim: "#7A5820", // Muted gold for bg accents
  goldGlow: "rgba(201, 147, 58, 0.15)", // Glow effect

  // Text
  textPrimary: "#F5EDD8", // Warm cream white
  textSecondary: "#9C8B72", // Warm muted
  textDim: "#5C4F3D", // Very muted

  // Status
  success: "#4CAF7D",
  error: "#E06B6B",
  spicy: "#E85D3A",

  // Borders
  border: "rgba(201, 147, 58, 0.2)",
  borderSubtle: "rgba(245, 237, 216, 0.07)",

  // Chat bubbles
  userBubble: "#C9933A",
  aiBubble: "#1C1510",
};

export const Fonts = {
  // Display / Hero text — elegant serif
  display: "PlayfairDisplay_700Bold",
  displayMedium: "PlayfairDisplay_500Medium",
  displayItalic: "PlayfairDisplay_400Regular_Italic",

  // Body — clean modern sans
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemiBold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadows = {
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
};

// API config — update this to point to your backend
// export const API_URL = 'http://localhost:3001';
// For physical device testing, use your machine's local IP:
export const API_URL = "http://10.23.29.150:3001";
