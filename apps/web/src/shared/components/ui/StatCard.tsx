import { memo } from "react";
import { Box, Flex, Icon, Stat, StatHelpText, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import type { IconType } from "@/shared/components/icons";
import { SectionCard } from "@/shared/components/ui/SectionCard";

/** Accent palette for the icon chip + value. `brand` is the default; the
 *  others pull from the shared semantic status tokens (never raw hex). */
export type StatCardTone = "brand" | "success" | "info" | "neutral" | "error";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: IconType;
  trend?: "up" | "down" | "neutral";
  tone?: StatCardTone;
}

const trendColors = {
  up: "text.accent",
  down: "status.error.fg",
  neutral: "text.secondary",
} as const;

const toneStyles = {
  brand: { bg: "bg.brand.subtle", border: "border.brand", fg: "text.brand" },
  success: {
    bg: "status.success.bg",
    border: "status.success.border",
    fg: "status.success.fg",
  },
  info: {
    bg: "status.info.bg",
    border: "status.info.border",
    fg: "status.info.fg",
  },
  neutral: {
    bg: "status.neutral.bg",
    border: "status.neutral.border",
    fg: "status.neutral.fg",
  },
  error: {
    bg: "status.error.bg",
    border: "status.error.border",
    fg: "status.error.fg",
  },
} as const;

export const StatCard = memo(function StatCard({
  label,
  value,
  hint,
  icon,
  trend = "neutral",
  tone = "brand",
}: StatCardProps) {
  const accent = toneStyles[tone];
  return (
    <SectionCard>
      <Flex justify="space-between" align="flex-start">
        <Stat>
          <StatLabel color="text.secondary" fontWeight="500">
            {label}
          </StatLabel>
          <StatNumber mt={2} fontSize={{ base: "2xl", md: "3xl" }} color={accent.fg}>
            {value}
          </StatNumber>
          <StatHelpText mb={0} mt={2}>
            <Text color={trendColors[trend]} fontWeight="600" as="span">
              {hint}
            </Text>
          </StatHelpText>
        </Stat>

        <Box
          p={2.5}
          borderRadius="md"
          bg={accent.bg}
          color={accent.fg}
          borderWidth="1px"
          borderColor={accent.border}
        >
          <Icon as={icon} boxSize={5} />
        </Box>
      </Flex>
    </SectionCard>
  );
});
