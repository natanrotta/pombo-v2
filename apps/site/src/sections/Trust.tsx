import { Box, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Code2, Rocket, Shield, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteContainer } from "@/components/Container";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { useReveal } from "@/hooks/useReveal";
import { useLocale } from "@/hooks/useLocale";

type Pillar = {
  id: "privacidade" | "seguranca" | "assinatura" | "scale";
  icon: LucideIcon;
};

// Generic social-proof beat right before Pricing: value pillars + placeholder
// logos + a few neutral testimonials. Copy lives in the locale files under
// `trust.*`. Swap the "Acme" testimonials and logo labels for your own.
const PILLARS: Pillar[] = [
  { id: "privacidade", icon: Code2 },
  { id: "seguranca", icon: Shield },
  { id: "assinatura", icon: Zap },
  { id: "scale", icon: Rocket },
];

const LOGOS = ["Acme", "Globex", "Umbrella", "Initech", "Hooli"] as const;

const TESTIMONIALS = ["one", "two", "three"] as const;

export const Trust = () => {
  const { t } = useLocale();
  const reveal = useReveal<HTMLDivElement>({
    variant: "slide-up",
    childSelector: "[data-reveal]",
    stagger: 0.1,
  });

  return (
    // Intentionally NOT in PRIMARY_NAV — social-proof beat right before Pricing,
    // not a navigation destination, so the header pill doesn't track it.
    <Box as="section" id="confianca" bg="bg.sunken" py={{ base: 24, lg: 28 }} ref={reveal}>
      <SiteContainer w="100%">
        <Stack spacing={{ base: 14, md: 16 }}>
          <Stack spacing={5} maxW="780px" data-reveal>
            <SectionEyebrow label={t("trust.eyebrow")} />
            <Heading
              as="h2"
              fontSize="display-lg"
              fontWeight="800"
              lineHeight="1.05"
              letterSpacing="tighter"
            >
              {t("trust.titleLead")}
              <Box
                as="span"
                bgGradient="linear(135deg, brand.500, accent.500)"
                bgClip="text"
                sx={{ WebkitTextFillColor: "transparent" }}
              >
                {t("trust.titleHighlight")}
              </Box>
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="text.secondary" lineHeight="1.6">
              {t("trust.subtitle")}
            </Text>
          </Stack>

          {/* Placeholder logo strip */}
          <Stack spacing={5} data-reveal>
            <Text
              fontSize="2xs"
              fontWeight="800"
              letterSpacing="0.18em"
              textTransform="uppercase"
              color="text.muted"
            >
              {t("trust.logosLabel")}
            </Text>
            <Flex
              wrap="wrap"
              align="center"
              gap={{ base: 6, md: 12 }}
              opacity={0.7}
              sx={{ filter: "grayscale(1)" }}
            >
              {LOGOS.map((name) => (
                <Text
                  key={name}
                  fontSize={{ base: "lg", md: "xl" }}
                  fontWeight="800"
                  letterSpacing="tighter"
                  color="text.secondary"
                >
                  {name}
                </Text>
              ))}
            </Flex>
          </Stack>

          {/* Value pillars */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, md: 6 }}>
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Stack
                  key={pillar.id}
                  data-reveal
                  spacing={5}
                  p={{ base: 6, md: 7 }}
                  h="100%"
                  borderRadius="3xl"
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.subtle"
                  boxShadow="shadow.card"
                  transition="all 320ms cubic-bezier(0.22, 1, 0.36, 1)"
                  _hover={{
                    transform: "translateY(-6px)",
                    boxShadow: "shadow.cardHover",
                    borderColor: "border.brand",
                  }}
                >
                  <Flex
                    w={12}
                    h={12}
                    flexShrink={0}
                    borderRadius="2xl"
                    align="center"
                    justify="center"
                    fontSize="xl"
                    color="white"
                    bgGradient="linear(135deg, brand.500, accent.500)"
                    boxShadow="0 10px 24px -8px rgba(47, 128, 237, 0.45)"
                  >
                    <Box as={Icon} />
                  </Flex>

                  <Stack spacing={2.5}>
                    <Heading
                      as="h3"
                      fontSize={{ base: "lg", md: "xl" }}
                      fontWeight="800"
                      letterSpacing="tighter"
                      lineHeight="1.2"
                      color="text.primary"
                    >
                      {t(`trust.items.${pillar.id}.title`)}
                    </Heading>
                    <Text fontSize="sm" lineHeight="1.6" color="text.secondary">
                      {t(`trust.items.${pillar.id}.body`)}
                    </Text>
                  </Stack>
                </Stack>
              );
            })}
          </SimpleGrid>

          {/* Testimonials */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, md: 6 }}>
            {TESTIMONIALS.map((id) => (
              <Stack
                key={id}
                data-reveal
                spacing={5}
                p={{ base: 6, md: 7 }}
                h="100%"
                borderRadius="3xl"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                boxShadow="shadow.card"
                justify="space-between"
              >
                <Text fontSize={{ base: "md", md: "lg" }} color="text.primary" lineHeight="1.6">
                  &ldquo;{t(`trust.testimonials.${id}.quote`)}&rdquo;
                </Text>
                <Flex align="center" gap={3}>
                  <Flex
                    w={10}
                    h={10}
                    flexShrink={0}
                    borderRadius="full"
                    align="center"
                    justify="center"
                    fontSize="sm"
                    fontWeight="800"
                    color="white"
                    bgGradient="linear(135deg, brand.500, accent.500)"
                  >
                    {t(`trust.testimonials.${id}.initials`)}
                  </Flex>
                  <Stack spacing={0}>
                    <Text fontSize="sm" fontWeight="700" color="text.primary">
                      {t(`trust.testimonials.${id}.author`)}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      {t(`trust.testimonials.${id}.role`)}
                    </Text>
                  </Stack>
                </Flex>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      </SiteContainer>
    </Box>
  );
};
