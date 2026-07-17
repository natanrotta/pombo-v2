import { Box, Flex, Text, Tooltip, useToast } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/modules/auth";
import { useErrorHandler } from "@/core/query/useErrorHandler";

const LANGUAGES = [
  { value: "pt-BR", flag: "🇧🇷" },
  { value: "en", flag: "🇺🇸" },
  { value: "es", flag: "🇪🇸" },
] as const;

// Render each language's name in its OWN language (e.g. "Português", "English",
// "Español") so the picker reads natively regardless of the active UI locale.
function getNativeName(locale: string): string {
  try {
    const display = new Intl.DisplayNames([locale], { type: "language" });
    const name = display.of(locale);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : locale;
  } catch {
    return locale;
  }
}

export function LanguageSelector() {
  const { i18n, t } = useTranslation("common");
  const { user, updateProfile } = useAuth();
  const { handleError } = useErrorHandler();
  const toast = useToast();
  const currentLanguage = i18n.language;

  async function handleChange(language: string) {
    if (language === currentLanguage) return;
    const selected = LANGUAGES.find((l) => l.value === language);
    const selectedLabel = selected ? getNativeName(selected.value) : language;
    await i18n.changeLanguage(language);

    toast({
      position: "bottom",
      duration: 2000,
      render: () => (
        <Flex
          align="center"
          gap={2.5}
          px={4}
          py={2.5}
          bg="bg.surface"
          borderRadius="full"
          shadow="lg"
          border="1px solid"
          borderColor="border.subtle"
          mx="auto"
          w="fit-content"
        >
          <Text fontSize="lg" lineHeight="1">
            {selected?.flag}
          </Text>
          <Text fontSize="sm" fontWeight="500" color="text.primary">
            {t("language.changed", { language: selectedLabel })}
          </Text>
        </Flex>
      ),
    });

    if (user) {
      try {
        await updateProfile({ language });
      } catch (error) {
        handleError(error);
      }
    }
  }

  return (
    <Flex
      align="center"
      bg="bg.sunken"
      borderRadius="full"
      border="1px solid"
      borderColor="border.default"
      p={0.5}
      gap={0}
    >
      {LANGUAGES.map((lang) => {
        const isActive = currentLanguage === lang.value;
        const label = getNativeName(lang.value);
        return (
          <Tooltip
            key={lang.value}
            label={label}
            fontSize="xs"
            fontWeight="500"
            bg="neutral.800"
            color="#ffffff"
            borderRadius="md"
            px={2.5}
            py={1}
            hasArrow
            openDelay={300}
          >
            <Flex
              as="button"
              align="center"
              justify="center"
              gap={1.5}
              px={isActive ? 3 : 2}
              py={1}
              borderRadius="full"
              cursor="pointer"
              bg={isActive ? "bg.surface" : "transparent"}
              shadow={isActive ? "sm" : "none"}
              border="1px solid"
              borderColor={isActive ? "border.default" : "transparent"}
              transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
              _hover={{
                bg: isActive ? "bg.surface" : "bg.sunken",
              }}
              onClick={() => handleChange(lang.value)}
            >
              <Text fontSize="sm" lineHeight="1">
                {lang.flag}
              </Text>
              {isActive && (
                <Box overflow="hidden">
                  <Text fontSize="xs" fontWeight="600" color="text.primary" whiteSpace="nowrap">
                    {label}
                  </Text>
                </Box>
              )}
            </Flex>
          </Tooltip>
        );
      })}
    </Flex>
  );
}
