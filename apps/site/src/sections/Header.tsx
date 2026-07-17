import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, HStack, IconButton, Tooltip, VStack } from "@chakra-ui/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PLATFORM_URL, PRIMARY_NAV } from "@/content/navigation";
import { gsap, useGSAP } from "@/hooks/useGsap";
import { useLocale } from "@/hooks/useLocale";
import { useSiteNavigation } from "@/hooks/useSiteNavigation";

export const Header = () => {
  const { t, locale } = useLocale();
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scope = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const labelTextRef = useRef<HTMLSpanElement>(null);
  const mobileStackRef = useRef<HTMLDivElement>(null);

  // Show pill after the hero is scrolled past
  useEffect(() => {
    const threshold = () => window.innerHeight * 0.7;
    const onScroll = () => setVisible(window.scrollY > threshold());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Track the active section. Pick the one whose top edge is closest to
  // ~30% from the top of the viewport.
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const targetY = window.innerHeight * 0.3;
      let bestId: string | null = null;
      let bestDelta = Infinity;
      for (const item of PRIMARY_NAV) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 80) continue;
        const delta = Math.abs(rect.top - targetY);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestId = item.id;
        }
      }
      setActiveId(bestId);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Header enter/leave
  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;
      if (visible) {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power3.out",
          pointerEvents: "auto",
        });
      } else {
        gsap.to(el, {
          y: 32,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          pointerEvents: "none",
        });
      }
    },
    { dependencies: [visible] }
  );

  // Slide the indicator pill + label to the active icon
  useGSAP(
    () => {
      const nav = navRef.current;
      const indicator = indicatorRef.current;
      const labelBox = labelRef.current;
      const labelText = labelTextRef.current;
      if (!nav || !indicator || !labelBox || !labelText) return;

      if (!activeId) {
        gsap.to([indicator, labelBox], {
          opacity: 0,
          duration: 0.25,
          ease: "power2.out",
        });
        return;
      }

      const button = nav.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`);
      if (!button) return;

      const item = PRIMARY_NAV.find((i) => i.id === activeId);
      const navRect = nav.getBoundingClientRect();
      const btnRect = button.getBoundingClientRect();
      const x = btnRect.left - navRect.left;
      const y = btnRect.top - navRect.top;

      gsap.to(indicator, {
        x,
        y,
        width: btnRect.width,
        height: btnRect.height,
        opacity: 1,
        duration: 0.55,
        ease: "power3.out",
      });

      if (item) {
        // Swap label text mid-fade for a clean transition
        const tl = gsap.timeline();
        tl.to(labelText, {
          opacity: 0,
          y: -6,
          duration: 0.18,
          ease: "power2.in",
          onComplete: () => {
            labelText.textContent = t(`nav.${item.id}`);
          },
        }).to(labelText, {
          opacity: 1,
          y: 0,
          duration: 0.25,
          ease: "power3.out",
        });
        gsap.to(labelBox, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    },
    { dependencies: [activeId, locale] }
  );

  const { goTo: scrollToSection } = useSiteNavigation();
  const goTo = (id: string) => {
    setMobileMenuOpen(false);
    scrollToSection(id);
  };

  // Animate the mobile icon stack open/close
  useGSAP(
    () => {
      const stack = mobileStackRef.current;
      if (!stack) return;
      const items = stack.querySelectorAll<HTMLElement>(".nav-pop-item");

      if (mobileMenuOpen) {
        gsap.set(stack, { pointerEvents: "auto" });
        gsap.to(stack, {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power3.out",
        });
        gsap.fromTo(
          items,
          { y: 14, opacity: 0, scale: 0.85 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.4,
            stagger: { each: 0.04, from: "end" },
            ease: "back.out(1.6)",
          }
        );
      } else {
        gsap.to(stack, {
          opacity: 0,
          y: 12,
          duration: 0.22,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(stack, { pointerEvents: "none" });
          },
        });
      }
    },
    { dependencies: [mobileMenuOpen] }
  );

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onClick = (e: Event) => {
      const stack = mobileStackRef.current;
      const target = e.target as HTMLElement | null;
      if (!stack || !target) return;
      if (stack.contains(target)) return;
      if (target.closest("[data-mobile-toggle]")) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when scrolling
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 80) setMobileMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileMenuOpen]);

  return (
    <>
      <Box
        ref={scope}
        as="header"
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        left="50%"
        zIndex={50}
        opacity={0}
        pointerEvents="none"
        transform="translateX(-50%) translateY(32px)"
        willChange="transform, opacity"
        width={{ base: "calc(100% - 24px)", md: "auto" }}
      >
        {/* Active-section label floating above the pill (desktop only) */}
        <Box
          ref={labelRef}
          display={{ base: "none", md: "block" }}
          position="absolute"
          bottom="calc(100% + 10px)"
          left="50%"
          transform="translateX(-50%)"
          opacity={0}
          pointerEvents="none"
        >
          <Box
            px={3.5}
            py={1.5}
            borderRadius="full"
            bg="bg.elevated"
            border="1px solid"
            borderColor="border.subtle"
            boxShadow="0 10px 24px -10px rgba(15, 23, 42, 0.20)"
            backdropFilter="blur(8px)"
          >
            <Box
              as="span"
              ref={labelTextRef}
              display="inline-block"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="text.brand"
            />
          </Box>
        </Box>

        {/* Desktop pill */}
        <Flex
          display={{ base: "none", md: "flex" }}
          align="center"
          gap={2}
          pl={4}
          pr={2}
          py={2}
          bg="bg.topbar"
          border="1px solid"
          borderColor="border.default"
          borderRadius="full"
          backdropFilter="blur(16px) saturate(180%)"
          boxShadow="0 12px 40px -12px rgba(15, 23, 42, 0.18), 0 4px 16px -8px rgba(15, 23, 42, 0.12)"
        >
          <Box
            as="button"
            type="button"
            onClick={() => goTo("topo")}
            aria-label={t("nav.topo")}
            display="flex"
            alignItems="center"
            borderRadius="full"
            px={1.5}
            py={1}
            ml={-1}
            transition="opacity 200ms"
            _hover={{ opacity: 0.75 }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "border.brand",
              outlineOffset: "2px",
            }}
          >
            <BrandMark size="sm" />
          </Box>
          <Box w="1px" h={6} bg="border.subtle" mx={2} />
          <Box ref={navRef} position="relative">
            {/* Sliding indicator pill behind the icons */}
            <Box
              ref={indicatorRef}
              position="absolute"
              top={0}
              left={0}
              h={10}
              w={10}
              borderRadius="full"
              bgGradient="linear(135deg, brand.500, accent.500)"
              opacity={0}
              pointerEvents="none"
              boxShadow="0 6px 16px -4px rgba(47, 128, 237, 0.45)"
              zIndex={0}
              willChange="transform, width"
            />
            <HStack spacing={0.5} position="relative" zIndex={1}>
              {PRIMARY_NAV.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <Tooltip
                    key={item.id}
                    label={t(`nav.${item.id}`)}
                    placement="top"
                    hasArrow
                    bg="bg.elevated"
                    color="text.primary"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="600"
                    boxShadow="shadow.panel"
                    openDelay={isActive ? 9999 : 0}
                  >
                    <IconButton
                      aria-label={t(`nav.${item.id}`)}
                      data-nav-id={item.id}
                      icon={<Box as={item.icon} fontSize="lg" />}
                      variant="ghost"
                      borderRadius="full"
                      w={10}
                      h={10}
                      minW={10}
                      px={0}
                      color={isActive ? "white" : "text.secondary"}
                      bg="transparent"
                      _hover={
                        isActive
                          ? { bg: "transparent", color: "white" }
                          : { bg: "bg.brand.subtle", color: "text.brand" }
                      }
                      _active={{ bg: "transparent" }}
                      transition="color 280ms ease"
                      onClick={() => goTo(item.id)}
                    />
                  </Tooltip>
                );
              })}
            </HStack>
          </Box>
          <Box w="1px" h={6} bg="border.subtle" mx={2} />
          <LanguageSwitcher />
          <ColorModeToggle />
          <Button
            as="a"
            href={PLATFORM_URL}
            variant="solid"
            h={9}
            px={3.5}
            fontSize="xs"
            fontWeight="700"
            iconSpacing={1.5}
            rightIcon={<Box as={ArrowUpRight} fontSize="sm" />}
            textDecoration="none"
            letterSpacing="0.02em"
            _hover={{
              textDecoration: "none",
              bg: "bg.brand.solid-hover",
              transform: "translateY(-1px)",
            }}
          >
            {t("nav.acessar")}
          </Button>
        </Flex>

        {/* Mobile icon stack — vertical pop-up above the pill */}
        <Box
          ref={mobileStackRef}
          display={{ base: "block", md: "none" }}
          position="absolute"
          bottom="calc(100% + 12px)"
          right={0}
          opacity={0}
          pointerEvents="none"
          willChange="transform, opacity"
          zIndex={1}
        >
          <VStack
            spacing={1.5}
            p={2}
            bg="bg.topbar"
            border="1px solid"
            borderColor="border.default"
            borderRadius="3xl"
            backdropFilter="blur(16px) saturate(180%)"
            boxShadow="0 12px 40px -12px rgba(15, 23, 42, 0.22), 0 4px 16px -8px rgba(15, 23, 42, 0.14)"
          >
            {PRIMARY_NAV.map((item) => {
              const isActive = activeId === item.id;
              return (
                <IconButton
                  key={item.id}
                  className="nav-pop-item"
                  aria-label={t(`nav.${item.id}`)}
                  icon={<Box as={item.icon} fontSize="xl" />}
                  variant="ghost"
                  borderRadius="full"
                  w={12}
                  h={12}
                  minW={12}
                  px={0}
                  color={isActive ? "white" : "text.secondary"}
                  bg={isActive ? "transparent" : "transparent"}
                  bgGradient={isActive ? "linear(135deg, brand.500, accent.500)" : undefined}
                  boxShadow={isActive ? "0 6px 16px -4px rgba(47, 128, 237, 0.45)" : undefined}
                  _hover={{
                    bg: isActive ? undefined : "bg.brand.subtle",
                    color: isActive ? "white" : "text.brand",
                  }}
                  _active={{ transform: "scale(0.94)" }}
                  onClick={() => goTo(item.id)}
                />
              );
            })}

            {/* Language + theme controls live inside the menu on mobile so the
                pill stays compact (BrandMark + CTA + hamburger). */}
            <Box className="nav-pop-item" alignSelf="stretch" h="1px" bg="border.subtle" my={0.5} />
            <Box className="nav-pop-item" display="flex" justifyContent="center">
              <ColorModeToggle />
            </Box>
            <Box className="nav-pop-item" display="flex" justifyContent="center">
              <LanguageSwitcher />
            </Box>
          </VStack>
        </Box>

        {/* Mobile pill */}
        <Flex
          display={{ base: "flex", md: "none" }}
          align="center"
          justify="space-between"
          gap={2}
          pl={3}
          pr={2}
          py={2}
          bg="bg.topbar"
          border="1px solid"
          borderColor="border.default"
          borderRadius="full"
          backdropFilter="blur(16px) saturate(180%)"
          boxShadow="0 12px 40px -12px rgba(15, 23, 42, 0.18)"
        >
          <Box
            as="button"
            type="button"
            onClick={() => goTo("topo")}
            aria-label={t("nav.topo")}
            display="flex"
            alignItems="center"
            borderRadius="full"
            px={1}
            py={1}
            ml={-1}
            transition="opacity 200ms"
            _hover={{ opacity: 0.75 }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "border.brand",
              outlineOffset: "2px",
            }}
          >
            <BrandMark size="sm" />
          </Box>
          <HStack spacing={1}>
            <Button
              as="a"
              href={PLATFORM_URL}
              variant="solid"
              h={9}
              px={4}
              fontSize="xs"
              fontWeight="600"
              iconSpacing={1.5}
              rightIcon={<Box as={ArrowUpRight} fontSize="sm" />}
              textDecoration="none"
              _hover={{ textDecoration: "none", bg: "bg.brand.solid-hover" }}
            >
              {t("nav.plataforma")}
            </Button>
            <IconButton
              aria-label={mobileMenuOpen ? t("nav.fecharMenu") : t("nav.abrirMenu")}
              data-mobile-toggle="true"
              icon={mobileMenuOpen ? <X /> : <Menu />}
              variant="ghost"
              size="sm"
              borderRadius="full"
              onClick={() => setMobileMenuOpen((v) => !v)}
            />
          </HStack>
        </Flex>
      </Box>
    </>
  );
};
