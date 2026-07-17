import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { FiInstagram } from "react-icons/fi";
import { BrandMark } from "@/components/BrandMark";
import { SiteContainer } from "@/components/Container";
import { PLATFORM_URL } from "@/content/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useSiteNavigation } from "@/hooks/useSiteNavigation";

// Placeholder contact details — swap for your own.
const CONTACT_EMAIL = "hello@example.com";
const INSTAGRAM_URL = "https://www.instagram.com/";
// Placeholder WhatsApp number in E.164 without the leading "+" (wa.me format).
const SUPPORT_WHATSAPP_NUMBER = "15550000000";

const NAV_IDS = ["problema", "modulos", "planos"] as const;

const LEGAL_LINKS = [
  { key: "termos", to: "/termos" },
  { key: "privacidade", to: "/privacidade" },
] as const;

export const Footer = () => {
  const { t } = useLocale();
  const { goTo: goToSection } = useSiteNavigation();

  // Opens WhatsApp in a new tab with a pre-filled message — same pattern as the
  // app's support FAB, but with a generic site-visitor message (no account code).
  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("footer.whatsappMessage")
  )}`;

  return (
    <Box
      as="footer"
      position="relative"
      overflow="hidden"
      bg="bg.sunken"
      pt={{ base: 16, md: 20 }}
      pb={10}
    >
      {/* top gradient accent */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="2px"
        bgGradient="linear(to-r, transparent, brand.500, accent.500, transparent)"
        opacity={0.7}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="-50%"
        left="50%"
        transform="translateX(-50%)"
        w="760px"
        h="420px"
        borderRadius="full"
        bgGradient="radial(ellipse, rgba(47, 128, 237, 0.07), transparent 60%)"
        pointerEvents="none"
      />

      <SiteContainer position="relative">
        <SimpleGrid columns={{ base: 1, md: 12 }} gap={{ base: 10, md: 12 }}>
          {/* Brand */}
          <Stack spacing={5} gridColumn={{ md: "span 5" }} maxW="420px">
            <BrandMark />
            <Text color="text.secondary" fontSize="sm" lineHeight="1.7">
              {t("footer.tagline")}
            </Text>
            <HStack spacing={3}>
              <Link
                href={INSTAGRAM_URL}
                isExternal
                aria-label="Instagram"
                data-cursor-label="Instagram"
                w={10}
                h={10}
                borderRadius="full"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                color="text.secondary"
                display="grid"
                placeItems="center"
                transition="all 240ms"
                _hover={{
                  bg: "bg.brand.subtle",
                  color: "text.brand",
                  borderColor: "border.brand",
                  transform: "translateY(-2px)",
                  textDecoration: "none",
                }}
              >
                <Box as={FiInstagram} />
              </Link>
              <Link
                href={whatsappUrl}
                isExternal
                aria-label={t("footer.whatsapp")}
                data-cursor-label={t("footer.whatsapp")}
                w={10}
                h={10}
                borderRadius="full"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                color="text.secondary"
                display="grid"
                placeItems="center"
                transition="all 240ms"
                _hover={{
                  bg: "bg.brand.subtle",
                  color: "text.brand",
                  borderColor: "border.brand",
                  transform: "translateY(-2px)",
                  textDecoration: "none",
                }}
              >
                <Box as={FaWhatsapp} />
              </Link>
            </HStack>
          </Stack>

          {/* Navegar */}
          <Stack spacing={4} gridColumn={{ md: "span 3" }}>
            <Heading
              as="h4"
              fontSize="sm"
              fontWeight="800"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="text.primary"
            >
              {t("footer.navHeader")}
            </Heading>
            <Stack spacing={2.5} align="flex-start">
              {NAV_IDS.map((id) => (
                <Box
                  as="button"
                  key={id}
                  data-cursor-label={t(`nav.${id}`)}
                  textAlign="left"
                  fontSize="sm"
                  color="text.secondary"
                  transition="color 200ms"
                  _hover={{ color: "text.brand" }}
                  onClick={() => goToSection(id)}
                >
                  {t(`nav.${id}`)}
                </Box>
              ))}
            </Stack>
          </Stack>

          {/* Contato */}
          <Stack spacing={4} gridColumn={{ md: "span 4" }} maxW="360px">
            <Heading
              as="h4"
              fontSize="sm"
              fontWeight="800"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="text.primary"
            >
              {t("footer.contatoHeader")}
            </Heading>
            <Text color="text.secondary" fontSize="sm" lineHeight="1.6">
              {t("footer.contatoInvite")}
            </Text>
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              data-cursor-label={t("footer.contatoHeader")}
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="700"
              color="text.brand"
              w="fit-content"
              _hover={{ textDecoration: "underline" }}
            >
              {CONTACT_EMAIL}
            </Link>
            <Button
              as="a"
              href={PLATFORM_URL}
              data-cursor-label={t("footer.acessar")}
              variant="solid"
              alignSelf="flex-start"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              h="auto"
              minH={12}
              px={6}
              py={3}
              mt={1}
              fontSize="sm"
              lineHeight="1.2"
              whiteSpace="nowrap"
              rightIcon={<Box as={ArrowUpRight} fontSize="sm" />}
              textDecoration="none"
              _hover={{ textDecoration: "none" }}
            >
              {t("footer.acessar")}
            </Button>
          </Stack>
        </SimpleGrid>

        <Flex
          mt={{ base: 12, md: 16 }}
          pt={6}
          borderTop="1px solid"
          borderColor="border.subtle"
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap={4}
        >
          <Text fontSize="xs" color="text.muted">
            © {new Date().getFullYear()} Boilerplate. {t("footer.copyright")}
          </Text>
          <HStack spacing={5}>
            {LEGAL_LINKS.map((l) => (
              <Link
                as={RouterLink}
                key={l.to}
                to={l.to}
                data-cursor-label={t(`footer.${l.key}`)}
                fontSize="xs"
                color="text.muted"
                transition="color 200ms"
                _hover={{ color: "text.brand", textDecoration: "none" }}
              >
                {t(`footer.${l.key}`)}
              </Link>
            ))}
          </HStack>
        </Flex>
      </SiteContainer>
    </Box>
  );
};
