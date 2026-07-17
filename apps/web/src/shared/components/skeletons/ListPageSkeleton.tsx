import { Flex, SimpleGrid } from "@chakra-ui/react";
import { EntityCardSkeleton } from "./EntityCardSkeleton";
import { FilterBarSkeleton } from "./FilterBarSkeleton";

interface ListPageSkeletonProps {
  columns?: Record<string, number>;
  cardCount?: number;
  showFilter?: boolean;
}

export function ListPageSkeleton({
  columns = { base: 1, md: 2, xl: 3 },
  cardCount = 6,
  showFilter = true,
}: ListPageSkeletonProps) {
  return (
    <Flex direction="column" gap={4}>
      {showFilter && <FilterBarSkeleton />}
      <SimpleGrid columns={columns} gap={4}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <EntityCardSkeleton key={i} />
        ))}
      </SimpleGrid>
    </Flex>
  );
}
