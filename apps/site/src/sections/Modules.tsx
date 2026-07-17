import { useCallback, useRef, useState } from "react";
import { Box, Flex, Heading, IconButton, Stack, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteContainer } from "@/components/Container";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { FEATURE_SLIDES } from "@/content/modules";
import { useLocale } from "@/hooks/useLocale";
import { useReveal } from "@/hooks/useReveal";

const TOTAL = FEATURE_SLIDES.length;

// Shared visual for both the overlay arrows (desktop) and the inline arrows
// (mobile). Placement (position/display) is set per call site.
const NAV_BTN_SX = {
  variant: "outline" as const,
  borderRadius: "full",
  w: 14,
  h: 14,
  minW: 14,
  px: 0,
  fontSize: "2xl",
  bg: "bg.glass",
  backdropFilter: "blur(8px)",
  borderColor: "border.subtle",
  color: "text.primary",
  boxShadow: "shadow.panel",
  transition: "background 200ms, color 200ms, border-color 200ms",
  _hover: {
    bg: "bg.brand.subtle",
    color: "text.brand",
    borderColor: "border.brand",
  },
};

/** Themed visual panel anchoring each feature slide with its icon (no screenshot). */
const FeatureVisual = ({ icon: Icon }: { icon: LucideIcon }) => (
  <Flex
    position="relative"
    w="100%"
    overflow="hidden"
    borderRadius="2xl"
    border="1px solid"
    borderColor="border.subtle"
    boxShadow="shadow.panel"
    bg="bg.elevated"
    align="center"
    justify="center"
    maxH={{ lg: "42vh" }}
    sx={{ aspectRatio: "11 / 6" }}
  >
    <Box
      position="absolute"
      top="-30%"
      right="-20%"
      w="60%"
      h="120%"
      borderRadius="full"
      bgGradient="radial(circle, rgba(47, 128, 237, 0.12), transparent 60%)"
      pointerEvents="none"
    />
    <Box
      position="absolute"
      bottom="-30%"
      left="-20%"
      w="55%"
      h="120%"
      borderRadius="full"
      bgGradient="radial(circle, rgba(126, 87, 255, 0.10), transparent 60%)"
      pointerEvents="none"
    />
    <Flex
      position="relative"
      w={{ base: 16, md: 20 }}
      h={{ base: 16, md: 20 }}
      borderRadius="2xl"
      bgGradient="linear(135deg, brand.500, accent.500)"
      color="white"
      align="center"
      justify="center"
      fontSize={{ base: "3xl", md: "4xl" }}
      boxShadow="brand-glow"
    >
      <Box as={Icon} />
    </Flex>
  </Flex>
);

