import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Textarea,
  type TextareaProps,
} from "@chakra-ui/react";

interface TextAreaFieldProps extends Omit<TextareaProps, "onChange" | "value"> {
  label?: string;
  value: string;
  error?: string;
  /** Optional helper copy rendered under the textarea when no error is present. */
  helperText?: string;
  onChange: (value: string) => void;
}

function TextAreaFieldComponent({
  label,
  value,
  error,
  helperText,
  onChange,
  ...props
}: TextAreaFieldProps) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} {...props} />
      {error ? (
        <FormErrorMessage>{error}</FormErrorMessage>
      ) : helperText ? (
        <FormHelperText>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}

export const TextAreaField = memo(TextAreaFieldComponent);
