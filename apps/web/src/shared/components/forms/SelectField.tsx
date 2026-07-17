import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select,
  type SelectProps,
} from "@chakra-ui/react";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends Omit<SelectProps, "onChange" | "value"> {
  label?: string;
  options: SelectOption[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function SelectFieldComponent({
  label,
  options,
  value,
  error,
  onChange,
  placeholder,
  ...props
}: SelectFieldProps) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        cursor="pointer"
        color={value ? undefined : "text.muted"}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const SelectField = memo(SelectFieldComponent);
