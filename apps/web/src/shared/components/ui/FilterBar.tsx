import { memo } from "react";
import { Box, Flex, Icon, Input, InputGroup, InputLeftElement, InputRightElement } from "@chakra-ui/react";
import { FiSearch, FiX } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

function FilterBarComponent({ searchPlaceholder, searchValue, onSearchChange }: FilterBarProps) {
  const { t } = useTranslation("common");

  return (
    <Flex align="center" gap={2.5} flexWrap="wrap">
      {/* data-animate-host: lets the nested FiSearch icon animate on focus/hover of the group */}
      <InputGroup
        data-animate-host
        flex={1}
        minW={{ base: "0", md: "200px" }}
        maxW={{ md: "360px" }}
      >
        <InputLeftElement pointerEvents="none" h={{ base: "40px", md: "36px" }}>
          <Icon as={FiSearch} color="text.muted" boxSize={4} />
        </InputLeftElement>
        <Input
          type="text"
          placeholder={searchPlaceholder ?? t("filter.searchPlaceholder")}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          bg="bg.surface"
          borderColor="border.default"
          borderWidth="1.5px"
          borderRadius="sm"
          size="sm"
          h={{ base: "40px", md: "36px" }}
          fontSize={{ base: "16px", md: "sm" }}
          pl={10}
          _hover={{ borderColor: "border.strong" }}
          _focus={{ borderColor: "border.focus", boxShadow: "input-focus" }}
        />
        {searchValue && (
          <InputRightElement h="36px">
            <Box
              as="button"
              onClick={() => onSearchChange("")}
              color="text.muted"
              _hover={{ color: "text.secondary" }}
              cursor="pointer"
            >
              <Icon as={FiX} boxSize={3.5} />
            </Box>
          </InputRightElement>
        )}
      </InputGroup>
    </Flex>
  );
}

export const FilterBar = memo(FilterBarComponent);
