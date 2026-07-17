import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import type { GlobalStyleProps } from "@chakra-ui/theme-tools";
import { mode } from "@chakra-ui/theme-tools";
import { Button } from "@/theme/components/button";
import { colors } from "@/theme/foundations/colors";
import { fonts, fontSizes, letterSpacings } from "@/theme/foundations/typography";
import { radii } from "@/theme/foundations/radii";
import { semanticTokens } from "@/theme/foundations/semantic-tokens";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  letterSpacings,
  radii,
  semanticTokens,
  styles: {
    global: (props: GlobalStyleProps) => ({
      "html, body": {
        bg: "bg.canvas",
        color: "text.primary",
        scrollBehavior: "smooth",
      },
      body: {
        fontSize: "md",
        minH: "100vh",
        backgroundImage: mode(
          "radial-gradient(ellipse 70% 55% at 10% -5%, rgba(47, 128, 237, 0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 95% 8%, rgba(30, 178, 138, 0.09) 0%, transparent 55%)",
          "radial-gradient(ellipse 80% 60% at 12% -8%, rgba(95, 161, 255, 0.08) 0%, transparent 65%), radial-gradient(ellipse 65% 45% at 90% 5%, rgba(50, 200, 159, 0.06) 0%, transparent 60%)"
        )(props),
        backgroundAttachment: "fixed",
      },
      "::selection": {
        bg: "bg.brand.subtle",
        color: "text.brand",
      },
      "*::-webkit-scrollbar": {
        width: "10px",
        height: "10px",
      },
      "*::-webkit-scrollbar-track": {
        bg: "transparent",
      },
      "*::-webkit-scrollbar-thumb": {
        bg: "border.default",
        borderRadius: "full",
      },
      "*::-webkit-scrollbar-thumb:hover": {
        bg: "border.strong",
      },
    }),
  },
  components: {
    Button,
  },
});
