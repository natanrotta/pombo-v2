export const PRESET_COLORS = [
  "#E53E3E",
  "#C53030",
  "#DD6B20",
  "#ED8936",
  "#D69E2E",
  "#ECC94B",
  "#38A169",
  "#48BB78",
  "#319795",
  "#4FD1C5",
  "#3182CE",
  "#63B3ED",
  "#805AD5",
  "#B794F4",
  "#D53F8C",
  "#ED64A6",
];

// Fallback color rendered when an entity (e.g. a tag) was created without an
// explicit color. Kept neutral (cool gray) so it doesn't compete with any of
// the PRESET_COLORS above. Used as the default in repository → entity mappers
// — components themselves should rely on this constant rather than rebuild a
// fallback locally.
//
// F-C2 (no hardcoded hex) does not apply here: this file is the canonical
// palette source consumed by the ColorPicker swatches and by data-mappers
// that need a string color for entities created without one — it is not a
// JSX `color`/`bg` prop site. Changing this value also changes the theme.
export const DEFAULT_TAG_COLOR = "#A0AEC0";
