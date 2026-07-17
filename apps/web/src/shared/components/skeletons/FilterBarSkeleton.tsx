import { Flex, Skeleton } from "@chakra-ui/react";

export function FilterBarSkeleton() {
  return (
    <Flex align="center" gap={3}>
      <Skeleton h="36px" flex={1} maxW={{ md: "360px" }} minW="200px" borderRadius="md" />
      <Skeleton h="32px" w="120px" borderRadius="md" ml="auto" />
    </Flex>
  );
}
