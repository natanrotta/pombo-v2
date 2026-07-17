import { Box, Flex, Skeleton } from "@chakra-ui/react";
import { FadeIn } from "@/shared/components/animations/FadeIn";
import { SectionCardSkeleton } from "./SectionCardSkeleton";

export function DashboardSkeleton() {
  return (
    <>
      {/* Header */}
      <FadeIn delay={0.05}>
        <Flex justify="space-between" align="flex-end" mb={6} gap={6} flexWrap="wrap">
          <Box>
            <Skeleton h="12px" w="120px" mb={2} borderRadius="md" />
            <Skeleton h="24px" w="280px" mb={2} borderRadius="md" />
            <Skeleton h="14px" w="360px" borderRadius="md" />
          </Box>
          <Flex gap={2}>
            <Skeleton h="32px" w="120px" borderRadius="md" />
            <Skeleton h="32px" w="120px" borderRadius="md" />
          </Flex>
        </Flex>
      </FadeIn>

      {/* Hero: full-width unified timeline. */}
      <FadeIn delay={0.1}>
        <Box mb={4}>
          <SectionCardSkeleton lines={9} height="520px" />
        </Box>
      </FadeIn>

      {/* Activity chart */}
      <FadeIn delay={0.15}>
        <Box mb={4}>
          <SectionCardSkeleton lines={4} />
        </Box>
      </FadeIn>

      {/* Month summary */}
      <FadeIn delay={0.2}>
        <SectionCardSkeleton lines={2} />
      </FadeIn>
    </>
  );
}
