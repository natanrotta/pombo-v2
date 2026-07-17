import { ReactNode, useEffect } from "react";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { SiteContainer } from "@/components/Container";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { useLocale } from "@/hooks/useLocale";

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  children: ReactNode;
};

export const LegalLayout = ({ eyebrow, title, updatedAt, intro, children }: LegalLayoutProps) => {
  const { t } = useLocale();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <Box as="main" py={{ base: 28, md: 36 }} bg="bg.canvas" minH="100vh">
      <SiteContainer maxW="760px">
        <Stack spacing={{ base: 6, md: 8 }} mb={{ base: 10, md: 14 }}>
          <Button
            as={RouterLink}
            to="/"
            leftIcon={<Box as={ArrowLeft} fontSize="md" />}
            variant="ghost"
            size="sm"
            alignSelf="flex-start"
            color="text.secondary"
            fontWeight="600"
            px={2}
            ml={-2}
            _hover={{ color: "text.brand", bg: "bg.brand.subtle" }}
          >
            {t("legal.backToHome")}
          </Button>
          <Box>
            <SectionEyebrow label={eyebrow} />
          </Box>
          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "5xl" }}
            fontWeight="800"
            lineHeight="1.1"
            letterSpacing="tighter"
            color="text.primary"
          >
            {title}
          </Heading>
          <Text fontSize="sm" color="text.muted" letterSpacing="0.04em">
            {t("legal.updatedAt")} {updatedAt}
          </Text>
          <Text fontSize={{ base: "md", md: "lg" }} color="text.secondary" lineHeight="1.7">
            {intro}
          </Text>
        </Stack>

        <Stack
          spacing={{ base: 8, md: 10 }}
          color="text.secondary"
          fontSize={{ base: "sm", md: "md" }}
          lineHeight="1.75"
          sx={{
            h2: {
              fontSize: { base: "xl", md: "2xl" },
              fontWeight: "800",
              letterSpacing: "tighter",
              color: "text.primary",
              mb: 3,
              mt: 2,
            },
            h3: {
              fontSize: { base: "md", md: "lg" },
              fontWeight: "700",
              color: "text.primary",
              mb: 2,
              mt: 4,
            },
            "p + p": { mt: 3 },
            "ul, ol": { pl: 5 },
            li: { mb: 1.5 },
            strong: { color: "text.primary", fontWeight: "700" },
            a: {
              color: "text.brand",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              _hover: { textDecoration: "none" },
            },
          }}
        >
          {children}
        </Stack>
      </SiteContainer>
    </Box>
  );
};
