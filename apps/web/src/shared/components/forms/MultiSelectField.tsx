import { memo } from "react";
import {
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { FiChevronDown } from "@/shared/components/icons";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectFieldProps {
  label?: string;
  value: string[];
  options: MultiSelectOption[];
  error?: string;
  onChange: (value: string[]) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

function MultiSelectFieldComponent({
  label,
  value,
  options,
  error,
  onChange,
  isDisabled,
  placeholder = "Selecione...",
}: MultiSelectFieldProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const selectedSet = new Set(value);

  function handleToggle(optionValue: string) {
    if (selectedSet.has(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  function handleRemove(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue));
  }

  const selectedLabels = options.filter((o) => selectedSet.has(o.value));

  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Popover
        isOpen={isOpen}
        onOpen={isDisabled ? undefined : onOpen}
        onClose={onClose}
        placement="bottom-start"
        matchWidth
      >
        <PopoverTrigger>
          <Flex
            borderWidth="1.5px"
            borderColor={isOpen ? "brand.400" : "gray.200"}
            borderRadius="sm"
            px={3}
            py={2}
            minH="40px"
            align="center"
            cursor={isDisabled ? "not-allowed" : "pointer"}
            opacity={isDisabled ? 0.7 : 1}
            bg={isDisabled ? "gray.50" : "white"}
            _hover={isDisabled ? undefined : { borderColor: "gray.300" }}
            boxShadow={isOpen ? "input-focus" : "none"}
            transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
          >
            <Flex flex={1} gap={1.5} flexWrap="wrap" align="center" minW={0}>
              {selectedLabels.length > 0 ? (
                selectedLabels.map((opt) => (
                  <Tag
                    key={opt.value}
                    size="sm"
                    colorScheme="brand"
                    variant="subtle"
                    borderRadius="sm"
                  >
                    <TagLabel>{opt.label}</TagLabel>
                    {!isDisabled && (
                      <TagCloseButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(opt.value);
                        }}
                      />
                    )}
                  </Tag>
                ))
              ) : (
                <Text fontSize="sm" color="text.muted">
                  {placeholder}
                </Text>
              )}
            </Flex>
            <Icon as={FiChevronDown} boxSize={4} color="text.muted" flexShrink={0} ml={2} />
          </Flex>
        </PopoverTrigger>
        <PopoverContent
          w="100%"
          borderWidth="1.5px"
          borderColor="border.default"
          borderRadius="lg"
          boxShadow="shadow.card"
          _focusVisible={{ outline: "none" }}
        >
          <PopoverBody p={1}>
            <Flex direction="column" maxH="200px" overflowY="auto">
              {options.map((option) => (
                <Flex
                  key={option.value}
                  align="center"
                  gap={2}
                  px={3}
                  py={2}
                  borderRadius="xs"
                  cursor="pointer"
                  transition="background 0.15s ease"
                  _hover={{ bg: "bg.hover" }}
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    isChecked={selectedSet.has(option.value)}
                    colorScheme="brand"
                    pointerEvents="none"
                    size="sm"
                    borderColor="border.strong"
                  />
                  <Text fontSize="sm" color="text.primary">
                    {option.label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const MultiSelectField = memo(MultiSelectFieldComponent);
