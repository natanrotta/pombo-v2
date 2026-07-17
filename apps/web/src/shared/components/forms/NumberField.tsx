import { memo } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  type NumberInputProps,
} from "@chakra-ui/react";

interface NumberFieldProps extends Omit<NumberInputProps, "onChange" | "value"> {
  label?: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}

function NumberFieldComponent({ label, value, error, onChange, ...props }: NumberFieldProps) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <NumberInput
        value={value}
        onChange={(_, valueAsNumber) => onChange(Number.isNaN(valueAsNumber) ? 0 : valueAsNumber)}
        {...props}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const NumberField = memo(NumberFieldComponent);
