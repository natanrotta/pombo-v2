import { Box, IconButton, useColorMode } from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

/** Light/dark theme switch. The icon shows the mode it switches TO. */
export const ColorModeToggle = () => {
  const { t } = useLocale();
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <IconButton
      aria-label={t("nav.tema")}
      data-cursor-label={t("nav.tema")}
      icon={<Box as={isDark ? Sun : Moon} fontSize="md" />}
      onClick={toggleColorMode}
      variant="ghost"
      h={9}
      w={9}
      minW={9}
      px={0}
      borderRadius="full"
      bg="transparent"
      color="text.secondary"
      _hover={{ bg: "bg.brand.subtle", color: "text.brand" }}
      _active={{ bg: "bg.brand.subtle" }}
    />
  );
};
