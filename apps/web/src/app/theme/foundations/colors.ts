// Emerald ramp — the single brand color of the platform. Anchored on #10B981
// (the accent identity) with #059669 as the button-safe "deep" emerald. 50 =
// lightest, 900 = near-black forest. A messaging-gateway green that fits the
// Pombo mascot and the "communication" domain (WhatsApp lineage), tuned for
// contrast: white text sits on 600+, and 700 is the readable "green text".
const emerald = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981", // Emerald — the accent identity color
  600: "#059669", // Deep emerald — the primary button fill (light mode)
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
};

export const colors = {
  // `brand` and `accent` intentionally share ONE emerald ramp. The platform has
  // a single, confident green identity — `brand.*` carries the strong usages
  // (primary button, links, active nav) and `accent.*` the soft highlights
  // (subtle washes, stat cards); keeping them the same hue is what makes the UI
  // feel cohesive ("orna") instead of two-toned.
  brand: emerald,
  accent: emerald,
  // Faintly green-slate neutrals — a desaturated cool gray with a whisper of
  // emerald so surfaces, text and borders read as part of the same family
  // instead of a flat gray next to the green.
  neutral: {
    50: "#f5f7f6",
    100: "#e9edeb",
    200: "#d6deda",
    300: "#bcc7c1",
    400: "#8f9c96",
    500: "#647069",
    600: "#4a564f",
    700: "#39433d",
    800: "#262f2a",
    900: "#171d1a",
  },
  surface: {
    DEFAULT: "#ffffff",
    subtle: "#f5f7f6",
    muted: "#eef1f0",
  },
};
