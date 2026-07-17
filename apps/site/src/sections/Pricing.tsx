import { useRef } from "react";
import { Box, Button, Flex, HStack, Heading, Stack, Text } from "@chakra-ui/react";
import { ArrowUpRight, Check, Gift } from "lucide-react";
import { SiteContainer } from "@/components/Container";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { PLANS } from "@/content/pricing";
import { PLATFORM_URL } from "@/content/navigation";
import { ScrollTrigger, gsap, useGSAP } from "@/hooks/useGsap";
import { useLocale } from "@/hooks/useLocale";

const formatNumber = (n: number) => Math.round(n).toString();

export const Pricing = () => {
  const { t, locale } = useLocale();
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      gsap.fromTo(
        ".pricing-reveal",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".pricing-header", start: "top 85%" },
          immediateRender: false,
        }
      );

      gsap.fromTo(
        ".pricing-trial",
        { y: 24, opacity: 0, scale: 0.92 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: 0.25,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: ".pricing-header", start: "top 85%" },
          immediateRender: false,
        }
      );

      gsap.fromTo(
        ".pricing-card",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: ".pricing-grid", start: "top 85%" },
          immediateRender: false,
        }
      );

      // Featured badge subtle bounce
      gsap.fromTo(
        ".pricing-badge",
        { y: 10, opacity: 0, scale: 0.85 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          delay: 0.4,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".pricing-grid", start: "top 85%" },
          immediateRender: false,
        }
      );

      // Count-up on TOTAL prices
      const totals = gsap.utils.toArray<HTMLElement>(".pricing-total", root);
      totals.forEach((el) => {
        const target = Number(el.dataset.value || "0");
        const currency = el.dataset.currency || "";
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: ".pricing-grid", start: "top 70%" },
          onUpdate: () => {
            el.textContent = `${currency} ${formatNumber(obj.val)}`;
          },
        });
      });

      // Closing line
      gsap.fromTo(
        ".pricing-closing",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".pricing-closing", start: "top 95%" },
          immediateRender: false,
        }
      );

      // The Modules section pins itself, which pushes content below it down
      // by a spacer. Force a re-measure so our triggers fire at the correct
      // scroll positions.
      ScrollTrigger.refresh();
    },
    { scope, dependencies: [locale] }
  );

  return (
    <Box
      ref={scope}
      as="section"
      id="planos"
      position="relative"
      overflow="hidden"
      py={{ base: 24, lg: 10 }}
      minH={{ lg: "100svh" }}
      display={{ lg: "flex" }}
      flexDirection={{ lg: "column" }}
      justifyContent={{ lg: "center" }}
    >
      <Box
        position="absolute"
        top="10%"
        left="50%"
        transform="translateX(-50%)"
        w="900px"
        h="500px"
        borderRadius="full"
        bgGradient="radial(ellipse, rgba(47, 128, 237, 0.10), transparent 60%)"
        pointerEvents="none"
      />

      <SiteContainer position="relative">
        <Stack
          className="pricing-header"
          spacing={5}
          maxW="780px"
          mx="auto"
          textAlign="center"
          mb={{ base: 14, md: 20, lg: 8 }}
        >
          <Box className="pricing-reveal" display="flex" justifyContent="center">
            <SectionEyebrow label={t("pricing.eyebrow")} />
          </Box>
          <Heading
            className="pricing-reveal"
            as="h2"
            fontSize="display-lg"
            fontWeight="800"
            lineHeight="1.05"
            letterSpacing="tighter"
          >
            {t("pricing.titleLead")}
            <Box
              as="span"
              bgGradient="linear(135deg, brand.500, accent.500)"
              bgClip="text"
              sx={{ WebkitTextFillColor: "transparent" }}
            >
              {t("pricing.titleHighlight")}
            </Box>
            {t("pricing.titleTail")}
          </Heading>
          <Text
            className="pricing-reveal"
            color="text.secondary"
            fontSize={{ base: "md", md: "lg" }}
            lineHeight="1.6"
          >
            {t("pricing.subtitle")}
          </Text>
        </Stack>

        <Flex
          className="pricing-trial"
          align="center"
          justify="center"
          gap={3}
          mx="auto"
          mb={{ base: 10, md: 14, lg: 8 }}
          maxW={{ base: "100%", md: "fit-content" }}
          px={{ base: 5, md: 6 }}
          py={{ base: 3, md: 3.5 }}
          borderRadius="full"
          bg="bg.surface"
          border="1px solid"
          borderColor="border.brand"
          boxShadow="0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -12px rgba(47, 128, 237, 0.25)"
        >
          <Flex
            w={9}
            h={9}
            flexShrink={0}
            borderRadius="full"
            bgGradient="linear(135deg, brand.500, accent.500)"
            color="white"
            align="center"
            justify="center"
            fontSize="md"
            boxShadow="0 6px 14px -4px rgba(47, 128, 237, 0.45)"
          >
            <Box as={Gift} />
          </Flex>
          <Stack spacing={0} textAlign="left">
            <Text
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="800"
              color="text.primary"
              lineHeight="1.2"
            >
              {t("pricing.trialTitle")}
            </Text>
            <Text fontSize="xs" color="text.muted" lineHeight="1.35">
              {t("pricing.trialSubtitle")}
            </Text>
          </Stack>
        </Flex>

        <Flex
          className="pricing-grid"
          direction={{ base: "column", md: "row" }}
          gap={{ base: 6, md: 5 }}
          align={{ base: "stretch", md: "stretch" }}
          maxW="980px"
          mx="auto"
        >
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isFeatured = !!plan.featured;
            const planKey = plan.kind;
            return (
              <Box
                key={plan.id}
                className="pricing-card"
                flex={1}
                position="relative"
                borderRadius="2xl"
                bg="bg.surface"
                border="2px solid"
                borderColor={isFeatured ? "brand.500" : "border.subtle"}
                boxShadow={
                  isFeatured
                    ? "0 4px 12px rgba(47, 128, 237, 0.10), 0 24px 50px -16px rgba(47, 128, 237, 0.30)"
                    : "0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 32px -16px rgba(15, 23, 42, 0.12)"
                }
                overflow="visible"
                transition="all 320ms cubic-bezier(0.22, 1, 0.36, 1)"
                _hover={{
                  transform: "translateY(-4px)",
                  boxShadow: isFeatured
                    ? "0 6px 16px rgba(47, 128, 237, 0.14), 0 32px 60px -16px rgba(47, 128, 237, 0.40)"
                    : "0 2px 4px rgba(15, 23, 42, 0.05), 0 24px 48px -16px rgba(15, 23, 42, 0.18)",
                }}
              >
                {isFeatured && (
                  <HStack
                    className="pricing-badge"
                    position="absolute"
                    top="-16px"
                    left="50%"
                    transform="translateX(-50%)"
                    px={4}
                    py={1.5}
                    borderRadius="full"
                    bg="brand.500"
                    color="white"
                    spacing={1.5}
                    boxShadow="0 8px 22px -6px rgba(47, 128, 237, 0.55)"
                    zIndex={2}
                  >
                    <Box as={Check} fontSize="sm" strokeWidth={3} />
                    <Text fontSize="2xs" fontWeight="800" letterSpacing="0.14em">
                      {t("pricing.featuredBadge")}
                    </Text>
                  </HStack>
                )}

                <Flex
                  align="center"
                  justify="space-between"
                  p={{ base: 5, md: 6 }}
                  pb={{ base: 4, md: 5 }}
                >
                  <HStack spacing={3}>
                    <Flex
                      w={9}
                      h={9}
                      borderRadius="lg"
                      bg={isFeatured ? "bg.brand.subtle" : "bg.accent.subtle"}
                      color={isFeatured ? "text.brand" : "text.accent"}
                      align="center"
                      justify="center"
                      fontSize="md"
                    >
                      <Box as={Icon} />
                    </Flex>
                    <Text
                      fontSize="sm"
                      fontWeight="800"
                      letterSpacing="0.14em"
                      color="text.primary"
                    >
                      {t(`pricing.plans.${planKey}.name`)}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="text.muted" fontWeight="500">
                    #{plan.id}
                  </Text>
                </Flex>

                <Box px={{ base: 5, md: 6 }}>
                  <Flex justify="space-between" mb={1.5}>
                    <Text fontSize="2xs" fontWeight="700" letterSpacing="0.16em" color="text.muted">
                      {t("pricing.descLabel")}
                    </Text>
                    <Text fontSize="2xs" fontWeight="700" letterSpacing="0.16em" color="text.muted">
                      {t("pricing.subtotalLabel")}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="flex-start" gap={4}>
                    <Stack spacing={0.5} flex={1}>
                      <Text
                        fontSize={{ base: "sm", md: "md" }}
                        fontWeight="700"
                        color="text.primary"
                      >
                        {t(`pricing.plans.${planKey}.description`)}
                      </Text>
                      <Text fontSize="xs" color="text.muted" lineHeight="1.5">
                        {t(`pricing.plans.${planKey}.descriptionSubtitle`)}
                      </Text>
                    </Stack>
                    <Text
                      fontSize={{ base: "sm", md: "md" }}
                      fontWeight="700"
                      color="text.primary"
                      whiteSpace="nowrap"
                    >
                      {plan.currency} {plan.subtotal}
                    </Text>
                  </Flex>
                </Box>

                <Box
                  mx={{ base: 5, md: 6 }}
                  my={{ base: 4, md: 5 }}
                  borderTop="1px dashed"
                  borderColor="border.default"
                />

                <Flex
                  justify="space-between"
                  align="flex-end"
                  px={{ base: 5, md: 6 }}
                  pb={{ base: 5, md: 6 }}
                  gap={4}
                >
                  <Text fontSize="sm" fontWeight="800" letterSpacing="0.14em" color="text.primary">
                    {t("pricing.totalLabel")}
                  </Text>
                  <Stack spacing={0.5} align="flex-end">
                    <Text
                      className="pricing-total"
                      fontSize={{ base: "3xl", md: "4xl" }}
                      fontWeight="800"
                      letterSpacing="tighter"
                      lineHeight="1"
                      color={isFeatured ? "brand.500" : "accent.600"}
                      data-value={plan.total}
                      data-currency={plan.currency}
                    >
                      {plan.currency} {plan.total}
                    </Text>
                    <Text fontSize="2xs" color="text.muted">
                      {plan.currency} {plan.total} {t(`pricing.plans.${planKey}.totalSuffix`)}
                      {isFeatured && <> · {t("pricing.plans.pro.installments")}</>}
                    </Text>
                  </Stack>
                </Flex>

                <Box px={{ base: 5, md: 6 }} pb={{ base: 5, md: 6 }}>
                  <Button
                    as="a"
                    href={PLATFORM_URL}
                    variant={isFeatured ? "solid" : "outline"}
                    w="full"
                    size="lg"
                    h={12}
                    borderRadius="lg"
                    rightIcon={isFeatured ? <Box as={ArrowUpRight} /> : undefined}
                  >
                    {t(`pricing.plans.${planKey}.cta`)}
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Flex>

        <Text
          className="pricing-closing"
          textAlign="center"
          mt={{ base: 10, md: 14, lg: 8 }}
          fontSize="sm"
          color="text.muted"
        >
          {t("pricing.closingPart1")}
          <Box as="span" color="text.primary" fontWeight="700">
            {t("pricing.closingHighlight")}
          </Box>
          {t("pricing.closingPart2")}
        </Text>
      </SiteContainer>
    </Box>
  );
};
