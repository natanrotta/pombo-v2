import { Box, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ArrowDown, Clock, Inbox, Smile, ZapOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteContainer } from "@/components/Container";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { useReveal } from "@/hooks/useReveal";
import { useLocale } from "@/hooks/useLocale";
import { useSiteNavigation } from "@/hooks/useSiteNavigation";

type PainCard = {
  id: "time" | "scatter" | "energy" | "answer";
  icon: LucideIcon;
  tone?: "neutral" | "answer";
};

const PAINS: PainCard[] = [
  { id: "time", icon: Clock },
  { id: "scatter", icon: Inbox },
  { id: "energy", icon: ZapOff },
  { id: "answer", icon: Smile, tone: "answer" },
];

export const Problem = () => {
  const { t } = useLocale();
  const { goTo } = useSiteNavigation();
  const reveal = useReveal<HTMLDivElement>({
    variant: "slide-up",
    childSelector: "[data-reveal]",
    stagger: 0.1,
  });

  return (
    <Box
      as="section"
      id="problema"
      bg="bg.sunken"
      py={{ base: 24, lg: 10 }}
      ref={reveal}
      minH={{ lg: "100svh" }}
      display={{ lg: "flex" }}
      flexDirection={{ lg: "column" }}
      justifyContent={{ lg: "center" }}
    >
      <SiteContainer w="100%">
        <Stack spacing={{ base: 14, md: 16, lg: 12 }}>
          <Stack spacing={5} maxW="780px" data-reveal>
            <SectionEyebrow label={t("problem.eyebrow")} />
            <Heading
              as="h2"
              fontSize="display-lg"
              fontWeight="800"
              lineHeight="1.05"
              letterSpacing="tighter"
            >
              {t("problem.headlineLead")}
              <Box
                as="span"
                bgGradient="linear(135deg, brand.500, accent.500)"
                bgClip="text"
                sx={{ WebkitTextFillColor: "transparent" }}
              >
                {t("problem.headlineHighlight")}
              </Box>
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="text.secondary" lineHeight="1.6">
              {t("problem.subtitle")}
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, md: 6 }}>
            {PAINS.map((pain, idx) => {
              const isAnswer = pain.tone === "answer";
              const Icon = pain.icon;
              return (
                <Stack
                  key={pain.id}
                  data-reveal
                  spacing={5}
                  p={{ base: 6, md: 7 }}
                  h="100%"
                  borderRadius="3xl"
                  position="relative"
                  overflow="hidden"
                  transition="all 320ms cubic-bezier(0.22, 1, 0.36, 1)"
                  {...(isAnswer
                    ? {
                        color: "white",
                        bgGradient: "linear(150deg, brand.500, accent.500)",
                        boxShadow: "0 18px 40px -16px rgba(47, 128, 237, 0.5)",
                        _hover: {
                          transform: "translateY(-6px)",
                          boxShadow: "0 26px 56px -18px rgba(47, 128, 237, 0.6)",
                        },
                      }
                    : {
                        bg: "bg.surface",
                        border: "1px solid",
                        borderColor: "border.subtle",
                        boxShadow: "shadow.card",
                        _hover: {
                          transform: "translateY(-6px)",
                          boxShadow: "shadow.cardHover",
                          borderColor: "border.brand",
                        },
                      })}
                >
                  {isAnswer && (
                    <Box
                      position="absolute"
                      top="-28%"
                      right="-24%"
                      w="240px"
                      h="240px"
                      borderRadius="full"
                      bgGradient="radial(circle, rgba(255, 255, 255, 0.20), transparent 60%)"
                      pointerEvents="none"
                    />
                  )}

                  <Flex
                    position="relative"
                    w={12}
                    h={12}
                    flexShrink={0}
                    borderRadius="2xl"
                    align="center"
                    justify="center"
                    fontSize="xl"
                    color="white"
                    {...(isAnswer
                      ? {
                          bg: "whiteAlpha.300",
                          border: "1px solid",
                          borderColor: "whiteAlpha.400",
                          backdropFilter: "blur(6px)",
                        }
                      : {
                          bgGradient: "linear(135deg, brand.500, accent.500)",
                          boxShadow: "0 10px 24px -8px rgba(47, 128, 237, 0.45)",
                        })}
                  >
                    <Box as={Icon} />
                  </Flex>

                  <Stack spacing={2.5} position="relative">
                    <Text
                      fontSize="2xs"
                      fontWeight="800"
                      letterSpacing="0.18em"
                      textTransform="uppercase"
                      color={isAnswer ? "whiteAlpha.800" : "text.muted"}
                    >
                      {isAnswer ? t("problem.answerLabel") : String(idx + 1).padStart(2, "0")}
                    </Text>
                    <Heading
                      as="h3"
                      fontSize={{ base: "lg", md: "xl" }}
                      fontWeight="800"
                      letterSpacing="tighter"
                      lineHeight="1.2"
                      color={isAnswer ? "white" : "text.primary"}
                    >
                      {t(`problem.items.${pain.id}.title`)}
                    </Heading>
                    <Text
                      fontSize="sm"
                      lineHeight="1.6"
                      color={isAnswer ? "whiteAlpha.900" : "text.secondary"}
                    >
                      {t(`problem.items.${pain.id}.body`)}
                    </Text>
                  </Stack>
                </Stack>
              );
            })}
          </SimpleGrid>

          <Flex justify="center" data-reveal>
            <Box
              as="button"
              type="button"
              onClick={() => goTo("modulos")}
              display="inline-flex"
              alignItems="center"
              gap={2.5}
              px={5}
              py={3}
              borderRadius="full"
              bg="transparent"
              border="1px solid"
              borderColor="border.subtle"
              color="text.secondary"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="600"
              transition="all 280ms cubic-bezier(0.22, 1, 0.36, 1)"
              _hover={{
                color: "text.brand",
                borderColor: "border.brand",
                bg: "bg.brand.subtle",
                transform: "translateY(-2px)",
                "& .bridge-arrow": { transform: "translateY(3px)" },
              }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "border.brand",
                outlineOffset: "2px",
              }}
            >
              <Box as="span">{t("problem.bridge")}</Box>
              <Box
                as="span"
                className="bridge-arrow"
                display="inline-flex"
                alignItems="center"
                transition="transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"
              >
                <Box as={ArrowDown} fontSize="md" />
              </Box>
            </Box>
          </Flex>
        </Stack>
      </SiteContainer>
    </Box>
  );
};
