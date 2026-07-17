import { useRef } from "react";
import { Box, Button, Flex, HStack, Stack, Text, keyframes } from "@chakra-ui/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteContainer } from "@/components/Container";
import { TextScatter } from "@/components/TextScatter";
import { gsap, useGSAP } from "@/hooks/useGsap";
import { useLocale } from "@/hooks/useLocale";
import { PLATFORM_URL } from "@/content/navigation";

const orbFloatA = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(20px, -30px, 0); }
`;
const orbFloatB = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-25px, 25px, 0); }
`;
const arrowBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
`;

export const Hero = () => {
  const { t } = useLocale();
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { y: 24, opacity: 0, duration: 0.8 })
        .from(".hero-sub", { y: 24, opacity: 0, duration: 0.9 }, "-=0.3")
        .from(".hero-cta > *", { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, "-=0.55")
        .from(".hero-scroll", { opacity: 0, duration: 0.8 }, "-=0.3");
      // Orb float and scroll-arrow bob run as CSS keyframes on the compositor
      // (see orbFloatA/orbFloatB/arrowBob above) so they don't churn the DOM.
    },
    { scope }
  );

  return (
    <Box
      as="section"
      id="topo"
      position="relative"
      h={{ base: "100svh", md: "100vh" }}
      minH={{ base: "640px", md: "700px" }}
      overflow="hidden"
      ref={scope}
    >
      <Box
        position="absolute"
        top="6%"
        left="-12%"
        w={{ base: "320px", md: "520px" }}
        h={{ base: "320px", md: "520px" }}
        borderRadius="full"
        bgGradient="radial(circle at 30% 30%, rgba(47, 128, 237, 0.30), transparent 60%)"
        filter="blur(8px)"
        pointerEvents="none"
        willChange="transform"
        animation={`${orbFloatA} 16s ease-in-out infinite`}
      />
      <Box
        position="absolute"
        bottom="-18%"
        right="-10%"
        w={{ base: "360px", md: "560px" }}
        h={{ base: "360px", md: "560px" }}
        borderRadius="full"
        bgGradient="radial(circle at 40% 40%, rgba(30, 178, 138, 0.26), transparent 60%)"
        filter="blur(8px)"
        pointerEvents="none"
        willChange="transform"
        animation={`${orbFloatB} 20s ease-in-out infinite`}
      />

      <SiteContainer
        position="relative"
        h="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Stack spacing={{ base: 7, md: 9 }} align="center" textAlign="center" w="100%">
          <HStack
            className="hero-eyebrow"
            spacing={3}
            px={4}
            py={2}
            borderRadius="full"
            bg="bg.glass"
            border="1px solid"
            borderColor="border.subtle"
            backdropFilter="blur(8px)"
          >
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg="accent.500"
              boxShadow="0 0 0 4px rgba(30, 178, 138, 0.18)"
            />
            <Text fontSize="xs" fontWeight="600" letterSpacing="0.08em">
              {t("hero.eyebrow")}
            </Text>
          </HStack>

          <TextScatter
            as="h1"
            fontSize={{ base: "display-lg", md: "display-xl" }}
            fontWeight="800"
            lineHeight="1.02"
            letterSpacing="tightest"
            color="text.primary"
            maxW="980px"
            pb={2}
            lines={[
              [{ text: t("hero.line1") }],
              [
                { text: `${t("hero.line2Lead")} ` },
                { text: t("hero.line2Highlight"), gradient: true },
              ],
            ]}
          />

          <Text
            className="hero-sub"
            maxW="640px"
            fontSize={{ base: "md", md: "lg" }}
            color="text.secondary"
            lineHeight="1.6"
          >
            {t("hero.subtitle")}
          </Text>

          <Flex className="hero-cta" gap={3} flexWrap="wrap" justify="center">
            <Button
              as="a"
              href={PLATFORM_URL}
              variant="solid"
              size="lg"
              rightIcon={<ArrowUpRight />}
            >
              {t("hero.ctaPrimary")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById("problema");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("hero.ctaSecondary")}
            </Button>
          </Flex>
        </Stack>
      </SiteContainer>

      <Flex
        className="hero-scroll"
        position="absolute"
        bottom={{ base: 6, md: 8 }}
        left="50%"
        transform="translateX(-50%)"
        direction="column"
        align="center"
        gap={2}
        color="text.muted"
        pointerEvents="none"
      >
        <Text fontSize="2xs" fontWeight="600" letterSpacing="0.18em" textTransform="uppercase">
          {t("hero.scrollHint")}
        </Text>
        <Box
          as={ArrowDown}
          fontSize="md"
          sx={{ animation: `${arrowBob} 2.8s ease-in-out infinite` }}
        />
      </Flex>
    </Box>
  );
};
