import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  type InputProps,
} from "@chakra-ui/react";

interface FormFieldProps extends Omit<InputProps, "onChange"> {
  label?: string;
  error?: string;
  /** Optional helper copy rendered under the input when no error is present. */
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
}

export const FormField = memo(function FormField({
  label,
  error,
  helperText,
  value,
  onChange,
  ...props
}: FormFieldProps) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
      {error ? (
        <FormErrorMessage>{error}</FormErrorMessage>
      ) : helperText ? (
        <FormHelperText fontSize="xs" color="text.secondary">
          {helperText}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
});
