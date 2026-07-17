import { Box, Flex, Skeleton, SimpleGrid } from "@chakra-ui/react";

interface CalendarSkeletonProps {
  /** Number of week rows in the grid. 6 covers most months including overflow. */
  weeks?: number;
}

/**
 * Loading skeleton for month-grid calendars (Agenda / Escala). Mirrors the
 * shape of `CalendarGrid` so the loading state doesn't visually collapse
 * when data resolves. Uses `bg.surface` panel + cell borders to match
 * the real calendar's chrome.
 */
export function CalendarSkeleton({ weeks = 5 }: CalendarSkeletonProps) {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      boxShadow="shadow.card"
      overflow="hidden"
    >
      {/* Header strip: month label + nav buttons + filter chips */}
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 3, md: 5 }}
        py={3}
        borderBottomWidth="1px"
        borderColor="border.subtle"
        gap={3}
      >
        <Flex align="center" gap={2}>
          <Skeleton h="24px" w="24px" borderRadius="md" />
          <Skeleton h="20px" w="140px" borderRadius="md" />
          <Skeleton h="24px" w="24px" borderRadius="md" />
        </Flex>
        <Flex gap={2}>
          <Skeleton h="28px" w="80px" borderRadius="md" />
          <Skeleton h="28px" w="80px" borderRadius="md" />
        </Flex>
      </Flex>

      {/* Weekday labels */}
      <SimpleGrid columns={7} px={{ base: 2, md: 4 }} pt={3} pb={1}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} h="12px" w="32px" mx="auto" borderRadius="sm" />
        ))}
      </SimpleGrid>

      {/* Month grid: weeks × 7 day cells with a couple of "shift" bars per cell */}
      <SimpleGrid columns={7} px={{ base: 2, md: 4 }} pb={4} gap={1}>
        {Array.from({ length: weeks * 7 }).map((_, i) => (
          <Box
            key={i}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="md"
            minH={{ base: "70px", md: "110px" }}
            p={2}
          >
            <Skeleton h="10px" w="18px" mb={2} borderRadius="sm" />
            {i % 4 === 0 && <Skeleton h="14px" w="80%" mb={1} borderRadius="sm" />}
            {i % 5 === 0 && <Skeleton h="14px" w="60%" borderRadius="sm" />}
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
