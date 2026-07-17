import { tabsAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(
  tabsAnatomy.keys
);

const softLine = definePartsStyle({
  tablist: {
    // position: relative makes the tablist the containing block for the
    // <TabIndicator>, which is rendered INSIDE it. The indicator then shares
    // the tablist's scroll context, so it stays aligned when the list overflows
    // and scrolls horizontally (useTabIndicator measures tab.offsetLeft, which
    // is relative to this positioned ancestor).
    position: "relative",
    borderBottom: "1px solid",
    borderColor: "border.subtle",
    gap: 1,
  },
  tab: {
    fontWeight: "500",
    fontSize: "sm",
    color: "text.secondary",
    px: 4,
    py: 2.5,
    transition: "color 0.18s ease",
    _selected: {
      color: "text.brand",
      fontWeight: "600",
    },
    _hover: {
      color: "text.primary",
    },
  },
  // The sliding underline. Chakra's useTabIndicator supplies the inline
  // position:absolute + left/width + slide transition; these supply the look.
  // `text.brand` keeps the underline matched to the active label in light AND
  // dark. `bottom: -1px` anchors it onto the 1px tablist rail (robust inside the
  // flex tablist, where relying on margin + static position would be fragile).
  indicator: {
    height: "2px",
    bg: "text.brand",
    borderRadius: "full",
    bottom: "-1px",
  },
  tabpanel: {
    px: 0,
    pt: 5,
  },
});

export const Tabs = defineMultiStyleConfig({
  variants: {
    "soft-line": softLine,
  },
});
