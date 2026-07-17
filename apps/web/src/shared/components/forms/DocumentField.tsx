import { memo } from "react";
import { FormControl, FormErrorMessage, FormLabel, Input, type InputProps } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { formatDocument, unformatDocument } from "@/shared/utils/document";

interface DocumentFieldProps extends Omit<InputProps, "onChange" | "value"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

function DocumentFieldComponent({ label, error, value, onChange, ...props }: DocumentFieldProps) {
  const { t } = useTranslation("common");
  const displayValue = formatDocument(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = unformatDocument(e.target.value);
    onChange(raw);
  }

  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Input
        value={displayValue}
        onChange={handleChange}
        placeholder={t("forms.documentPlaceholder")}
        {...props}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const DocumentField = memo(DocumentFieldComponent);
