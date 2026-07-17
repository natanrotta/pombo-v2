import { Suspense, lazy } from "react";
import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import type { DateFieldProps } from "./DateFieldPicker";

export type { DateFieldProps } from "./DateFieldPicker";

// react-datepicker (+ its CSS) stays out of every eager route chunk — the
// picker loads on demand while this fallback renders an identical-looking
// disabled input, so the swap is invisible (no layout shift).
const DateFieldPicker = lazy(() => import("./DateFieldPicker"));

function DateFieldFallback({ label, error, placeholder }: DateFieldProps) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Input placeholder={placeholder} isDisabled cursor="pointer" />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export function DateField(props: DateFieldProps) {
  return (
    <Suspense fallback={<DateFieldFallback {...props} />}>
      <DateFieldPicker {...props} />
    </Suspense>
  );
}
