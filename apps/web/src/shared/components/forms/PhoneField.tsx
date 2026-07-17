import { memo } from "react";
import { FormControl, FormErrorMessage, FormLabel, Input, type InputProps } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { maskPhoneBr, unformatPhone } from "@/shared/utils/phone";

interface PhoneFieldProps extends Omit<InputProps, "onChange" | "value"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

function PhoneFieldComponent({ label, error, value, onChange, ...props }: PhoneFieldProps) {
  const { t } = useTranslation("common");
  const displayValue = maskPhoneBr(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = unformatPhone(e.target.value);
    onChange(raw);
  }

  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Input
        value={displayValue}
        onChange={handleChange}
        placeholder={t("forms.phonePlaceholder")}
        {...props}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const PhoneField = memo(PhoneFieldComponent);