export const Modules = () => {
  const { t } = useLocale();
  const reveal = useReveal<HTMLDivElement>({
    variant: "slide-up",
    childSelector: "[data-reveal]",
    stagger: 0.12,
  });
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    setActive(((i % TOTAL) + TOTAL) % TOTAL);
  }, []);
  const next = useCallback(() => setActive((a) => (a + 1) % TOTAL), []);
  const prev = useCallback(() => setActive((a) => (a - 1 + TOTAL) % TOTAL), []);

  return (
    <Box
      ref={reveal}
      as="section"
      id="modulos"
      bg="bg.canvas"
      position="relative"
      overflow="hidden"
      py={{ base: 24, lg: 8 }}
      h={{ lg: "100svh" }}
      minH={{ lg: "640px" }}
      display={{ lg: "flex" }}
      flexDirection={{ lg: "column" }}
      justifyContent={{ lg: "center" }}
    >
      <Box
        position="absolute"
        inset={0}
        bgGradient="radial(ellipse 60% 50% at 50% 0%, rgba(47, 128, 237, 0.08), transparent 70%)"
        pointerEvents="none"
      />

      <SiteContainer
        position="relative"
        w="100%"
        h={{ lg: "100%" }}
        display={{ lg: "flex" }}
        flexDirection={{ lg: "column" }}
        justifyContent={{ lg: "center" }}
      >
        <Stack spacing={5} maxW="720px" mb={{ base: 12, md: 16, lg: 6 }} flexShrink={0} data-reveal>
          <SectionEyebrow label={t("modules.eyebrow")} />
          <Heading
            as="h2"
            fontSize="display-lg"
            fontWeight="800"
            lineHeight="1.05"
            letterSpacing="tighter"
          >
            {t("modules.titleLead")}
            <Box
              as="span"
              bgGradient="linear(135deg, brand.500, accent.500)"
              bgClip="text"
              sx={{ WebkitTextFillColor: "transparent" }}
            >
              {t("modules.titleHighlight")}
            </Box>
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="text.secondary" lineHeight="1.6">
            {t("modules.subtitle")}
          </Text>
        </Stack>

        <Box
          data-reveal
          role="region"
          aria-roledescription="carrossel"
          aria-label={t("modules.eyebrow")}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              next();
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              prev();
            }
          }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const end = e.changedTouches[0]?.clientX ?? touchX.current;
            const dx = end - touchX.current;
            if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
            touchX.current = null;
          }}
          position="relative"
          borderRadius="3xl"
          bg="bg.surface"
          border="1px solid"
          borderColor="border.subtle"
          boxShadow="shadow.card"
          _focusVisible={{
            outline: "2px solid",
            outlineColor: "border.brand",
            outlineOffset: "2px",
          }}
        >
          <Box overflow="hidden" borderRadius="3xl">
            <Flex
              transform={`translateX(-${active * 100}%)`}
              transition="transform 600ms cubic-bezier(0.22, 1, 0.36, 1)"
              willChange="transform"
              sx={{
                "@media (prefers-reduced-motion: reduce)": { transition: "none" },
              }}
            >
              {FEATURE_SLIDES.map((slide, i) => {
                const Icon = slide.icon;
                const reversed = i % 2 === 1;
                const title = t(`modules.items.${slide.id}.title`);
                const counter = `${String(i + 1).padStart(2, "0")} ${t(
                  "modules.counterSeparator"
                )} ${String(TOTAL).padStart(2, "0")}`;
                return (
                  <Flex
                    key={slide.id}
                    flex="0 0 100%"
                    minW="100%"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${counter} — ${title}`}
                    aria-hidden={i !== active}
                    direction={{
                      base: "column",
                      md: reversed ? "row-reverse" : "row",
                    }}
                    align="center"
                    gap={{ base: 8, md: 12 }}
                    p={{ base: 6, md: 8 }}
                  >
                    <Box flex="1" w="100%" maxW={{ md: "560px" }}>
                      <FeatureVisual icon={Icon} />
                    </Box>

                    <Stack flex="1" spacing={5} maxW={{ md: "440px" }}>
                      <Flex align="center" gap={3}>
                        <Flex
                          w={12}
                          h={12}
                          flexShrink={0}
                          borderRadius="2xl"
                          bgGradient="linear(135deg, brand.500, accent.500)"
                          color="white"
                          align="center"
                          justify="center"
                          fontSize="2xl"
                          boxShadow="0 12px 28px -8px rgba(47, 128, 237, 0.45)"
                        >
                          <Box as={Icon} />
                        </Flex>
                        <Text
                          fontSize="2xs"
                          fontWeight="700"
                          letterSpacing="0.16em"
                          color="text.muted"
                        >
                          {counter}
                        </Text>
                      </Flex>

                      <Heading
                        as="h3"
                        fontSize={{ base: "2xl", md: "3xl" }}
                        fontWeight="800"
                        letterSpacing="tighter"
                        lineHeight="1.1"
                        color="text.primary"
                      >
                        {title}
                      </Heading>

                      <Box
                        w={10}
                        h="3px"
                        borderRadius="full"
                        bgGradient="linear(to-r, brand.500, accent.500)"
                      />

                      <Text
                        fontSize={{ base: "md", md: "lg" }}
                        color="text.secondary"
                        lineHeight="1.7"
                      >
                        {t(`modules.items.${slide.id}.body`)}
                      </Text>
                    </Stack>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Box>

        <Flex justify="center" align="center" gap={4} mt={{ base: 8, lg: 6 }} data-reveal>
          <IconButton
            aria-label={t("modules.a11yPrev")}
            icon={<Box as={ChevronLeft} fontSize="2xl" />}
            onClick={prev}
            {...NAV_BTN_SX}
          />

          <Flex gap={2.5} align="center">
            {FEATURE_SLIDES.map((slide, i) => {
              const isActive = i === active;
              return (
                <Box
                  as="button"
                  type="button"
                  key={slide.id}
                  aria-label={`${t("modules.a11yGoTo")} ${t(`modules.items.${slide.id}.title`)}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => goTo(i)}
                  h="3px"
                  w={isActive ? 8 : 4}
                  borderRadius="full"
                  bg={isActive ? undefined : "border.default"}
                  bgGradient={isActive ? "linear(to-r, brand.500, accent.500)" : undefined}
                  transition="all 300ms cubic-bezier(0.22, 1, 0.36, 1)"
                  _hover={{ bg: isActive ? undefined : "border.strong" }}
                  _focusVisible={{
                    outline: "2px solid",
                    outlineColor: "border.brand",
                    outlineOffset: "3px",
                  }}
                />
              );
            })}
          </Flex>

          <IconButton
            aria-label={t("modules.a11yNext")}
            icon={<Box as={ChevronRight} fontSize="2xl" />}
            onClick={next}
            {...NAV_BTN_SX}
          />
        </Flex>
      </SiteContainer>
    </Box>
  );
};
