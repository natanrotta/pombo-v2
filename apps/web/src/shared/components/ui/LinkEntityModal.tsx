import { useState } from "react";
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { SearchField } from "@/shared/components/forms/SearchField";
import { useServerSearch } from "@/shared/hooks/useServerSearch";
import { useInfiniteScrollSentinel } from "@/shared/hooks/useInfiniteScrollSentinel";
import type { PaginatedResponse, PaginationParams } from "@/shared/types/pagination";

export interface LinkEntityItem {
  id: string;
  name: string;
  secondaryText: string;
}

interface LinkEntityModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  linkedIds: string[];
  onLink: (id: string) => Promise<unknown>;
  queryKey: readonly unknown[];
  fetchFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>;
  mapItem: (item: T) => LinkEntityItem;
}

export function LinkEntityModal<T>({
  isOpen,
  onClose,
  title,
  searchPlaceholder,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  linkedIds,
  onLink,
  queryKey,
  fetchFn,
  mapItem,
}: LinkEntityModalProps<T>) {
  const { t } = useTranslation("common");
  const [isLinking, setIsLinking] = useState(false);

  const { items, search, setSearch, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useServerSearch({ queryKey, fetchFn, enabled: isOpen });

  const linkedSet = new Set(linkedIds);
  const available = items.filter((item) => {
    const mapped = mapItem(item);
    return !linkedSet.has(mapped.id);
  });

  const { sentinelRef, rootRef } = useInfiniteScrollSentinel({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    rootMargin: "0px",
  });

  async function handleLink(id: string) {
    setIsLinking(true);
    try {
      await onLink(id);
      onClose();
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(2px)" />
      <ModalContent borderRadius="lg">
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SearchField
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            mb={4}
          />

          {isLoading ? (
            <Flex justify="center" py={6}>
              <Spinner size="sm" color="brand.500" />
            </Flex>
          ) : available.length === 0 ? (
            <Flex direction="column" align="center" gap={3} py={4}>
              <Text fontSize="sm" color="text.muted" textAlign="center">
                {emptyMessage}
              </Text>
              {emptyActionLabel && onEmptyAction && (
                <Button size="sm" colorScheme="brand" variant="outline" onClick={onEmptyAction}>
                  {emptyActionLabel}
                </Button>
              )}
            </Flex>
          ) : (
            <Flex ref={rootRef} direction="column" gap={1} maxH="55vh" overflowY="auto">
              {available.map((item) => {
                const mapped = mapItem(item);
                return (
                  <Flex
                    key={mapped.id}
                    align="center"
                    justify="space-between"
                    gap={3}
                    p={3}
                    borderWidth="1px"
                    borderColor="border.subtle"
                    borderRadius="md"
                    _hover={{ bg: "bg.hover" }}
                  >
                    {/* Bounded text column (minW=0 + flex) so a long description
                        truncates instead of running under the action button. */}
                    <Flex direction="column" flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                        {mapped.name}
                      </Text>
                      <Text fontSize="xs" color="text.secondary" noOfLines={2}>
                        {mapped.secondaryText}
                      </Text>
                    </Flex>
                    <Button
                      size="xs"
                      colorScheme="brand"
                      onClick={() => handleLink(mapped.id)}
                      isLoading={isLinking}
                      flexShrink={0}
                    >
                      {t("actions.link")}
                    </Button>
                  </Flex>
                );
              })}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {isFetchingNextPage && (
                <Flex justify="center" py={2}>
                  <Spinner size="xs" color="text.muted" />
                </Flex>
              )}
            </Flex>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
