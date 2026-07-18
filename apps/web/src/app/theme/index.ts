import { extendTheme, type ThemeConfig } from "@chakra-ui/react";
import { mode, type GlobalStyleProps } from "@chakra-ui/theme-tools";
import { Badge } from "@/app/theme/components/badge";
import { Button } from "@/app/theme/components/button";
import { Input } from "@/app/theme/components/input";
import { Menu } from "@/app/theme/components/menu";
import { NumberInput } from "@/app/theme/components/number-input";
import { Modal } from "@/app/theme/components/modal";
import { Popover } from "@/app/theme/components/popover";
import { Select } from "@/app/theme/components/select";
import { Tabs } from "@/app/theme/components/tabs";
import { Textarea } from "@/app/theme/components/textarea";
import { colors } from "@/app/theme/foundations/colors";
import { fonts } from "@/app/theme/foundations/typography";
import { radii } from "@/app/theme/foundations/radii";
import { shadows } from "@/app/theme/foundations/shadows";
import { semanticTokens } from "@/app/theme/foundations/semantic-tokens";
import { textStyles } from "@/app/theme/foundations/text-styles";

export const COLOR_MODE_STORAGE_KEY = "pombo-color-mode";

// Respect the user's OS preference on the very first visit, then persist the
// explicit choice via localStorage. `useSystemColorMode: false` intentionally
// disables live syncing with OS changes — once the user toggles, that choice
// sticks until they toggle again.
const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  radii,
  shadows,
  semanticTokens,
  textStyles,
  styles: {
    global: (props: GlobalStyleProps) => ({
      body: {
        bg: "bg.canvas",
        color: "text.primary",
        fontSize: "sm",
        minH: "100vh",
        // Dark mode keeps a single, very subtle brand wash to give the canvas
        // some life without competing with content. The accent radial that
        // existed before doubled the noise on a slate background, so it's
        // dropped in dark mode and only kept (faintly) in light mode.
        backgroundImage: mode(
          "radial-gradient(ellipse 60% 40% at 10% -10%, rgba(107, 101, 96, 0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 90% 5%, rgba(30, 178, 138, 0.04) 0%, transparent 55%)",
          "radial-gradient(ellipse 70% 50% at 12% -10%, rgba(195, 188, 181, 0.04) 0%, transparent 65%)"
        )(props),
      },
      "*::placeholder": {
        color: "text.muted",
      },
      ".rich-text-editor .ProseMirror": {
        outline: "none",
        minH: "120px",
        px: 4,
        py: 3,
        fontSize: "sm",
        lineHeight: 1.6,
        color: "text.primary",
      },
      ".rich-text-editor .ProseMirror p.is-editor-empty:first-of-type::before": {
        content: "attr(data-placeholder)",
        float: "left",
        color: "text.muted",
        pointerEvents: "none",
        height: 0,
      },
      ".rich-text-editor .ProseMirror h2": {
        fontSize: "1.15em",
        fontWeight: 700,
        margin: "0.8em 0 0.4em",
      },
      ".rich-text-editor .ProseMirror h3": {
        fontSize: "1.05em",
        fontWeight: 600,
        margin: "0.6em 0 0.3em",
      },
      ".rich-text-editor .ProseMirror ul, .rich-text-editor .ProseMirror ol": {
        paddingLeft: "1.4em",
        margin: "0.4em 0",
      },
      ".rich-text-editor .ProseMirror li": {
        margin: "0.15em 0",
      },
      ".rich-text-editor .ProseMirror blockquote": {
        borderLeft: "3px solid",
        borderColor: "border.default",
        paddingLeft: 3,
        margin: "0.5em 0",
        color: "text.secondary",
      },
      ".rich-text-editor .ProseMirror code": {
        bg: "bg.muted",
        px: 1,
        borderRadius: "3px",
        fontSize: "0.9em",
      },
      ".rich-text-editor .ProseMirror p": {
        margin: "0.25em 0",
      },
      ".rich-text-viewer": {
        fontSize: "sm",
        lineHeight: 1.6,
        color: "text.secondary",
      },
      ".rich-text-viewer h2": {
        fontSize: "1.15em",
        fontWeight: 700,
        margin: "0.8em 0 0.4em",
        color: "text.primary",
      },
      ".rich-text-viewer h3": {
        fontSize: "1.05em",
        fontWeight: 600,
        margin: "0.6em 0 0.3em",
        color: "text.primary",
      },
      ".rich-text-viewer ul, .rich-text-viewer ol": {
        paddingLeft: "1.4em",
        margin: "0.4em 0",
      },
      ".rich-text-viewer li": {
        margin: "0.15em 0",
      },
      ".rich-text-viewer blockquote": {
        borderLeft: "3px solid",
        borderColor: "border.default",
        paddingLeft: 3,
        margin: "0.5em 0",
        color: "text.muted",
      },
      ".rich-text-viewer code": {
        bg: "bg.muted",
        px: 1,
        borderRadius: "3px",
        fontSize: "0.9em",
      },
      ".rich-text-viewer p": {
        margin: "0.25em 0",
      },
    }),
  },
  components: {
    Badge,
    Button,
    FormError: {
      baseStyle: {
        text: {
          fontSize: "xs",
          fontWeight: "500",
          color: "status.error.fg",
          mt: 1.5,
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: "xs",
        fontWeight: "600",
        color: "text.secondary",
        mb: 1,
        letterSpacing: "0.01em",
      },
    },
    Input,
    Menu,
    Modal,
    NumberInput,
    Popover,
    Select,
    Tabs,
    Textarea,
  },
});
