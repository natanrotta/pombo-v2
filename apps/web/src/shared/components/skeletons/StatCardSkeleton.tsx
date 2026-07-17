import { Box, Flex, Skeleton } from "@chakra-ui/react";

export function StatCardSkeleton() {
  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      boxShadow="shadow.card"
      borderRadius="lg"
      p={{ base: 4, md: 5 }}
    >
      <Flex justify="space-between" align="flex-start">
        <Box flex={1}>
          <Skeleton h="12px" w="100px" mb={3} borderRadius="md" />
          <Skeleton h="28px" w="64px" mb={3} borderRadius="md" />
          <Skeleton h="12px" w="80px" borderRadius="md" />
        </Box>
        <Skeleton boxSize="40px" borderRadius="md" />
      </Flex>
    </Box>
  );
}
