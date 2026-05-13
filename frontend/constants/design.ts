export const Colors = {
  // Core palette
  bg: "#0A0705",
  bgCard: "#120E0A",
  bgElevated: "#1C1510",
  bgSheet: "#16110D",

  gold: "#C9933A",
  goldLight: "#E4B86A",
  goldDim: "#7A5820",
  goldGlow: "rgba(201, 147, 58, 0.15)",

  textPrimary: "#F5EDD8",
  textSecondary: "#9C8B72",
  textDim: "#5C4F3D",

  success: "#4CAF7D",
  error: "#E06B6B",
  spicy: "#E85D3A",

  border: "rgba(201, 147, 58, 0.2)",
  borderSubtle: "rgba(245, 237, 216, 0.07)",

  userBubble: "#C9933A",
  aiBubble: "#1C1510",
};

export const Fonts = {
  display: "PlayfairDisplay_700Bold",
  displayMedium: "PlayfairDisplay_500Medium",
  displayItalic: "PlayfairDisplay_400Regular_Italic",

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
