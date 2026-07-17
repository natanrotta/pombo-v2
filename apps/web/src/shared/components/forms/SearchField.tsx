import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  type InputProps,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiSearch, FiX } from "@/shared/components/icons";

interface SearchFieldProps extends Omit<InputProps, "type"> {
  onClear?: () => void;
  variant?: "default" | "rounded";
  label?: string;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

function SearchFieldComponent({
  onClear,
  variant = "default",
  value,
  label,
  error,
  inputRef,
  m,
  mt,
  mb,
  ml,
  mr,
  mx,
  my,
  ...props
}: SearchFieldProps) {
  const { t } = useTranslation("common");
  const hasValue = Boolean(value && String(value).length > 0);

  return (
    // Margin props target the FormControl, NOT the inner Input: a margin on the
    // input inflates the flex InputGroup's height, which pushes the absolutely
    // positioned (stretched) search icon below the input's centre.
    <FormControl isInvalid={Boolean(error)} m={m} mt={mt} mb={mb} ml={ml} mr={mr} mx={mx} my={my}>
      {label && <FormLabel>{label}</FormLabel>}
      {/* data-animate-host: lets the FiSearch icon animate on focus/hover of the group */}
      <InputGroup data-animate-host>
        {/* top/bottom 0 + h="auto" stretches the element to the input's full height
            regardless of the input height (a percentage height can fail to resolve);
            the icon then centers reliably against the placeholder. */}
        <InputLeftElement pointerEvents="none" color="text.muted" top={0} bottom={0} h="auto">
          <Icon as={FiSearch} boxSize={4} />
        </InputLeftElement>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          borderRadius={variant === "rounded" ? "full" : undefined}
          {...props}
        />
        {hasValue && onClear && (
          <InputRightElement top={0} bottom={0} h="auto">
            <IconButton
              aria-label={t("forms.clearSearch")}
              icon={<Icon as={FiX} />}
              variant="ghost"
              size="xs"
              color="text.muted"
              onClick={onClear}
            />
          </InputRightElement>
        )}
      </InputGroup>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}

export const SearchField = memo(SearchFieldComponent);
