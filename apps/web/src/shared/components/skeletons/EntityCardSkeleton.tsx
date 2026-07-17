import { Box, Flex, Skeleton, SkeletonCircle } from "@chakra-ui/react";

export function EntityCardSkeleton() {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      boxShadow="shadow.card"
      p={4}
    >
      <Flex align="center" gap={3} mb={3}>
        <SkeletonCircle size="8" />
        <Box flex={1}>
          <Skeleton h="14px" w="70%" mb={1.5} borderRadius="md" />
          <Skeleton h="12px" w="45%" borderRadius="md" />
        </Box>
      </Flex>

      <Flex gap={1.5} mb={3}>
        <Skeleton h="20px" w="48px" borderRadius="full" />
        <Skeleton h="20px" w="56px" borderRadius="full" />
      </Flex>

      <Flex gap={3} pt={3} borderTopWidth="1px" borderColor="border.subtle">
        <Flex align="center" gap={1.5}>
          <Skeleton boxSize="14px" borderRadius="sm" />
          <Skeleton h="12px" w="72px" borderRadius="md" />
        </Flex>
        <Flex align="center" gap={1.5}>
          <Skeleton boxSize="14px" borderRadius="sm" />
          <Skeleton h="12px" w="80px" borderRadius="md" />
        </Flex>
      </Flex>
    </Box>
  );
}
