import { memo } from "react";
import { useMemo } from "react";
import {
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { FiChevronDown, FiChevronLeft, FiChevronRight } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);

  return pages;
}

function PaginationControlsComponent({
  page,
  totalPages,
  pageSize,
  pageSizeOptions = [12, 24, 36],
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const { t } = useTranslation("common");
  const pages = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  return (
    <Flex
      align="center"
      justify="space-between"
      w="full"
      mt={6}
      pt={4}
      borderTopWidth="1px"
      borderColor="border.subtle"
      flexWrap="wrap"
      gap={3}
    >
      <HStack spacing={1}>
        <IconButton
          aria-label={t("pagination.previousPage")}
          icon={<Icon as={FiChevronLeft} boxSize={4} />}
          size="sm"
          variant="ghost"
          color="text.secondary"
          isDisabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          _hover={{ bg: "bg.hover" }}
        />

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <Text key={`ellipsis-${i}`} fontSize="sm" color="text.muted" px={1} userSelect="none">
              ...
            </Text>
          ) : (
            <Button
              key={p}
              size="sm"
              minW={8}
              h={8}
              variant={p === page ? "solid" : "ghost"}
              colorScheme={p === page ? "brand" : undefined}
              color={p === page ? undefined : "gray.600"}
              fontWeight={p === page ? "700" : "500"}
              fontSize="sm"
              _hover={p === page ? undefined : { bg: "gray.100" }}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}

        <IconButton
          aria-label={t("pagination.nextPage")}
          icon={<Icon as={FiChevronRight} boxSize={4} />}
          size="sm"
          variant="ghost"
          color="text.secondary"
          isDisabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          _hover={{ bg: "bg.hover" }}
        />
      </HStack>

      <HStack spacing={2}>
        <Text fontSize="xs" color="text.secondary">
          {t("pagination.itemsPerPage")}
        </Text>
        {onPageSizeChange ? (
          <Menu>
            <MenuButton
              as={Button}
              size="xs"
              variant="ghost"
              rightIcon={<Icon as={FiChevronDown} boxSize={3} />}
              color="text.secondary"
              fontWeight="600"
              _hover={{ bg: "bg.hover" }}
            >
              {pageSize}
            </MenuButton>
            <MenuList minW="80px" fontSize="sm">
              {pageSizeOptions.map((option) => (
                <MenuItem
                  key={option}
                  fontWeight={option === pageSize ? "700" : "400"}
                  color={option === pageSize ? "brand.600" : undefined}
                  onClick={() => onPageSizeChange(option)}
                >
                  {option}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        ) : (
          <Text fontSize="xs" fontWeight="600" color="text.secondary">
            {pageSize}
          </Text>
        )}
      </HStack>
    </Flex>
  );
}

export const PaginationControls = memo(PaginationControlsComponent);
