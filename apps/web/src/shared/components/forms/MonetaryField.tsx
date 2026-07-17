import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  type InputProps,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { formatMonetary, unformatMonetary } from "@/shared/utils/monetary";

interface MonetaryFieldProps extends Omit<InputProps, "onChange" | "value"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

function MonetaryFieldComponent({ label, error, value, onChange, ...props }: MonetaryFieldProps) {
  const { t } = useTranslation("common");
  const displayValue = formatMonetary(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = unformatMonetary(e.target.value);
    onChange(raw.slice(0, 11));
  }

  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Text fontSize="sm" color="text.muted" fontWeight="500">
            {t("forms.currencySymbol")}
          </Text>
        </InputLeftElement>
        <Input
          value={displayValue}
          onChange={handleChange}
          placeholder={t("forms.monetaryPlaceholder")}
          inputMode="numeric"
          {...props}
        />
      </InputGroup>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const MonetaryField = memo(MonetaryFieldComponent);
