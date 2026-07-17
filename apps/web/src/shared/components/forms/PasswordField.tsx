import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEye, FiEyeOff } from "@/shared/components/icons";

interface PasswordFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

function PasswordFieldComponent({
  label,
  value,
  error,
  onChange,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormControl isInvalid={Boolean(error)}>
      <FormLabel>{label}</FormLabel>
      <InputGroup>
        <Input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <InputRightElement>
          <IconButton
            aria-label={isVisible ? t("forms.hidePassword") : t("forms.showPassword")}
            icon={isVisible ? <FiEyeOff /> : <FiEye />}
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible((state) => !state)}
          />
        </InputRightElement>
      </InputGroup>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const PasswordField = memo(PasswordFieldComponent);
